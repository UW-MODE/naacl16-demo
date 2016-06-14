import lime
import sklearn
import numpy as np
import embedding_forest
import sklearn
import sklearn.ensemble
import sklearn.metrics
import sklearn.feature_extraction
import csv
import random
from sklearn.datasets import fetch_20newsgroups
from sklearn.externals import joblib
import itertools
import lstm
import json
import collections


def clean_vectors_wordlist(input_vectors, vectorizer, wordlist):
  ret_vectors = input_vectors.copy()
  words = np.array([vectorizer.vocabulary_[x] for x in set(wordlist) if x in vectorizer.vocabulary_])
  ret_vectors[:, words] = 0
  return ret_vectors

def GetSuggestions(model, test_data, raw_data, test_labels):
    test_labels = np.array(test_labels)
    preds = (model.predict_proba(test_data)[:,1] > .5).astype(int)
    fp = np.where((preds == 1) * (test_labels == 0))[0]
    tp = np.where((preds == 1) * (test_labels == 1))[0]
    fn = np.where((preds == 0) * (test_labels == 1))[0]
    tn = np.where((preds == 0) * (test_labels == 0))[0]
    suggestions = []
    add_suggestion = lambda title, i: suggestions.append({'title' : 'ID %d (%s)' % (i, title), 'text' : raw_data[i], 'true_class' : test_labels[i]}) if i else None
    for a, b, c, d in itertools.izip_longest(fp[:15], tp[:15], fn[:15], tn[:15]):
        add_suggestion('FP', a) 
        add_suggestion('TP', b) 
        add_suggestion('FN', c) 
        add_suggestion('TN', d) 
    return suggestions

def GetSuggestionsPair(model1, model2, test_data, raw_data, test_labels, nn=False):
    test_labels = np.array(test_labels)
    preds1 = (model1.predict_proba(test_data)[:,1] > .5).astype(int)
    if nn:
        preds2 = (model2.predict_proba(raw_data)[:,1] > .5).astype(int)
    else:
        preds2 = (model2.predict_proba(test_data)[:,1] > .5).astype(int)
    fp_fp = np.where((preds1 == 1) * (test_labels == 0) * (preds2 == 1))[0]
    fp_tn = np.where((preds1 == 1) * (test_labels == 0) * (preds2 == 0))[0]
    tn_fp = np.where((preds1 == 0) * (test_labels == 0) * (preds2 == 1))[0]
    tn_tn = np.where((preds1 == 0) * (test_labels == 0) * (preds2 == 0))[0]

    fn_fn = np.where((preds1 == 0) * (test_labels == 1) * (preds2 == 0))[0]
    fn_tp = np.where((preds1 == 0) * (test_labels == 1) * (preds2 == 1))[0]
    tp_tp = np.where((preds1 == 1) * (test_labels == 1) * (preds2 == 1))[0]
    tp_fn = np.where((preds1 == 1) * (test_labels == 1) * (preds2 == 0))[0]

    suggestions = []
    add_suggestion = lambda title, i: suggestions.append({'title' : 'ID %d (%s)' % (i, title), 'text' : raw_data[i], 'true_class' : test_labels[i]}) if i else None
    for a, b, c, d , e, f, g, h in itertools.izip_longest(fp_fp[:15], fp_tn[:15], tn_fp[:15], tn_tn[:15], fn_fn[:15], fn_tp[:15], tp_fn[:15], tp_tp[:15]):
        add_suggestion('FP-FP', a) 
        add_suggestion('FP-TN', b) 
        add_suggestion('TN-FP', c) 
        add_suggestion('TN-TN', d) 
        add_suggestion('FN-FN', e) 
        add_suggestion('FN-TP', f) 
        add_suggestion('TP-FN', g) 
        add_suggestion('TP-TP', h) 
    return suggestions
    

def LoadPoliteness(path, percent_test=.1):
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

    suggestions = {}
    suggestions['lr'] = GetSuggestions(lr, test_vectors, test, test_labels)
    suggestions['rf'] = GetSuggestions(rf, test_vectors, test, test_labels)
    suggestions['svm'] = GetSuggestions(svm, test_vectors, test, test_labels)
    suggestions['lr-rf'] = GetSuggestionsPair(lr, rf, test_vectors, test, test_labels)
    suggestions['lr-svm'] = GetSuggestionsPair(lr, svm, test_vectors, test, test_labels)
    suggestions['rf-svm'] = GetSuggestionsPair(rf, svm, test_vectors, test, test_labels)

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
    return ret, suggestions
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
    # This wordlist achieves 78.02% accuracy on the religion dataset
    wordlist = 'in,to,Re,In,1993,rutgers,athos,writes,article,12,And,you,on,heart,will,Chuck,not,gvg47,gvg,He,this,may,10,us,When,before,alt,uk,co,mantis,up,post,Distribution,You,Keith,kmr4,Ryan,Bill,pooh,for,the,Host,Posting,NNTP,New,Thanks,anyone,email,has,Newsreader,Nntp,wrote,agree,Sandvik,edu,clh,by,who,thoughts,thing,saturn,wwc,more,EDU,try,wouldn,am,as,world,livesey,Livesey,wpd,solntze,jon,from,it,cc,little,Conner,osrhe,here,VMS,don,than,13,would,also,18,about,University,TIN,FAQ,version,even,PL9,said,being,Yet,so,he,they,interested,geneva,17,athena,May,love,me,whether,St,COM,Inc,newton,TEK,Kent,mean,sandvik,Or,Beaverton,lot,week,need,education,our,Robert,Don,Reply,cs,which,Computer,Organization,rusnews,Jim,bmd,trw,deleted,position,now,isn,whole,mathew,00,05,Michael,subject,CA,Princeton,po,CWRU,okcforum,bil,GMT,Bake,Timmons,timmbake,mcl,sgi,au,Dan,com,Unix'.split(',')
    cleaned_train = clean_vectors_wordlist(train_vectors, vectorizer, wordlist)
    cleansvm = sklearn.svm.SVC(probability=True, kernel='rbf', C=10,gamma=0.001)
    cleansvm.fit(cleaned_train, train_labels)

    rfemb = embedding_forest.EmbeddingForest(vectorizer)
    rfemb.fit(train_vectors, train_labels)

    suggestions = {}
    suggestions['lr'] = GetSuggestions(lr, test_vectors, test, test_labels)
    suggestions['rf'] = GetSuggestions(rf, test_vectors, test, test_labels)
    suggestions['rfemb'] = GetSuggestions(rfemb, test_vectors, test, test_labels)
    suggestions['svm'] = GetSuggestions(svm, test_vectors, test, test_labels)
    suggestions['cleansvm'] = GetSuggestions(cleansvm, test_vectors, test, test_labels)

    suggestions['cleansvm-lr'] = GetSuggestionsPair(cleansvm, lr, test_vectors, test, test_labels)
    suggestions['cleansvm-rf'] = GetSuggestionsPair(cleansvm, rf, test_vectors, test, test_labels)
    suggestions['cleansvm-rfemb'] = GetSuggestionsPair(cleansvm, rfemb, test_vectors, test, test_labels)
    suggestions['cleansvm-svm'] = GetSuggestionsPair(cleansvm, svm, test_vectors, test, test_labels)

    suggestions['lr-rf'] = GetSuggestionsPair(lr, rf, test_vectors, test, test_labels)
    suggestions['lr-rfemb'] = GetSuggestionsPair(lr, rfemb, test_vectors, test, test_labels)
    suggestions['lr-svm'] = GetSuggestionsPair(lr, svm, test_vectors, test, test_labels)
    suggestions['lr-cleansvm'] = GetSuggestionsPair(lr, svm, test_vectors, test, test_labels)

    suggestions['rf-rfemb'] = GetSuggestionsPair(rf, rfemb, test_vectors, test, test_labels)
    suggestions['rf-svm'] = GetSuggestionsPair(rf, svm, test_vectors, test, test_labels)

    suggestions['rfemb-svm'] = GetSuggestionsPair(rfemb, svm, test_vectors, test, test_labels)
    ret = {} 
    ret['svm'] = {}
    ret['svm']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, svm.predict(test_vectors))
    ret['svm']['model'] = svm

    ret['cleansvm'] = {}
    ret['cleansvm']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, cleansvm.predict(test_vectors))
    ret['cleansvm']['model'] = cleansvm

    ret['rf'] = {}
    ret['rf']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, rf.predict(test_vectors))
    ret['rf']['model'] = rf

    ret['rfemb'] = {}
    ret['rfemb']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, rfemb.predict(test_vectors))
    ret['rfemb']['model'] = rfemb

    ret['lr'] = {}
    ret['lr']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, lr.predict(test_vectors))
    ret['lr']['model'] = lr

    ret['vectorizer'] = vectorizer
    ret['class_names'] = ['Atheism', 'Christian']
    return ret, suggestions

def LoadSentimentFile(path):
    data = []
    labels = []
    for line in open(path):
        x, y = line.decode('utf-8', 'ignore').strip().split('\t')
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
    DummyModel = collections.namedtuple('model', ['predict_proba'])
    nn = DummyModel(lstm.GetLSTM())

    suggestions = {}
    suggestions['lr'] = GetSuggestions(lr, test_vectors, test, test_labels)
    suggestions['rf'] = GetSuggestions(rf, test_vectors, test, test_labels)
    suggestions['nn'] = GetSuggestions(nn, test, test, test_labels)
    suggestions['lr-rf'] = GetSuggestionsPair(lr, rf, test_vectors, test, test_labels)
    suggestions['lr-nn'] = GetSuggestionsPair(lr, nn, test_vectors, test, test_labels, nn=True)
    suggestions['rf-nn'] = GetSuggestionsPair(rf, nn, test_vectors, test, test_labels, nn=True)

    ret = {} 

    ret['nn'] = {}
    ret['nn']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, (nn.predict_proba(test)[:,1] > .5).astype(int))

    ret['rf'] = {}
    ret['rf']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, rf.predict(test_vectors))
    ret['rf']['model'] = rf

    ret['lr'] = {}
    ret['lr']['accuracy'] = sklearn.metrics.accuracy_score(test_labels, lr.predict(test_vectors))
    ret['lr']['model'] = lr

    ret['vectorizer'] = vectorizer
    ret['class_names'] = ['Negative', 'Positive']
    return ret, suggestions


def main():
    suggestions = {}
    ret = {}
    ret['politeness'], suggestions['politeness'] = LearnPoliteness()
    ret['20ng'], suggestions['20ng'] = Learn20NG()
    ret['sentiment'], suggestions['sentiment'] = LearnSentiment()

    joblib.dump(ret, 'models/models')

    acc = {}
    for dataset in ret:
        acc[dataset] = {}
        for model in ret[dataset]:
            if model == 'class_names' or model == 'vectorizer':
                continue
            acc[dataset][model] = ret[dataset][model]['accuracy']
    ret_suggestions = {'suggestions' : suggestions, 'accuracy' : acc}
    json.dump(ret_suggestions, open('static/suggestions.json', 'w'))

if __name__ == '__main__':
    main()
