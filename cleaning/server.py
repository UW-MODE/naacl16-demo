import flask
from flask import Flask, request, g, abort, render_template
import collections
import time
import os
import numpy as np
import pickle
import lime
import lime.lime_text
import argparse
import generate_json
import sklearn

app = Flask(__name__)

def LoadFilesDataset(path_data, label_names, cv_prefix ):                                 
  # Loads datasets like the polarity one                                                  
  train_data = []
  train_labels = []
  test_data = []
  test_labels = []
  for l, label in enumerate(label_names):                                                 
    dirname = os.path.join(path_data, label)
    for fname in os.listdir(dirname):
      with open(os.path.join(dirname, fname), 'r') as f:                                  
        content = f.read()                                                                
        try:
          content.decode('utf8')
        except: 
          continue
        if fname.startswith(cv_prefix):                                                   
          test_data.append(content)                                                       
          test_labels.append(l)                                                           
        else:
          train_data.append(content)                                                      
          train_labels.append(l)
  return train_data, np.array(train_labels), test_data, np.array(test_labels), label_names

def clean_vectors_wordlist(input_vectors, vectorizer, wordlist):
  ret_vectors = input_vectors.copy()
  words = np.array([vectorizer.vocabulary_[x] for x in set(wordlist) if x in vectorizer.vocabulary_])
  ret_vectors[:, words] = 0
  return ret_vectors

class Computer:
    def __init__(self):
        train, self.train_labels, test, self.test_labels = generate_json.Load20NG()
        self.vectorizer = sklearn.feature_extraction.text.CountVectorizer(binary=True,
                lowercase=False) 
        self.vectorizer.fit(train + test)                                                          
        self.train_vectors = self.vectorizer.transform(train)
        self.test_vectors = self.vectorizer.transform(test)                                             
        svm = sklearn.svm.SVC(probability=True, kernel='rbf', C=10,gamma=0.001)               
        svm.fit(self.train_vectors, self.train_labels)                                                  


        train_dataz, train_labelsz, test_dataz, test_labelsz, labels_name = LoadFilesDataset('atheism', ['atheism', 'christianity'], 'bla')
        new_data = self.vectorizer.transform(train_dataz)
        new_labels = train_labelsz
        K = np.min(np.bincount(new_labels))
        self.new_data=self.vectorizer.transform(train_dataz[:K] + train_dataz[-K:])
        self.new_labels = np.hstack((train_labelsz[:K], train_labelsz[-K:]))
        self.old_accuracy = sklearn.metrics.accuracy_score(self.new_labels, svm.predict(self.new_data)) * 100
    def accuracy(self, bad_words):
        stopwords = bad_words.split(',')
        clean_train_vectors = clean_vectors_wordlist(self.train_vectors, self.vectorizer, stopwords)
        svm = sklearn.svm.SVC(probability=True, kernel='rbf', C=10,gamma=0.001)               
        svm.fit(clean_train_vectors, self.train_labels)                                                  
        return sklearn.metrics.accuracy_score(self.new_labels, svm.predict(self.new_data)) * 100
        
@app.route('/')
def index():
    return render_template('temp_index.html')

@app.route('/api/finish', methods=['POST'])
def explain():
    #print explainer.explain_instance(3)
    params = request.get_json(force=True)
    global computer
    ret = {'old_accuracy' : computer.old_accuracy}
    ret['new_accuracy'] = computer.accuracy(params['bad_words'])
    return flask.json.jsonify(ret)

def main():
    global computer
    computer = Computer()
    parser = argparse.ArgumentParser(description='Do some stuff')
    args = parser.parse_args()
    app.run(debug=True, port=8113)

if __name__ == '__main__':
    main()
