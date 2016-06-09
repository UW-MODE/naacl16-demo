import d3 from 'd3';
import Explanation from './explanation_interface.js';
import {isUndefined} from 'lodash';

class Anchor extends Explanation {
  constructor(exp, raw, raw_type='text') {
    super(exp, raw, raw_type=raw_type);
  }
  show(div) {
    div.classed('lime', true).classed('anchor', true);
    let exp = this.exp;
    let null_exp = this.exp['rule'].length === 0;
    let temp_text = this.raw_type === 'text' ? 'present' : 'true';
    if (!null_exp) {
      div.append('p').text(`If the following are ${temp_text}:`);
    }
    let width = parseInt(div.style('width'));
    let height = parseInt(div.style('height'));
    this.indicator = exp['rule'].map(v => '1');

    let prediction = exp['prediction']
    this.centers = exp['centers']
    this.medians = exp['medians']
    this.left_quartile = exp['left_quartile']
    this.right_quartile = exp['right_quartile']
    this.boxplot = this.exp['boxplot'] === true;
    this.mins = exp['mins']
    this.maxs = exp['maxs']
    this.spreads = exp['spreads']
    this.div = div;
    let spans = div.selectAll('span').data(exp['rule'])
    let num_rules = exp['rule'].length;
    let this_object = this;
    spans = spans.enter()
    .append('span')
    .text((d, i) => d)
    .classed('btn', true)
    .on('click', function(d, i) {
      let idx = i;
      let turn_off = (this_object.indicator[idx] == '1');
      d3.select(this).classed('off', turn_off); 
      this_object.indicator[idx] = turn_off ? '0' : '1';
      this_object.update_prob();
    })
    let onoff = spans.append('span').classed('onoffswitch', true)
    onoff.append('span').classed('onoffswitch-inner', true);
    onoff.append('span').classed('onoffswitch-switch', true);
    if (null_exp) {
      div.append('p').text('No matter how the words in this document are perturbed, the prediction is always within the following range:');
    }
    else {
      div.append('p').text('Then the predictions of the model are within the following range:');
    }

    //spans.append('span').classed('switch', true);
    let svg_width = Math.min(width, 800);
    let svg_height = 80;
    let svg = div.append('svg')
                 .style('width', svg_width)
                 .style('height', svg_height);
    let padding_right = 50;
    let padding_left = 50;
    let padding_bottom = 40;
    this.xscale = d3.scale.linear([0,1]).range([padding_left, svg_width - padding_right])
    let x_axis = d3.svg.axis().scale(this.xscale).orient('bottom');

    // Draw prob line here, with prediction. save spread circle in
    // this.spreadcircle
    svg.append('g')
       .style('fill', 'none')
       .style('stroke', 'black')
       .style('shape-rendering', 'crispEdges')
       .style('font-family', 'sans-serif')
       .style('font-size', '11px')
       .attr('transform', 'translate(0, ' + (svg_height - padding_bottom) + ')')
       .call(x_axis)
    svg.append('ellipse')
       .attr('cx', this.xscale(prediction))
       .attr('cy', (svg_height - padding_bottom))
       .attr('rx', 2)
       .attr('ry', 10)
       .style('fill', 'blue');
    svg.append('text')
       .attr('x', this.xscale(prediction))
       .attr('y', (svg_height - padding_bottom - 15))
       .attr('text-anchor', 'middle')
       .text('Prediction')

    svg.append('text')
       .attr('x', this.xscale(0.5))
       .attr('y', svg_height - 8)
       .attr('text-anchor', 'middle')
       .text(`P(${exp['class_name']})`);
    let idx = this.get_idx();
    let radius = this.xscale(this.spreads[idx]) - this.xscale(0)
    this.min_max_line = svg.append('line')
      .attr('x1', this.xscale(this.mins[idx]))
      .attr('x2', this.xscale(this.maxs[idx]))
      .attr('y1', svg_height - padding_bottom)
      .attr('y2', svg_height - padding_bottom)
      .style('stroke', 'rgb(255,0,0)')
      .style('stroke-width', 2)
      .style('stroke-linecap', 'round')
      .style('stroke-dasharray', '4,10')
    this.min_line = svg.append('line')
      .attr('x1', this.xscale(this.mins[idx]))
      .attr('x2', this.xscale(this.mins[idx]))
      .attr('y1', svg_height - padding_bottom - 8)
      .attr('y2', svg_height - padding_bottom + 8)
      .style('stroke', 'rgb(255,0,0)')
      .style('stroke-width', 2)
      //.style('stroke-dasharray', '5,5')
    this.max_line = svg.append('line')
      .attr('x1', this.xscale(this.maxs[idx]))
      .attr('x2', this.xscale(this.maxs[idx]))
      .attr('y1', svg_height - padding_bottom - 8)
      .attr('y2', svg_height - padding_bottom + 8)
      .style('stroke', 'rgb(255,0,0)')
      .style('stroke-width', 2)
    if (this.boxplot) {
      this.mean_line = svg.append('line')
        .attr('x1', this.xscale(this.medians[idx]))
        .attr('x2', this.xscale(this.medians[idx]))
        .attr('y1', svg_height - padding_bottom - 18)
        .attr('y2', svg_height - padding_bottom + 18)
        .style('stroke', 'rgb(255,0,0)')
        .style('stroke-width', 4)
      this.spreadsquare = svg.append('rect')
        .attr('x', this.xscale(this.left_quartile[idx]))
        .attr('width', this.xscale(this.right_quartile[idx]) - this.xscale(this.left_quartile[idx]))
        .attr('y', (svg_height - padding_bottom - 15))
        .attr('height', 30)
        .style('fill', 'red')
        .style('fill-opacity', .5);
    }

    else {
      this.spreadcircle = svg.append('ellipse')
        .attr('cx', this.xscale(this.centers[idx]))
        .attr('cy', (svg_height - padding_bottom))
        .attr('rx', radius)
        .attr('ry', 30)
        .style('fill', 'blue')
        .style('fill-opacity', .5);
    }

    div.append('p').text('Click on any of the conditions (or multiple ones) to see the spread of the predictions if that attribute is not known.');
  }
  update_prob() {
    let idx = this.get_idx();
    let radius = this.xscale(this.spreads[idx]) - this.xscale(0)
    if (this.boxplot) {
      this.spreadsquare.transition().duration(1000)
        .attr('x', this.xscale(this.left_quartile[idx]))
        .attr('width', this.xscale(this.right_quartile[idx]) - this.xscale(this.left_quartile[idx]))
      this.mean_line.transition().duration(1000)
        .attr('x1', this.xscale(this.medians[idx]))
        .attr('x2', this.xscale(this.medians[idx]))
    }
    else {
      this.spreadcircle.transition().duration(1000)
          .attr('cx', this.xscale(this.centers[idx]))
          .attr('rx', radius);
    }
    this.min_max_line.transition().duration(1000)
      .attr('x1', this.xscale(this.mins[idx]))
      .attr('x2', this.xscale(this.maxs[idx]))
    this.min_line.transition().duration(1000)
      .attr('x1', this.xscale(this.mins[idx]))
      .attr('x2', this.xscale(this.mins[idx]))
    this.max_line.transition().duration(1000)
      .attr('x1', this.xscale(this.maxs[idx]))
      .attr('x2', this.xscale(this.maxs[idx]))
  }
  show_raw(div) {
    let features = [];
    if (!isUndefined(this.exp.features)) {
      features = this.exp.features;
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
  // show_raw(div, exp, raw) {
  //   console.log('show_raw');
  // }
  get_idx() {
    if (this.indicator.length === 0) {
      return 0;
    }
    return parseInt(this.indicator.join(''), 2);
  }
}
export default Anchor;
