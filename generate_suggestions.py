import argparse
import pickle
import json

def main():
    global explainer
    parser = argparse.ArgumentParser(description='Do some stuff')
    parser.add_argument('-json', '-j', default='submodular_stuff.pickle',
            help='pickled json file')
    args = parser.parse_args()
    data = pickle.load(open(args.json))
    ret = {}
    for dataset in data['submodular_text']:
        ret[dataset] = {}
        for model in data['submodular_text'][dataset]:
            sorted_model = '-'.join(sorted(model.split('-')))
            model = '-'.join(model.split('-'))
            ret[dataset][sorted_model] = [{'title' : 'Example %s' % x[1], 'text': x[0]} for x in zip(data['submodular_text'][dataset][model][:6],data['submodular_idx'][dataset][model][:6])]
    json.dump(ret, open('static/suggestions.json', 'w'))

    

if __name__ == '__main__':
    main()
