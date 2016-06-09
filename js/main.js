import {range} from 'lodash';
import Barchart from './bar_chart.js';
import Anchor from './anchor.js';
import MultipleExps from './multiple_exps.js';
import Provenance from './provenance.js';
import SuggestedChanges from './suggested_changes.js';
import PredictProba from './predict_proba.js';
import ProsAndCons from './pros_and_cons.js';
import LocalApproximation from './local_approximation.js';
import ExplanationFrame from './explanation_frame.js';
require('../style.css');
// let svg = d3.select('body').append('div').append('svg').style('width', 300);
// let zz = new Barchart(svg, [['short', 0.2], ['this is quite a long name', 0.8], ['ble', -0.99]]);
// let svg2 = d3.select('body').append('div').append('svg')
// let zz2 = new Barchart(svg2, [['short', 0.2], ['reallyreallyreallylongnameWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', 0.8], ['ble', 0.99]], false);
// let svg3 = d3.select('body').append('div').append('svg')
// let zz3 = new Barchart(svg3, [['short', -0.2], ['reallyreallyreallylongname', -0.8], ['ble', -0.99]], false, 'Cons');
// let div = d3.select('body').append('div');
// div.classed('lime', true).classed('anchor', true).style('width', '400px');
// anchor.show(div);

// text or tabular
let DATA_TYPE = 'tabular';
// anchor, pros, cf1, cf2 or provenance
let EXPLANATION = 'provenance'

let data;
let explanation;
let prediction = new Map()
if (DATA_TYPE == 'text') {
  data = 'This is not a good idea';
  prediction['class_names'] = ['Negative', 'Positive']
  prediction['predict_proba'] = [.9, .1];
  prediction['true_class'] = 0
  if (EXPLANATION == 'anchor') {
    let exp = new Map();
    exp['rule'] = ['not', 'good'];
    exp['prediction'] = 0.1;
    exp['features'] = ['not','good']
    exp['centers'] = [0.5, 0.9, 0.35, 0.1];
    exp['spreads'] = [0.5, 0.05, 0.3, 0.01];
    exp['left_quartile'] = [0.1, 0.85, 0.2, 0.01];
    exp['right_quartile'] = [0.6, 0.95, 0.7, 0.12];
    exp['mins'] = [0, 0.8, 0, 0];
    exp['maxs'] = [1, 1, 0.8, 0.2];
    exp['boxplot'] = true;
    exp['class_name'] = "Positive";
    explanation = new Anchor(exp, data, DATA_TYPE);
  }
  else if (EXPLANATION == 'pros') {
    let linear_exp = new Map();
    linear_exp['feature_word_weight'] = [[0, 'intercept', 0.5], [0,'not', -0.8], [0, 'good', 0.8]]
    linear_exp['class'] = 1;
    linear_exp['two_sided'] = true;
    linear_exp['class_name'] = prediction['class_names'][linear_exp['class']];
    explanation = new ProsAndCons(linear_exp, data, DATA_TYPE);
  }
  else if (EXPLANATION == 'cf1') {
    let linear_exp = new Map();
    linear_exp['feature_word_weight'] = [[0, 'intercept', 0.9], [0,'not', -0.4], [0, 'good', -0.4]]
    linear_exp['class'] = 1;
    linear_exp['class_name'] = prediction['class_names'][linear_exp['class']];
    explanation = new LocalApproximation(linear_exp, data, DATA_TYPE);
  }
  else if (EXPLANATION == 'cf2') {
    let exp = new Map();
    exp['feature_changes'] = [['not', 0]]
    exp['new_predict_proba'] = [.1, .9]
    exp['class_names'] = prediction['class_names']
    explanation = new SuggestedChanges(exp, data, DATA_TYPE);
  }
  else if (EXPLANATION == 'provenance') {
    let exp1 = new Map();
    let datas = ['This is not a good movie at all',
            'not bad',
            'not good',
            'bla bla good not bla',
            'test bla bla good bla not'];
    let classes = [0,0,1,0,1];
    let predictions = [1,1,1,1,1];
    exp1['data'] = []
    for (let i of range(5)) {
      exp1['data'].push({'id' : i, 'true_class' : classes[i], 'prediction' : predictions[i], 'raw' : datas[i]})
    }
    exp1['class_names'] = prediction['class_names'];
    exp1['raw_frequency'] = 20;
    exp1['norm_frequency'] = 0.1;
    exp1['class_distribution'] = [0, 1];


    let exp2 = new Map();
    exp2['rule'] = ['not', 'good'];
    exp2['prediction'] = 0.1;
    exp2['features'] = ['not','good']
    exp2['centers'] = [0.5, 0.9, 0.35, 0.1];
    exp2['spreads'] = [0.5, 0.05, 0.3, 0.01];
    exp2['mins'] = [0, 0.8, 0, 0];
    exp2['maxs'] = [1, 1, 8, 0.2];
    exp2['class_name'] = "Positive";
    let anchor = new Anchor(exp2, data, DATA_TYPE);
    exp1['raw_shower'] = anchor;
    let provenance = new Provenance(exp1, data, DATA_TYPE);

    let exp = new Map();
    exp['explainers'] = [anchor, provenance]
    exp['widths'] = ['45%', '33%']
    explanation = new MultipleExps(exp, data, DATA_TYPE);
  }
}
else {
  data = [{'name' : 'weather', 'value' : 'nice'}, {'name' : 'season', 'value' : 'summer'},{'name' : 'hour', 'value' : '8', 'std': 6}];
  prediction['class_names'] = ['Few people', 'Lots of people']
  prediction['predict_proba'] = [.1, .9];
  prediction['true_class'] = 1
  if (EXPLANATION == 'anchor') {
    let exp = new Map();
    exp['rule'] = ['weather=nice', '6 < hour < 12'];
    exp['features'] = [0, 2]
    exp['prediction'] = 0.9;
    exp['centers'] = [0.5, 0.5, 0.7, .9];
    exp['spreads'] = [0.5, 0.5, 0.3, 0.01];
    exp['mins'] = [0.0, 0, 0.3, 0.8];
    exp['maxs'] = [1, 1, 1, 0.95];
    exp['class_name'] = "Lots of people";
    explanation = new Anchor(exp, data, DATA_TYPE);
    // data = [{"name": "Age", "value": "18.0"}, {"name": "Workclass", "value": "Private"}, {"name": "fnlwgt", "value": "208103.0"}, {"name": "Education", "value": "11th"}, {"name": "Education-Num", "value": "7.0"}, {"name": "Marital Status", "value": "Never-married"}, {"name": "Occupation", "value": "Other-service"}, {"name": "Relationship", "value": "Other-relative"}, {"name": "Race", "value": "White"}, {"name": "Sex", "value": "Male"}, {"name": "Capital Gain", "value": "0.0"}, {"name": "Capital Loss", "value": "0.0"}, {"name": "Hours per week", "value": "25.0"}, {"name": "Country", "value": "United-States"}];
    // prediction={"predict_proba": [0.98543319926078921, 0.014566800739210784], "class_names": ["<=50K", ">50K"]};
    // var exp = new Map();
    // exp['features'] = [11, 5, 0];
    // exp['prediction'] = 0.0145668007392;
    // exp['class_name'] = ">50K";
    // exp['rule'] = ["Capital Loss <= 2391.5", "Marital Status=Never-married", "Age <= 20.0"];
    // exp['centers'] = [0.24393427518427518, 0.23580441640378549, 0.065979381443298971, 0.025230111768573309, 0.22884358025663229, 0.21923240938166311, 0.065014598020366021, 0.024040836489379221]
    // exp['spreads'] = [0.28145316556530298, 0.28010205922699766, 0.14640927795886813, 0.038516726013061379, 0.26694852851559986, 0.26367211578261496, 0.14353072950248569, 0.01970244790990219]
    // explanation = new Anchor(exp, data,"tabular")

  }
  else if (EXPLANATION == 'pros') {
    let linear_exp = new Map();
    linear_exp['feature_word_weight'] = [[0, 'weather=nice', 0.2], [1,'season=summer', 0.2], [2, 'hour=8', 0.05]]
    linear_exp['class'] = 1;
    linear_exp['two_sided'] = true;
    linear_exp['class_name'] = prediction['class_names'][linear_exp['class']];
    explanation = new ProsAndCons(linear_exp, data, DATA_TYPE);
  }
  else if (EXPLANATION == 'cf1') {
    let linear_exp = new Map();
    linear_exp['feature_word_weight'] = [[-1, 'intercept', .45], [0, 'weather=nice', 0.2], [1,'season=summer', 0.2], [2, 'hour=8', 0.05]]
    linear_exp['class'] = 1;
    linear_exp['class_name'] = prediction['class_names'][linear_exp['class']];
    explanation = new LocalApproximation(linear_exp, data, DATA_TYPE);
  }
  else if (EXPLANATION == 'cf2') {
    // let exp = new Map();
    // exp['feature_changes'] = [[0, 'bad'], [1, 'winter']]
    // exp['new_predict_proba'] = [.6, .4]
    // exp['class_names'] = prediction['class_names']
    // explanation = new SuggestedChanges(exp, data, DATA_TYPE);
    data = [{"name": "Age", "value": "62.0"}, {"name": "Workclass", "value": "Self-emp-not-inc"}, {"name": "fnlwgt", "value": "26911.0"}, {"name": "Education", "value": "7th-8th"}, {"name": "Education-Num", "value": "4.0"}, {"name": "Marital Status", "value": "Widowed"}, {"name": "Occupation", "value": "Other-service"}, {"name": "Relationship", "value": "Not-in-family"}, {"name": "Race", "value": "White"}, {"name": "Sex", "value": "Female"}, {"name": "Capital Gain", "value": "0.0"}, {"name": "Capital Loss", "value": "0.0"}, {"name": "Hours per week", "value": "66.0"}, {"name": "Country", "value": "United-States"}];
    prediction={"predict_proba": [0.93029637760702522, 0.069703622392974757], "class_names": ["<=50K", ">50K"], 'true_class':  1};
    var exp = new Map();
    exp['new_predict_proba'] = [0.0625, 0.9375];
    exp['feature_changes'] = [[11, 3343.4899999999998]];
    exp['class_names'] = ["<=50K", ">50K"];
    explanation = new SuggestedChanges(exp, data, DATA_TYPE)
    

  }
  else if (EXPLANATION == 'provenance') {
    let exp1 = new Map();
    let datas = [[{'name' : 'weather', 'value' : 'nice'}, {'name' : 'season', 'value' : 'winter'},{'name' : 'hour', 'value' : '11'}],
            [{'name' : 'weather', 'value' : 'nice'}, {'name' : 'season', 'value' : 'spring'},{'name' : 'hour', 'value' : '11'}],
            [{'name' : 'weather', 'value' : 'nice'}, {'name' : 'season', 'value' : 'summer'},{'name' : 'hour', 'value' : '10'}],
            [{'name' : 'weather', 'value' : 'nice'}, {'name' : 'season', 'value' : 'fall'},{'name' : 'hour', 'value' : '10'}],
            [{'name' : 'weather', 'value' : 'nice'}, {'name' : 'season', 'value' : 'summer'},{'name' : 'hour', 'value' : '9'}]
    ];
    let classes = [1,1,1,0,1];
    let predictions = [1,1,1,1,1];
    exp1['data'] = []
    exp1['raw_frequency'] = 20;
    exp1['norm_frequency'] = 0.1;
    exp1['class_distribution'] = [0, 1];
    for (let i of range(5)) {
      exp1['data'].push({'id' : i, 'true_class' : classes[i], 'prediction' : predictions[i], 'raw' : datas[i]})
    }
    exp1['class_names'] = prediction['class_names']

    let exp2 = new Map();
    exp2['rule'] = ['weather=nice', '6 < hour < 12'];
    exp2['features'] = [0, 2]
    exp2['prediction'] = 0.9;
    exp2['centers'] = [0.5, 0.5, 0.7, .9];
    exp2['spreads'] = [0.5, 0.5, 0.3, 0.01];
    exp2['mins'] = [0.0, 0, 0.3, 0.8];
    exp2['maxs'] = [1, 1, 1, 0.95];
    exp2['class_name'] = "Lots of people";
    let anchor = new Anchor(exp2, data, DATA_TYPE);
    exp1['raw_shower'] = anchor;


    let provenance = new Provenance(exp1, data, DATA_TYPE);

    let exp = new Map();
    exp['explainers'] = [anchor, provenance]
    exp['widths'] = ['45%', '45%']
    explanation = new MultipleExps(exp, data, DATA_TYPE);
  }
  else {
    throw 'Wrong explanation type';
  }
}

let div = d3.select('body').append('div');
let svg = div.append('svg');
let div2 = d3.select('body').append('div');
div2.append('div');
svg.style('width', '200px');
let z = new PredictProba(svg, ['bla', 'bledfskljflajfd'], [0.1, 0.9]);
function Bla() {
  d3.xhr("api/explain", "application/json").post(JSON.stringify({'text': 'bla'}), function(error, data) {
    let bla = JSON.parse(data.responseText);
    console.log(bla);
    //console.log(data.responseText)['predict_proba'];
    z.update(bla['predict_proba']);
    let linear_exp = {}
    linear_exp['feature_word_weight'] = bla['explanation'].map(x=> [0, x[0], x[1]]);
    linear_exp['class'] = 1;
    linear_exp['class_name'] = 'bla';
    //linear_exp['two_sided'] = false;
    let explanation = new ProsAndCons(linear_exp, 'some text', 'text');
    explanation.class_colors = z.colors_i;
    div2.select('div').remove()
    let divz = div2.append('div').style('width', '500px');
    explanation.show(divz);
  })
}
export {prediction, explanation, Bla, z};
export {Barchart, Anchor, MultipleExps, Provenance, SuggestedChanges, PredictProba, ProsAndCons, LocalApproximation, ExplanationFrame};


// let div = d3.select('body').append('div').style('width', '100%');
// let exp_frame = new ExplanationFrame(div, prediction, explanation);



// let prediction = new Map()
// let linear_exp = new Map();
// linear_exp['feature_word_weight'] = [[0,'weather=nice', 0.2], [2, 'hour=6', 0.8], [1,'season=summer', -0.19]]
// linear_exp['class'] = 2;
// linear_exp['class_name'] = prediction['class_names'][linear_exp['class']];
// let row = [{'name' : 'weather', 'value' : 'nice'}, {'name' : 'season', 'value' : 'summer'},{'name' : 'hour', 'value' : '6', 'std': 6}];
// //let anchor = new Anchor(exp, 'trying stuff', 'tabular');
// //let explanation = new Anchor(exp, row, 'tabular');
// //let explanation = new LocalApproximation(linear_exp, row, 'tabular');
// let explanation = new LocalApproximation(linear_exp, 'hour=6 is a very important feature in hour=6 season=summer', 'text');
// // //anchor.show(div);
// div = d3.select('body').append('div').style('width', '100%');
//anchor.display_raw_text(div, 'this blobz is this sparta is. is',[['this', 'is'], ['sparta']], ['blue', 'red'], false);
//anchor.display_raw_text(div, 'this blobz is this sparta is. is',[['this', 'is'], ['sparta']], ['blue', 'red'], false);

//anchor.display_raw_text(div, 'this blobz is this sparta is. is',[[[0,3], [5,7]], [[4,5]]], ['blue', 'red'], true);

