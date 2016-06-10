import lime
import sklearn
import numpy as np
import sklearn
import sklearn.ensemble
import sklearn.metrics
import sklearn.feature_extraction
import csv
import random
from sklearn.datasets import fetch_20newsgroups
from sklearn.externals import joblib

def LoadPoliteness(path, percent_test=.05):
    data = []
    labels = []
    with open(path) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            data.append((row['Request'], float(row['Normalized Score'])))
    data = sorted(data, key=lambda x:x[1])
    quartile_len = len(data) / 4
    negatives = [x[0] for x in data[:quartile_len]]
    positives = [x[0] for x in data[-quartile_len:]]
    random.seed(1)
    random.shuffle(positives)
    random.shuffle(negatives)
    size_test = int(len(negatives) * percent_test)
    size_train = len(negatives) - size_test
    train = positives[:size_train] + negatives[:size_train]
    train_labels = np.hstack((np.ones(size_train), np.zeros(size_train))).astype('int')
    test = positives[size_train:] + negatives[size_train:]
    test_labels = np.hstack((np.ones(size_test), np.zeros(size_test))).astype('int')
    return train, train_labels, test, test_labels

def LearnPoliteness():
    train, train_labels, test, test_labels = LoadPoliteness('data/stanford_politeness/wikipedia.annotated.csv')
    vectorizer = sklearn.feature_extraction.text.CountVectorizer(binary=True, lowercase=False, min_df=10)
    vectorizer.fit(train + test)
    train_vectors = vectorizer.transform(train)
    test_vectors = vectorizer.transform(test)
    svm = sklearn.svm.SVC(probability=True, kernel='rbf', C=10,gamma=0.001)
    svm.fit(train_vectors, train_labels)
    rf = sklearn.ensemble.RandomForestClassifier(n_estimators=500, n_jobs=10)
    rf.fit(train_vectors, train_labels)
    lr = sklearn.linear_model.LogisticRegression()
    lr.fit(train_vectors, train_labels)
    ret = {} 
    ret['svm'] = {}
    ret['svm']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, svm.predict(test_vectors))
    ret['svm']['model'] = svm

    ret['rf'] = {}
    ret['rf']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, rf.predict(test_vectors))
    ret['rf']['model'] = rf

    ret['lr'] = {}
    ret['lr']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, lr.predict(test_vectors))
    ret['lr']['model'] = lr

    ret['vectorizer'] = vectorizer
    ret['class_names'] = ['rude', 'polite']
    return ret
def Load20NG():
    cats = ['alt.atheism', 'soc.religion.christian']
    newsgroups_train = fetch_20newsgroups(subset='train', categories=cats)
    newsgroups_test = fetch_20newsgroups(subset='test', categories=cats)
    train, train_labels = newsgroups_train.data, newsgroups_train.target
    test, test_labels = newsgroups_test.data, newsgroups_test.target
    return train, train_labels, test, test_labels

def Learn20NG():
    train, train_labels, test, test_labels = Load20NG()
    vectorizer = sklearn.feature_extraction.text.CountVectorizer(binary=True, lowercase=False)
    vectorizer.fit(train + test)
    train_vectors = vectorizer.transform(train)
    test_vectors = vectorizer.transform(test)
    svm = sklearn.svm.SVC(probability=True, kernel='rbf', C=10,gamma=0.001)
    svm.fit(train_vectors, train_labels)
    rf = sklearn.ensemble.RandomForestClassifier(n_estimators=500, n_jobs=10)
    rf.fit(train_vectors, train_labels)
    lr = sklearn.linear_model.LogisticRegression()
    lr.fit(train_vectors, train_labels)
    ret = {} 
    ret['svm'] = {}
    ret['svm']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, svm.predict(test_vectors))
    ret['svm']['model'] = svm

    ret['rf'] = {}
    ret['rf']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, rf.predict(test_vectors))
    ret['rf']['model'] = rf

    ret['lr'] = {}
    ret['lr']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, lr.predict(test_vectors))
    ret['lr']['model'] = lr

    ret['vectorizer'] = vectorizer
    ret['class_names'] = ['Atheism', 'Christian']
    return ret

def LoadSentimentFile(path):
    data = []
    labels = []
    for line in open(path):
        x, y = line.strip().split('\t')
        data.append(x)
        labels.append(int(y))
    return data, labels

def LoadSentiment():
    train, train_labels = LoadSentimentFile('data/sentiment-train')
    test, test_labels = LoadSentimentFile('data/sentiment-test')
    return train, train_labels, test, test_labels

def LearnSentiment():
    train, train_labels, test, test_labels = LoadSentiment()
    vectorizer = sklearn.feature_extraction.text.CountVectorizer(binary=True, lowercase=False, min_df=10)   
    vectorizer.fit(train + test)                                                          
    train_vectors = vectorizer.transform(train)                                           
    test_vectors = vectorizer.transform(test)                                             
    rf = sklearn.ensemble.RandomForestClassifier(n_estimators=500, n_jobs=10)
    rf.fit(train_vectors, train_labels)                                                   
    lr = sklearn.linear_model.LogisticRegression()                                        
    lr.fit(train_vectors, train_labels)   
    ret = {} 
    ret['rf'] = {}
    ret['rf']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, rf.predict(test_vectors))
    ret['rf']['model'] = rf

    ret['lr'] = {}
    ret['lr']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, lr.predict(test_vectors))
    ret['lr']['model'] = lr

    ret['vectorizer'] = vectorizer
    ret['class_names'] = ['Negative', 'Positive']
    return ret


def main():
    ret = {}
    ret['politeness'] = LearnPoliteness()
    ret['20ng'] = Learn20NG()
    ret['sentiment'] = LearnSentiment()
    joblib.dump(ret, 'models/models')
if __name__ == '__main__':
    main()
