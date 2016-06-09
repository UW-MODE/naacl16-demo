import d3 from 'd3';
import PredictProba from './predict_proba.js';

class ExplanationFrame {
  // explanation parameter is of type Explanation from explanation_interface.js
  // prediction is a map that has keys 'predict_proba', 'class_names', 'true_class'
  // Creates the 3 divs: predict_proba, raw_data and explanation
  // Call explanation.show(div) and explanation.show_raw(div)
  constructor (div, prediction, explanation) {
    let space_between_divs = 50;
    let div_width = parseInt(div.style('width'));
    let predict_proba_div = div.append('div')
      .style('width', '250px')
      .style('float', 'left')
      .style('margin-right', space_between_divs + 'px');
                  
    let raw_div = div.append('div').style('width', (div_width - 250 - space_between_divs) + 'px').style('float', 'left');
    let exp_div = div.append('div').style('width', '100%').style('float', 'left');

    // Predict Proba
    let predict_proba_svg = predict_proba_div.append('svg').style('width', '250px');
    this.predict_proba = new PredictProba(predict_proba_svg, prediction['class_names'], prediction['predict_proba']);
    let predict_proba_height = this.predict_proba.svg_height;

    let true_class_height = 30;
    let true_class_svg = predict_proba_div.append('svg').style('width', '100%').style('height', true_class_height + 'px');
    true_class_svg.append('text')
                  .attr('x', 20)
                  .attr('y', 20)
                  .text('True Class:');
    true_class_svg.append('circle')
                  .attr('cx', 95 + 40)
                  .attr('cy', 15)
                  .attr('r', 15)
                  .attr('fill', this.predict_proba.colors_i(prediction['true_class']))


    predict_proba_div.style('height', (true_class_height + predict_proba_height + 10) + 'px');

    explanation.set_class_colors(this.predict_proba.colors_i);
    explanation.set_class_names(prediction['class_names']);
    // Raw data
    explanation.show_raw(raw_div);
    // Explanation
    explanation.show(exp_div);
  }
}
export default ExplanationFrame;

