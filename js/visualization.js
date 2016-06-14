import d3 from 'd3';
import PredictProba from './predict_proba.js';
import ProsAndCons from './pros_and_cons.js';
class Visualization {
  constructor() {
    let self = this;
    this.left = Object()
    this.right = Object()
    this.current_suggestions=[{'text' : ''}]

    this.model_left='none';
    this.model_right='none';

    this.class_names = {'20ng' : ['Atheism', 'Christian'], 'politeness':  ['rude', 'polite'], 'sentiment' : ['negative', 'positive']}
    // Buttons
    this.dataset_map = {'Religion' : '20ng', 'Politeness' : 'politeness', 'Sentiment' : 'sentiment'};
    let dataset_div = d3.select('#datasets_div')
    dataset_div.selectAll('li').data(['Religion', 'Politeness', 'Sentiment'])
        .enter().append('li')
        .append('a')
        .classed('tablink', true)
        .text(d => d)
        .on('click', function(d) {
          d3.select('#datasets_div').selectAll('a').classed('active', false);
          d3.select(this).classed('active', true);
          self.update_dataset(d)
        })
    let button = d3.select('#explain_button_div').append('button')
    button.classed('btn', true)
    button.text('Explain')
    button.on('click', () => {this.send_request(); this.true_class=-1;});
    
    // Text area
    this.textarea = d3.select('#input_text_div').append('textarea').style('width', '100%').style('height', '100%');

    // Build sides
    this.model_options = {'20ng' : ['none', 'Logistic Regression', 'Random Forest', 'Word2vec RF', 'SVM RBF', 'Clean SVM'], 
      'politeness' : ['none', 'Logistic Regression', 'Random Forest', 'SVM RBF'], 
      'sentiment' : ['none', 'Logistic Regression', 'Random Forest', 'NN on Embeddings']};
    this.model_map = {'none' : 'none', 'Logistic Regression' : 'lr', 'Random Forest' : 'rf', 'SVM RBF' : 'svm', 'NN on Embeddings' : 'nn', 'Clean SVM' : 'cleansvm', 'Word2vec RF' : 'rfemb'} 
    this.build_side(this.left, '#left_model_div');
    this.build_side(this.right, '#right_model_div');
    this.update_side('left', '', '')
    this.update_side('right', '', '')

    d3.json("static/suggestions.json", function(error, json) {
      self.suggestions = json['suggestions'];
      self.accuracy = json['accuracy'];
      self.update_dataset('Religion');
    })
  }
  update_dataset(dataset) {
    this.dataset = this.dataset_map[dataset];
    this.update_model_options(this.left);
    this.update_model_options(this.right);
    this.left.model_select.property('value', 'Logistic Regression');
    this.right.model_select.property('value', 'none');
    this.model_left = 'lr';
    this.model_right = 'none';
    this.update_suggestions()
    this.left.predict_proba.names = this.class_names[this.dataset]
    this.right.predict_proba.names = this.class_names[this.dataset]
    // Sends request
    this.true_class = this.current_suggestions[0]['true_class']
    this.update_text(this.current_suggestions[0]['text']);
  }
  update_model_options(side_object) {
    let self = this;
    side_object.model_select.html('')
    side_object.model_select.selectAll('option').data(self.model_options[self.dataset])
      .enter()
      .append('option')
      .text(d=> d)
    side_object.model_select.on('change', function(d) {
       self.send_request();
       self.update_suggestions();
    });
  }
  update_suggestions() {
    let self = this;
    let sides = []
    if (self.model_left != 'none') {
      sides.push(self.model_left);
      this.left.model_accuracy.text('Accuracy: ' + self.accuracy[self.dataset][self.model_left].toFixed(2));
    }
    if (self.model_right != 'none' && self.model_right != self.model_left) {
      sides.push(self.model_right);
      this.right.model_accuracy.text('Accuracy: ' +self.accuracy[self.dataset][self.model_right].toFixed(2));
    }
    sides.sort()
    let format_title = x => x;
    if (sides.length == 2 && sides[0] != self.model_left) {
      format_title = function(x) {
        let text = x.split('-')
        return text[0].slice(0, text[0].length - 2) + text[1].slice(0,2) + '-' + text[0].slice(-2) + ')';
      }
    }
    let model_comb = sides.join('-');
    let div = d3.select('#suggestions_div');
    div.html('');
    if (model_comb == '') {
      self.current_suggestions=[{'text' : ''}]
      return;
    }
    self.current_suggestions = self.suggestions[self.dataset][model_comb];
    div.selectAll('li').data(self.suggestions[self.dataset][model_comb])
       .enter().append('li')
       .append('a')
       .classed('tablink', true)
       .text(d => format_title(d['title']))
       .on('click', function(d) {
          d3.select('#suggestions_div').selectAll('a').classed('active', false);
          d3.select(this).classed('active', true);
          self.true_class = d['true_class']
          self.update_text(d['text'])
       });
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
    if (text == '') {
      return;
    }
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
    let self = this;
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
    side.predict_proba.update(data['predict_proba'], self.true_class)
    let linear_exp = {}
    linear_exp['word_weight'] = data['explanation']
    linear_exp['class'] = 1;
    let explanation = new ProsAndCons(linear_exp, is_nn);
    explanation.show(side.exp_div);
    explanation.show_raw(side.text_div, text);
  }
  build_side(side_object, div_id) {
    let div = d3.select(div_id).classed('model', true);
    let select_width = 130;
    let model_div = div.append('div').style('float', 'left').style('width', select_width + 'px')
    side_object.model_select = model_div.append('select');
    side_object.model_accuracy = model_div.append('div');
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

