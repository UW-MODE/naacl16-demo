import d3 from 'd3';
import PredictProba from './predict_proba.js';
import ProsAndCons from './pros_and_cons.js';
class Visualization {
  constructor() {
    let self = this;
    this.left = Object()
    this.right = Object()
    // TODO
    this.dataset = '20ng';
    let button = d3.select('#buttons_div').append('button')
    button.on('click', () => this.send_request());
    this.textarea = d3.select('#input_text_div').append('textarea').style('width', '100%').style('height', '100%');
    this.build_side(this.left, '#left_model_div');
    this.build_side(this.right, '#right_model_div');
    d3.json("static/suggestions.json", function(error, json) {
      self.suggestions = json;
      self.update_suggestions();
    })
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
    let params = {'text' : text};
    params = JSON.stringify(params);
    d3.xhr("api/explain", "application/json").post(params, function(error, data) {
      let ret_data = JSON.parse(data.responseText);
      console.log(ret_data);
      self.update_side('left', text, ret_data['left']);
      self.update_side('right', text , ret_data['right']);
    })
  }
  update_side(side, text, data) {
    side = side == 'left' ? this.left : this.right;
    side.predict_proba.update(data['predict_proba'])
    let linear_exp = {}
    linear_exp['word_weight'] = data['explanation']
    linear_exp['class'] = 1;
    let explanation = new ProsAndCons(linear_exp, text);
    explanation.show(side.exp_div);
    explanation.show_raw(side.text_div, text);
  }
  build_side(side_object, div_id) {
    let div = d3.select(div_id);
    let total_width = parseInt(div.style('width'))
    let pp_width = 200;
    let pp_div = div.append('div').style('width', `${pp_width}px`).style('float', 'left');
    let svg = pp_div.append('svg').style('width', `${pp_width}px`);
    side_object.predict_proba = new PredictProba(svg, ['bla', 'bledfskljflajfd']);
    let exp_width = Math.min(total_width - pp_width, 300);
    side_object.exp_div = div.append('div').style('width', `${exp_width}px`).style('float', 'left');
    side_object.text_div = div.append('div').style('width', '100%').style('float', 'left').style('height', '300px');
  }
}
export default Visualization;

