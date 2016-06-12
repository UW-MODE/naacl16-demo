import pickle
import sklearn
import sklearn.svm
import cgi
import re
from sklearn.datasets import fetch_20newsgroups

def Load20NG():
    cats = ['alt.atheism', 'soc.religion.christian']
    newsgroups_train = fetch_20newsgroups(subset='train', categories=cats)
    newsgroups_test = fetch_20newsgroups(subset='test', categories=cats)
    train, train_labels = newsgroups_train.data, newsgroups_train.target
    test, test_labels = newsgroups_test.data, newsgroups_test.target
    return train, train_labels, test, test_labels
def get_pretty_instance(raw_data, exp, vectorizer):
    tokenizer = vectorizer.build_tokenizer()
    COLOR_POS = '#4dac26'
    COLOR_NEG = '#d01c8b'
    #WEIGHT_SCALE = lambda x: 15 + 50 * np.abs(x)
    tokens = tokenizer(raw_data)
    data = cgi.escape(raw_data)
    dict_exp = dict(exp)
    current = 0
    pos = []
    for token in tokens:
        if token in dict_exp:
            start = current + data.find(token)
            end = start + len(token)
            pos.append((start, end, dict_exp[token]))
        to_advance = data.find(token) + len(token)
        data = data[to_advance:]
        current += to_advance
    new = cgi.escape(raw_data)
    # add_before = lambda w: '<span style="color: %s; font-weight:bold; font-size:%.2fpx";>' % (COLOR_NEG if w < 0 else COLOR_POS, WEIGHT_SCALE(w)) 
    add_before = lambda w: '<span style="color: %s; font-weight:bold;">' % (COLOR_NEG if w < 0 else COLOR_POS)
    add_after = '</span>'
    tot_added = 0
    for start, end, weight in pos:
        start = start + tot_added
        end = end + tot_added
        new = new[:start] + add_before(weight) + new[start:end] + add_after + new[end:]
        tot_added += len(add_before(weight)) + len(add_after)
    return re.sub('\n', '<br />', new)


data = pickle.load(open('../submodular_20.pickle'))
train, train_labels, test, test_labels = Load20NG()
vectorizer = sklearn.feature_extraction.text.CountVectorizer(binary=True,
        lowercase=False) 
vectorizer.fit(train + test)                                                          
train_vectors = vectorizer.transform(train)
test_vectors = vectorizer.transform(test)                                             
svm = sklearn.svm.SVC(probability=True, kernel='rbf', C=10,gamma=0.001)               
svm.fit(train_vectors, train_labels)                                                  

json_ret = {}
json_ret['class_names'] = ['Atheism', 'Christianity']
json_ret['instances'] = []
explanations = data['explanations']['20ng']['svm'][:10]
idxs = data['submodular_idx']['20ng']['svm'][:10]
for z, i in enumerate(idxs):
    json_obj = {}
    json_obj['id'] = i
    idx = i
    instance = test_vectors[idx]
    json_obj['true_class'] = test_labels[idx]
    json_obj['c1'] = {}
    json_obj['c1']['predict_proba'] = list(svm.predict_proba(test_vectors[0])[0])
    exp = explanations[z]
    json_obj['c1']['exp'] = exp 
    json_obj['c1']['data'] = get_pretty_instance(test[idx], exp, vectorizer)
    json_ret['instances'].append(json_obj)
import json
open('exp2_local.json', 'w').write('data = %s' % json.dumps(json_ret))
