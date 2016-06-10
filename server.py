import flask
from flask import Flask, request, g, abort, render_template
import collections
import time
import numpy as np

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
    print 'AE'
    params = request.get_json(force=True)
    ret = {}
    ret['left'] = explainer.explain_instance(params['text'])
    ret['right'] = explainer.explain_instance(params['text'])
    return flask.json.jsonify(ret)
    
class Explainer:
    def __init__(self):
        pass
    def explain_instance(self, x):
        pp = np.random.random(2)
        pp = list(pp/pp.sum())
        return {'explanation' : 
               [(u'Posting', np.random.random() - .2),
            (u'Host', -0.12142591429012933),
            (u'NNTP', -0.10475224916045552),
            (u'edu', -0.026189656073854678),
            (u'University', 0.013130716499773369),
            (u'There', -0.01089013711867517)], 'predict_proba' :pp}

def main():
    global explainer
    explainer = Explainer()
    app.run(debug=True, port=8112)

if __name__ == '__main__':
    main()
