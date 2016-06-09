import d3 from 'd3';
import Explanation from './explanation_interface.js';
import PredictProba from './predict_proba.js';
import {isUndefined} from 'lodash';

class SuggestedChanges extends Explanation {
  constructor(exp, raw, raw_type='text') {
    super(exp, raw, raw_type=raw_type);
  }
  show(div) {
    div.classed('lime', true).classed('suggested', true);
    let exp = this.exp;
    let is_text = this.raw_type === 'text';
    if (isUndefined(exp.feature_changes)) {
      if(is_text) {
        div.append('p').text('There are no word removals that change the prediction.');
      }
      else {
        div.append('p').text('There is no way to change the prediction.');
      }
      return;
    }
    let change = is_text ? 'removed' : 'changed'
    div.append('p').text(`If the following are ${change}:`);
    let width = parseInt(div.style('width'));
    let height = parseInt(div.style('height'));
    let feature_changes = exp['feature_changes'];
    for (let feature_change of feature_changes) {
      let span = div.append('span')
         .classed('btn', true)
      if (!is_text) {
        span.append('span').text(`${this.raw[feature_change[0]]['name']} = `);
        span.append('span')
        .text(`${this.raw[feature_change[0]]['value']}`)
        .classed('old_value', true);
        span.append('span')
          .text(feature_change[1].toFixed(2))
          .classed('new_value', true);
      }
      else {
        span.append('span')
        .text(`${feature_change[0]}`)
        .classed('old_value', feature_change[1] == 0 ? true : false);
      }
    }
    div.append('p').text('Then the prediction becomes:');
    let predict_proba_div = div.append('div')
      .style('width', '250px')
      .style('float', 'left')
      .style('margin-right', '20px');
    let predict_proba_svg = predict_proba_div.append('svg').style('width', '250px');
    let predict_proba = new PredictProba(predict_proba_svg, exp['class_names'], exp['new_predict_proba'], '');
  }
  show_raw(div) {
    let features = [];
    if (!isUndefined(this.exp['feature_changes'])) {
      features = this.exp['feature_changes'].map(x => x[0]);
    }
    if (this.raw_type == 'text') {
      let word_lists = [features];
      let colors = ['#FFF380'];
      this.display_raw_text(div, this.raw, word_lists, colors);
    }
    else if (this.raw_type == 'tabular') {
      let colors_obj = {}
      features.map(x => colors_obj[x] = '#FFF380');
      this.display_raw_tabular(div, this.raw, colors_obj);
    }

  }
}
export default SuggestedChanges;
