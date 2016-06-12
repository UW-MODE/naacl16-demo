import flask
from flask import Flask, request, g, abort, render_template
import collections
import time
import numpy as np
import pickle
import lime
import lime.lime_text
import lstm
import argparse
from sklearn.externals import joblib

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')
    code = '''<script                                                                                                                    
    src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>                                         
  <div id="bla"></div>                                                                                                       
  <script>                                                                                                                   
    function StartLoading() {
        $("#bla").text("Loading");    
    }
    //$("#bla").load("api/explain");                                                                                        
    var data = 'z';
    var request = {
        url: "api/explain",
        type: 'POST',
        contentType: "application/json",
        accepts: "application/json",
        cache: false,
        dataType: 'json',
        beforeSend: StartLoading,
        data: JSON.stringify(data),
        error: function(jqXHR) {
            console.log("ajax error " + jqXHR.status);
        }
    };
    $.ajax(request).done(function(data) { console.log("AJAX " + data['ae']); $("#bla").text("Done");});

  </script>'''    
    return code
    return "Hello, World!"

@app.route('/api/explain', methods=['POST'])
def explain():
    global explainer
    #print explainer.explain_instance(3)
    params = request.get_json(force=True)
    model_left = params['model_left']
    model_right = params['model_right']
    dataset = params['dataset'] 
    text = params['text']
    ret = {'left' : {}, 'right' : {}}
    if model_left != 'none':
        ret['left'] = explainer.explain_instance(dataset, model_left, text)
    if model_left == model_right:
        ret['right'] = ret['left']
    else:
        if model_right != 'none':
            ret['right'] = explainer.explain_instance(dataset, model_right, text)
    return flask.json.jsonify(ret)
    
class Explainer:
    def __init__(self, dummy=False):
        self.dummy = dummy
        if dummy:
            return
        self.models = joblib.load('models/models')
        #self.models = pickle.load(open('models.pickle'))
        self.real_models = {}
        self.class_names = {}
        for d in self.models:
            self.class_names[d] = self.models[d]['class_names']
            self.real_models[d] = {}
            for m in ['lr', 'rf', 'svm']:
                if m not in self.models[d]:
                    continue
                self.real_models[d][m] = lime.lime_text.ScikitClassifier(self.models[d][m]['model'], self.models[d]['vectorizer'])
        DummyModel = collections.namedtuple('model', ['predict_proba'])
        self.real_models['sentiment']['nn'] = DummyModel(lstm.GetLSTM())
    def explain_instance(self, dataset, model, text):
        if self.dummy:
            pp = np.random.random(2)
            pp = list(pp / pp.sum())
            exp_list = [('bla', 0.3), ('ble', -0.3), ('bli', 0.2), ('blo', 0.1), ('blu', 0.01)]
            return {'explanation' : [('intercept', .2 - 0.5)] + exp_list, 'predict_proba' : pp}

        if not model:
            return {}
        bow = model != 'nn'
        np.random.seed(1)
        #print self.real_models
        explainer = lime.lime_text.LimeTextExplainer(class_names=['a','b'],
                feature_selection='highest_weights', bow=bow)
        exp = explainer.explain_instance(text,
                self.real_models[dataset][model].predict_proba, num_features=5, num_samples=2000)
        if bow:
            exp_list = exp.as_list()
        else:
            exp_list = exp.as_list(positions=True)
        pp = list(self.real_models[dataset][model].predict_proba([text])[0])
        return {'explanation' : [('intercept', exp.intercept[1] - 0.5)] + exp_list, 'predict_proba' : pp}

def main():
    global explainer
    parser = argparse.ArgumentParser(description='Do some stuff')
    parser.add_argument('-dummy', '-d', action='store_true', help='If present, return dummy explanations')
    args = parser.parse_args()
    explainer = Explainer(args.dummy)
    app.run(debug=True, port=8112)

if __name__ == '__main__':
    main()
