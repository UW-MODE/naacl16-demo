import lime
import sklearn
import numpy as np
import sklearn
import sklearn.ensemble
import sklearn.metrics
import sklearn.feature_extraction
import csv
import random

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
    train, train_labels, test, test_labels = LoadPoliteness('/Users/marcotcr/phd/datasets/stanford_politeness/wikipedia.annotated.csv')
    vectorizer = sklearn.feature_extraction.text.CountVectorizer(lowercase=False, min_df=10)
    vectorizer.fit(train + test)
    train_vectors = vectorizer.transform(train)
    test_vectors = vectorizer.transform(test)
    svm = sklearn.svm.SVC(probability=True, kernel='rbf', C=10,gamma=0.001)
    svm.fit(train_vectors, train_labels)
    rf = sklearn.ensemble.RandomForestClassifier(n_estimators=500)
    rf.fit(train_vectors, train_labels)
    ret = {} 
    ret['svm'] = {}
    ret['svm']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, svm.predict(test_vectors))
    ret['svm']['model'] = svm

    ret['rf'] = {}
    ret['rf']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, rf.predict(test_vectors))
    ret['rf']['model'] = rf
def main():
    global explainer
    explainer = Explainer()
    app.run(debug=True, port=8112)

if __name__ == '__main__':
    main()
