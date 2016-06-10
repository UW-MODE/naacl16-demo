import d3 from 'd3';
import {range, sortBy} from 'lodash';

class PredictProba {
  // svg: d3 object with the svg in question
  // class_names: array of class names
  // predict_probas: array of prediction probabilities
  constructor(svg, class_names, title='Prediction probabilities') {
    let width = parseInt(svg.style('width'));
    this.names = class_names;
    this.colors_i = d3.scale.category10().domain(range(2))
    this.bar_x = width - 125;
    let class_names_width = this.bar_x;
    let bar_width = width - this.bar_x - 32;
    this.x_scale = d3.scale.linear().range([0, bar_width]);
    this.bar_height = 17;
    this.space_between_bars = 5;
    this.bar_yshift= title === '' ? 0 : 35;
    let n_bars = 2;
    this.svg_height = n_bars * (this.bar_height + this.space_between_bars) + this.bar_yshift;
    svg.style('height', this.svg_height + 'px');
    let this_object = this;
    if (title !== '') {
      svg.append('text')
        .text(title)
        .attr('x', 20)
        .attr('y', 20);
    }
    this.bar_y = i => (this.bar_height + this.space_between_bars) * i + this.bar_yshift;
    this.bar = svg.append("g");
    this.update([0.1,.1])
    for (let i of range(2)) {
      this.bar.append("rect").attr("x", this.bar_x)
          .attr("y", this.bar_y(i))
          .attr("height", this_object.bar_height)
          .attr("width", bar_width - 1)
          .attr("fill-opacity", 0)
          .attr("stroke", "black");
    }
  }
  update(predict_probas) {
    let this_object = this;
    let names = this.names
    let data = predict_probas
    let rect = this.bar.selectAll('.colored_rects').data(data)
    rect.enter().append('rect').classed('colored_rects', true)
    rect.attr("x", this_object.bar_x)
          .attr("y", (d, i) => this_object.bar_y(i))
          .attr("height", this_object.bar_height)
          .style("fill", (d, i) => this_object.colors_i(i))
    rect.transition().duration(1000).attr("width", d => this_object.x_scale(d))
    let prob_text = this.bar.selectAll('.prob_texts').data(data)
    prob_text.enter().append('text').classed('prob_texts', true)
    prob_text
          .attr("fill", "black")
          .attr("y", (d, i) => this_object.bar_y(i) + this_object.bar_height - 3)
          .style("font", "14px tahoma, sans-serif")
          .text(d => d.toFixed(2));
    prob_text.transition().duration(1000)
      .attr("x", d => this_object.bar_x + this_object.x_scale(d) + 5)
    let text_class_names = this.bar.selectAll('.class_names').data(data)
    text_class_names.enter().append('text').classed('class_names', true)
    text_class_names.attr("x", this_object.bar_x - 10)
          .attr("y", (d, i) => this_object.bar_y(i) + this_object.bar_height - 3)
          .attr("fill", "black")
          .attr("text-anchor", "end")
          .style("font", "14px tahoma, sans-serif")
          .text((d, i) => names[i]);
  }
}
export default PredictProba;


