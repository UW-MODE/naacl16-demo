import flask
from flask import Flask, request, g, abort, render_template
import collections
import time

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
    return flask.json.jsonify(explainer.explain_instance(params['text']))
    
def main():
    Explainer = collections.namedtuple('Explainer', ['explain_instance'])
    global explainer
    explanation = {'explanation' : 
[(u'Posting', -0.15781097394174123),
 (u'Host', -0.12142591429012933),
 (u'NNTP', -0.10475224916045552),
 (u'edu', -0.026189656073854678),
 (u'University', 0.013130716499773369),
 (u'There', -0.01089013711867517)], 'predict_proba' :[.4,.6]}
    explainer = Explainer(lambda x: explanation)
    app.run(debug=True, port=8112)

if __name__ == '__main__':
    main()
