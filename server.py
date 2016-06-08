import flask
from flask import Flask, request, g, abort
import collections
import time

app = Flask(__name__)

@app.route('/')
def index():
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
    print explainer.explain_instance(3)
    if not request.json or not 'text' in request.json:
        print 'aegalera'
        time.sleep(1)
        return flask.json.jsonify({'ae':'bla'})
        abort(400)
    
def main():
    Explainer = collections.namedtuple('Explainer', ['explain_instance'])
    global explainer
    explainer = Explainer(lambda x: 'explanation')
    app.run(debug=True)

if __name__ == '__main__':
    main()
