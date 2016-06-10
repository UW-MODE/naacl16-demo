import d3 from 'd3';
import PredictProba from './predict_proba.js';
import ProsAndCons from './pros_and_cons.js';
class Visualization {
  constructor() {
    let self = this;
    this.left = Object()
    this.right = Object()

    // Buttons
    this.dataset_map = {'Religion' : '20ng', 'Politeness' : 'politeness', 'Sentiment' : 'sentiment'};
    let dataset_div = d3.select('#datasets_div')
    dataset_div.selectAll('span').data(['Religion', 'Politeness', 'Sentiment'])
        .enter().append('span')
        .classed('suggestion_btn', true)
        .text(d => d)
        .on('click', d => self.update_dataset(d))
    let button = d3.select('#buttons_div').append('button')
    button.on('click', () => this.send_request());
    
    // Text area
    this.textarea = d3.select('#input_text_div').append('textarea').style('width', '100%').style('height', '100%');

    // Build sides
    this.model_options = {'20ng' : ['none', 'Logistic Regression', 'Random Forest', 'SVM RBF'], 
      'politeness' : ['none', 'Logistic Regression', 'Random Forest', 'SVM RBF'], 
      'sentiment' : ['none', 'Logistic Regression', 'Random Forest', 'NN on Embeddings']};
    this.model_map = {'none' : 'none', 'Logistic Regression' : 'lr', 'Random Forest' : 'rf', 'SVM RBF' : 'svm', 'NN on Embeddings' : 'nn'} 
    this.build_side(this.left, '#left_model_div');
    this.build_side(this.right, '#right_model_div');

    d3.json("static/suggestions.json", function(error, json) {
      self.suggestions = json;
      self.update_dataset('Religion');
      self.update_suggestions();
    })
  }
  update_dataset(dataset) {
    this.dataset = this.dataset_map[dataset];
    this.update_suggestions()
    this.update_model_options(this.left);
    this.update_model_options(this.right);
    // Sends request
    this.update_text(this.suggestions[this.dataset][0]['text']);
  }
  update_model_options(side_object) {
    let self = this;
    side_object.model_select.html('')
    side_object.model_select.selectAll('option').data(self.model_options[self.dataset])
      .enter()
      .append('option')
      .text(d=> d)
    side_object.model_select.on('change', d=> self.send_request());
  }
  update_suggestions() {
    let self = this;
    let div = d3.select('#suggestions_div');
    div.html('');
    div.selectAll('span').data(self.suggestions[self.dataset])
       .enter().append('span')
       .classed('suggestion_btn', true)
       .text(d => d['title'])
       .on('click', d => self.update_text(d['text']));
  }
  update_text(text) {
    this.textarea.node().value = text;
    this.send_request();
  }
  send_request() {
    let self = this;
    let text = this.textarea.node().value;
    this.model_left = this.model_map[this.left.model_select.property('value')];
    this.model_right = this.model_map[this.right.model_select.property('value')];
    // %TODO
    let params = {'text' : text, 'dataset' : this.dataset, 'model_left' : self.model_left, 'model_right': self.model_right};
    this.start_loading(800);
    params = JSON.stringify(params);
    d3.xhr("api/explain", "application/json").post(params, function(error, data) {
      let ret_data = JSON.parse(data.responseText);
      // console.log(ret_data);
      self.update_side('left', text, ret_data['left']);
      self.update_side('right', text, ret_data['right']);
      self.stop_loading();
    })
  }
  update_side(side, text, data) {
    let empty = ((side == 'left' && this.model_left == 'none') || (side == 'right' && this.model_right == 'none'));
    let is_nn = (side == 'left' && this.model_left == 'nn') || (side == 'right' && this.model_right == 'nn');
    side = side == 'left' ? this.left : this.right;
    if (empty) {
      side.exp_div.style('visibility', 'hidden');
      side.pp_div.style('visibility', 'hidden');
      side.text_div.style('visibility', 'hidden');
      return;
    }
    side.exp_div.style('visibility', 'visible');
    side.pp_div.style('visibility', 'visible');
    side.text_div.style('visibility', 'visible');
    side.predict_proba.update(data['predict_proba'])
    let linear_exp = {}
    linear_exp['word_weight'] = data['explanation']
    linear_exp['class'] = 1;
    let explanation = new ProsAndCons(linear_exp, is_nn);
    explanation.show(side.exp_div);
    explanation.show_raw(side.text_div, text);
  }
  build_side(side_object, div_id) {
    let div = d3.select(div_id);
    let select_width = 130;
    side_object.model_select = div.append('div').style('float', 'left').style('width', select_width + 'px').append('select');
    let total_width = parseInt(div.style('width'))
    let pp_width = 200;
    let pp_div = div.append('div').style('width', `${pp_width}px`).style('float', 'left');
    side_object.pp_div = pp_div;
    let svg = pp_div.append('svg').style('width', `${pp_width}px`);
    side_object.predict_proba = new PredictProba(svg, ['bla', 'bledfskljflajfd']);
    let exp_width = Math.min(total_width - pp_width - select_width, 300);
    side_object.exp_div = div.append('div').style('width', `${exp_width}px`).style('float', 'left');
    side_object.text_div = div.append('div').style('width', '90%').style('float', 'left').style('height', '300px');
  }
  start_loading(ms) {
    let self = this;
    self.is_loading = true;
    let temp = setTimeout(function() {
      if (self.is_loading) {
        d3.select('#loading').style('visibility', 'visible')
      }
    }, ms);
  }
  stop_loading() {
    this.is_loading = false;
    d3.select('#loading').style('visibility', 'hidden')
  }
}
export default Visualization;

