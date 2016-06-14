import lime
import lime.lime_text
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
import learn_models
import collections
import numpy as np
import copy
from sklearn.externals import joblib
import lstm
import pickle

def submodular_fn(explanations, feature_value):
    z_words = set()
    for exp in explanations:
        z_words = z_words.union([x[0] for x in exp])
    normalizer = sum([feature_value[w] for w in z_words])
    def fnz(x):
        all_words = set()
        for doc in x:
            all_words = all_words.union([x[0] for x in explanations[doc]])
        return sum([feature_value[w] for w in all_words]) / normalizer
    fnz.num_items = len(explanations)
    return fnz
def greedy(submodular_fn, k, chosen=[]):
    chosen = copy.deepcopy(chosen)
    all_items = range(submodular_fn.num_items)
    current_value = 0
    while len(chosen) != k:
        best_gain = 0
        best_item = all_items[0]
        for i in all_items:
            gain= submodular_fn(chosen + [i]) - current_value
            if gain > best_gain:
                best_gain = gain
                best_item = i
        chosen.append(best_item)
        all_items.remove(best_item)
        current_value += best_gain
    return chosen
def get_submodular_fn(exps):
    feature_value = collections.defaultdict(float)
    for exp in exps:
        for f, v in exp:
            feature_value[f] += np.abs(v)
    for f in feature_value:
        feature_value[f] = np.sqrt(feature_value[f])
    submodular = submodular_fn(exps, feature_value)
    return submodular
    
def submodular_pick(fn, B):
    return greedy(fn, B)
def alternate_submodular_pick(fn1, fn2, B):
    ret = []
    for i in range(B):
        fn = fn1 if i % 2 == 0 else fn2
        ret = greedy(fn, i + 1, ret)
    return ret

def get_explanations(real_models, dataset, test, num_features=5):
    explainer = lime.lime_text.LimeTextExplainer(class_names=['bla', 'ble'],
                feature_selection='highest_weights', bow=True)
    explanations = dict([(x, []) for x in real_models[dataset]])
    i = 0
    total = len(test)
    for text in test:
        i += 1
        print '%d of %d' % (i, total)
        for model in real_models[dataset]:
            exp = explainer.explain_instance(text, real_models[dataset][model].predict_proba, num_features=num_features)
            explanations[model].append(exp.as_list())
    return explanations

def main():
    models = joblib.load('models/models')
    real_models = {}
    class_names = {}
    explanations = {}
    submodular_idx = {}
    submodular_text = {}
    for d in models:
        class_names[d] = models[d]['class_names']
        real_models[d] = {}
        #for m in ['lr', 'rf', 'svm']:
        for m in ['svm']:
            if m not in models[d]:
                continue
            real_models[d][m] = lime.lime_text.ScikitClassifier(models[d][m]['model'], models[d]['vectorizer'])
    # DummyModel = collections.namedtuple('model', ['predict_proba'])
    # real_models['sentiment']['nn'] = DummyModel(lstm.GetLSTM())

    # 20ng
    dataset = '20ng'
    train, train_labels, test, test_labels = learn_models.Load20NG() 
    explanations[dataset]  = get_explanations(real_models, dataset, test, num_features=10)
    #explanations[dataset]  = get_explanations(real_models, dataset, test)
    num_picked = 50

    print dataset
    submodular_idx[dataset] = {}
    submodular_text[dataset] = {}
    # fn_lr = get_submodular_fn(explanations[dataset]['lr'])
    # fn_rf = get_submodular_fn(explanations[dataset]['rf'])
    fn_svm = get_submodular_fn(explanations[dataset]['svm'])
    # submodular_idx[dataset]['lr'] = submodular_pick(fn_lr, num_picked);
    # submodular_idx[dataset]['rf'] = submodular_pick(fn_rf, num_picked);
    submodular_idx[dataset]['svm'] = submodular_pick(fn_svm, num_picked);
    # submodular_idx[dataset]['lr-rf'] = alternate_submodular_pick(fn_lr, fn_rf, num_picked);
    # submodular_idx[dataset]['lr-svm'] = alternate_submodular_pick(fn_lr, fn_svm, num_picked);
    # submodular_idx[dataset]['rf-svm'] = alternate_submodular_pick(fn_rf, fn_svm, num_picked);
    # submodular_text[dataset]['lr'] = [test[x] for x in submodular_idx[dataset]['lr']]
    # submodular_text[dataset]['rf'] = [test[x] for x in submodular_idx[dataset]['rf']]
    submodular_text[dataset]['svm'] = [test[x] for x in submodular_idx[dataset]['svm']]
    # submodular_text[dataset]['lr-rf'] = [test[x] for x in submodular_idx[dataset]['lr-rf']]
    # submodular_text[dataset]['lr-svm'] = [test[x] for x in submodular_idx[dataset]['lr-svm']]
    # submodular_text[dataset]['rf-svm'] = [test[x] for x in submodular_idx[dataset]['rf-svm']]

    ret = {'submodular_idx' : submodular_idx, 'submodular_text' :
            submodular_text, 'explanations' : explanations}
    pickle.dump(ret, open('submodular_20.pickle', 'w'))
    
    # politeness
    # dataset = 'politeness'
    # print dataset
    # train, train_labels, test, test_labels = learn_models.LoadPoliteness('data/stanford_politeness/wikipedia.annotated.csv')
    # explanations['politeness'] = get_explanations(real_models, dataset, test)

    # submodular_idx[dataset] = {}
    # submodular_text[dataset] = {}
    # fn_lr = get_submodular_fn(explanations[dataset]['lr'])
    # fn_rf = get_submodular_fn(explanations[dataset]['rf'])
    # fn_svm = get_submodular_fn(explanations[dataset]['svm'])
    # submodular_idx[dataset]['lr'] = submodular_pick(fn_lr, num_picked);
    # submodular_idx[dataset]['rf'] = submodular_pick(fn_rf, num_picked);
    # submodular_idx[dataset]['svm'] = submodular_pick(fn_svm, num_picked);
    # submodular_idx[dataset]['lr-rf'] = alternate_submodular_pick(fn_lr, fn_rf, num_picked);
    # submodular_idx[dataset]['lr-svm'] = alternate_submodular_pick(fn_lr, fn_svm, num_picked);
    # submodular_idx[dataset]['rf-svm'] = alternate_submodular_pick(fn_rf, fn_svm, num_picked);
    # submodular_text[dataset]['lr'] = [test[x] for x in submodular_idx[dataset]['lr']]
    # submodular_text[dataset]['rf'] = [test[x] for x in submodular_idx[dataset]['rf']]
    # submodular_text[dataset]['svm'] = [test[x] for x in submodular_idx[dataset]['svm']]
    # submodular_text[dataset]['lr-rf'] = [test[x] for x in submodular_idx[dataset]['lr-rf']]
    # submodular_text[dataset]['lr-svm'] = [test[x] for x in submodular_idx[dataset]['lr-svm']]
    # submodular_text[dataset]['rf-svm'] = [test[x] for x in submodular_idx[dataset]['rf-svm']]

    # ret = {'submodular_idx' : submodular_idx, 'submodular_text' :
    #         submodular_text, 'explanations' : explanations}
    # pickle.dump(ret, open('submodular_politeness.pickle', 'w'))

    # # sentiment
    # dataset = 'sentiment'
    # print dataset
    # train, train_labels, test, test_labels = learn_models.LoadSentiment()
    # explanations['sentiment'] = get_explanations(real_models, dataset, test)

    # submodular_idx[dataset] = {}
    # submodular_text[dataset] = {}
    # fn_lr = get_submodular_fn(explanations[dataset]['lr'])
    # fn_rf = get_submodular_fn(explanations[dataset]['rf'])
    # fn_nn = get_submodular_fn(explanations[dataset]['nn'])
    # submodular_idx[dataset]['lr'] = submodular_pick(fn_lr, num_picked);
    # submodular_idx[dataset]['rf'] = submodular_pick(fn_rf, num_picked);
    # submodular_idx[dataset]['nn'] = submodular_pick(fn_nn, num_picked);
    # submodular_idx[dataset]['lr-rf'] = alternate_submodular_pick(fn_lr, fn_rf, num_picked);
    # submodular_idx[dataset]['lr-nn'] = alternate_submodular_pick(fn_lr, fn_nn, num_picked);
    # submodular_idx[dataset]['rf-nn'] = alternate_submodular_pick(fn_rf, fn_nn, num_picked);
    # submodular_text[dataset]['lr'] = [test[x] for x in submodular_idx[dataset]['lr']]
    # submodular_text[dataset]['rf'] = [test[x] for x in submodular_idx[dataset]['rf']]
    # submodular_text[dataset]['nn'] = [test[x] for x in submodular_idx[dataset]['nn']]
    # submodular_text[dataset]['lr-rf'] = [test[x] for x in submodular_idx[dataset]['lr-rf']]
    # submodular_text[dataset]['lr-nn'] = [test[x] for x in submodular_idx[dataset]['lr-nn']]
    # submodular_text[dataset]['rf-nn'] = [test[x] for x in submodular_idx[dataset]['rf-nn']]

    # ret = {'submodular_idx' : submodular_idx, 'submodular_text' :
    #         submodular_text, 'explanations' : explanations}
    # pickle.dump(ret, open('submodular_stuff.pickle', 'w'))

if __name__ == '__main__':
    main()
