import d3 from 'd3';
import Explanation from './explanation_interface.js';
import Barchart from './bar_chart.js';
import {isUndefined} from 'lodash';
class ProsAndCons extends Explanation {
  constructor(exp, raw, raw_type='text') {
    super(exp, raw, raw_type=raw_type);
  }
  show(div) {
    let svg = div.append('svg').style('width', '100%');
    let colors=[this.class_colors(0), this.class_colors(1)];
    console.log(colors);
    let word_weight = this.exp['feature_word_weight'].map(x => [x[1], x[2]]);
    let two_sided = !isUndefined(this.exp['two_sided'])



    if (two_sided) {
      svg.style('width', '50%');
      let svg2 = div.append('svg').style('width', '50%');
      let pos = word_weight.filter(x => x[1] > 0.00000001);
      let neg = word_weight.filter(x => x[1] < -0.00000001);
      let plot1 = new Barchart(svg, pos, false, 'Pros', colors);
      let plot2 = new Barchart(svg2, neg, false, 'Cons', colors);
      let max_height = Math.max(plot1.svg_height, plot2.svg_height);
      svg.style('height', max_height);
      svg2.style('height', max_height);

    }
    else {
      let plot = new Barchart(svg, word_weight, true, undefined, colors);
      svg.style('height', plot.svg_height);
    }
  }
  // this.exp must have class and feature_word_weight
  show_raw(div) {
    let colors=['#5F9EA0', this.class_colors(this.exp['class'])];
    let word_lists = [[], []]
    let colors_obj = {}
    for (let [feature, word, weight] of this.exp['feature_word_weight']) {
      if (weight > 0) {
        word_lists[1].push(word);
        colors_obj[feature] = colors[1]
      }
      else {
        word_lists[0].push(word);
        colors_obj[feature] = colors[0]
      }
    }
    if (this.raw_type == 'text') {
      this.display_raw_text(div, this.raw, word_lists, colors);
    }
    else if (this.raw_type == 'tabular') {
      this.display_raw_tabular(div, this.raw, colors_obj);
    }
  }
}
export default ProsAndCons;
