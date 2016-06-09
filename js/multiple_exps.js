import {range} from 'lodash';
import Explanation from './explanation_interface.js';
class MultipleExps extends Explanation {
  constructor(exp, raw, raw_type='text') {
    super(exp, raw, raw_type=raw_type);
  }
  show(div) {
    div.classed('lime', true).classed('multiple', true);
    for (let i of range(this.exp['widths'].length)) {
      let new_div = div.append('div').style('width', this.exp['widths'][i]);
      this.exp['explainers'][i].show(new_div);
    }
  }
  show_raw(div) {
    this.exp['explainers'][0].show_raw(div);
  }
  set_class_colors(colors) {
    for (let explainer of this.exp['explainers']) {
      explainer.set_class_colors(colors);
    }
    this.class_colors = colors;
  }
  set_class_names(names) {
    for (let explainer of this.exp['explainers']) {
      explainer.set_class_names(names);
    }
    this.class_names = names;
  }

}

export default MultipleExps;
