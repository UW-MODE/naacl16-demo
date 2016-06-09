import {range, isUndefined} from 'lodash';
import d3 from 'd3';
import Explanation from './explanation_interface.js';
import Barchart from './bar_chart.js';
class LocalApproximation extends Explanation {
  constructor(exp, raw, raw_type='text') {
    super(exp, raw, raw_type=raw_type);
    this.weights = new Map();
    this.values = new Map();
    this.original_values = new Map();
    this.std = new Map();
    for (let [id, name, weight] of this.exp['feature_word_weight']) {
      let idx = this.raw_type == 'tabular' ? id : name;
      let w2 = weight;
      if (!isUndefined(this.raw[idx]) && this.raw_type == 'tabular' && !isUndefined(this.raw[idx]['std'])) {
        w2 = w2 / this.raw[idx]['std']
        this.std.set(idx, +this.raw[idx]['std']);
      }
      this.weights.set(idx, w2);
    }
    for (let [key, _] of this.weights) {
      let val = 1;
      if (!isUndefined(this.raw[key]) && this.raw_type == 'tabular' && !isUndefined(this.raw[key]['std'])) {
        val = this.raw[key]['value'];
      }
      this.values.set(key, +val);
      this.original_values.set(key, +val);
    }


  }
  show(div) {
    div.classed('lime', true).classed('local', true);
    let svg = div.append('svg').style('width', '300px');
    let colors= this.get_colors();
    let word_weight = this.exp['feature_word_weight'].map(x => [x[1], x[2]]);
    let plot = new Barchart(svg, word_weight, true, 'Local Model', colors);
    svg.style('min-height', plot.svg_height);
    let local_prob = div.append('svg').style('width', '250px');
    this.make_local_prob(local_prob, this.exp['class_name'], colors[1]);
  }
  // this.exp must have class and feature_word_weight
  show_raw(div) {
    let this_object = this;
    div.classed('lime', true).classed('local', true);
    let word_lists = [[], []]
    let colors = this.get_colors();
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
      let all_spans = div.select('span').selectAll('span');
      all_spans.on('click', function(d) {
        let feature = d3.select(this).text();
        let val = this_object.values.get(feature);
        let selection = all_spans.filter(function(d, i)  {return d3.select(this).text() == feature; })
        if (val == 1) {
          this_object.values.set(feature, 0);
          selection.style('text-decoration', 'line-through');
        }
        else {
          this_object.values.set(feature, 1);
          selection.style('text-decoration', 'none');
        }
        this_object.update_local_approximation();

        }  
      );
        //else {
        //  d3.select(this).on('click', function(d) {
        //    let val = this_object.values.get(i);
        //    let cell = d3.select(this);
        //    if (val == 1) {
        //      this_object.values.set(i, 0);
        //      cell.style('text-decoration', 'line-through');
        //    }
        //    else {
        //      this_object.values.set(i, 1);
        //      cell.style('text-decoration', 'none');
        //    }
        //    this_object.update_local_approximation();
        //  }
        //  )
        //}
      //div.select('span').selectAll('span')
    }
    else if (this.raw_type == 'tabular') {
      this.display_raw_tabular(div, this.raw, colors_obj);
      let zer = div.select('table').select('#raw_tabular_body').selectAll('td').each(function (d, i) {
        d3.select(this).style('min-width', '90px');
        if (this_object.std.has(i)) {
          let cell = d3.select(this);
          let text = cell.text();
          cell.text("");
          let old_span = cell.append('span').text(text);
          let new_span = cell.append('span');
          cell.append('a').append('span').classed('bottom-pointer', true).on('click', function(d) {
              //console.log("Before " + this_object.values.get(i));
              //console.log("STD " + this_object.std.get(i));
              this_object.values.set(i, this_object.values.get(i) - this_object.std.get(i));
              //console.log("After " + this_object.values.get(i));
              this_object.update_local_approximation();
              let new_val = this_object.values.get(i);
              let old_val = this_object.original_values.get(i);
              if (new_val == old_val) {
                old_span.style('text-decoration', 'none').style('margin-right', '0px');
                new_span.text('')
              }
              else {
                old_span.style('text-decoration', 'line-through').style('margin-right', '10px');;
                new_span.text(new_val.toFixed(2));
              }
              //span.text(this_object.values.get(i));
              //cell.style('color', 'black');
            }
            );
          d3.select(this).append('a').append('span').classed('top-pointer', true).on('click', function(d) {
              this_object.values.set(i, this_object.values.get(i) + this_object.std.get(i));
              this_object.update_local_approximation();
              let new_val = this_object.values.get(i);
              let old_val = this_object.original_values.get(i);
              if (new_val == old_val) {
                old_span.style('text-decoration', 'none').style('margin-right', '0px');
                new_span.text('')
              }
              else {
                old_span.style('text-decoration', 'line-through').style('margin-right', '10px');;
                new_span.text(new_val.toFixed(2));
              }
              }
            );
        }
        else {
          d3.select(this).on('click', function(d) {
            let val = this_object.values.get(i);
            let cell = d3.select(this);
            if (val == 1) {
              this_object.values.set(i, 0);
              cell.style('text-decoration', 'line-through');
            }
            else {
              this_object.values.set(i, 1);
              cell.style('text-decoration', 'none');
            }
            this_object.update_local_approximation();
          }
          )
        }
      });
        //filter((d,i) => this_object.std.has(i));
      //zer.append('a').append('span').classed('top', true).on('click', (d, i) => console.log(i));
      //zer.append('a').append('span').classed('bottom', true);
    }
  }
  get_colors() {
    let colors;
    if (this.class_names.length == 3) {
      colors = [this.class_colors(0), this.class_colors(1)];
    }
    else {
      colors=['#5F9EA0', this.class_colors(this.exp['class'])];
    }
    return colors;
  }
  make_local_prob(svg, name, color) {
    let width = parseInt(svg.style('width'));
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('font-size', '20')
        .attr('text-anchor', 'middle')
        .text('Local Approximation');
    this.bar_x = width - 125;
    let class_names_width = this.bar_x;
    let bar_width = width - this.bar_x - 32;
    this.x_scale = d3.scale.linear().range([0, bar_width]);
    let bar_height = 17;
    let bar_yshift=35;
    let bar = svg.append("g");
    this.local_bar = bar.append("rect");
    this.local_bar.attr("x", this.bar_x)
        .attr("y", bar_yshift)
        .attr("height", bar_height)
        .attr("width", this.x_scale(0))
        .style("fill", color);
    bar.append("rect").attr("x", this.bar_x)
        .attr("y", bar_yshift)
        .attr("height", bar_height)
        .attr("width", bar_width - 1)
        .attr("fill-opacity", 0)
        .attr("stroke", "black");
    let text = bar.append("text");
    text.classed("prob_text", true);
    text.attr("y", bar_yshift + bar_height - 3).attr("fill", "black").style("font", "14px tahoma, sans-serif");
    this.local_number = bar.append("text")
        .attr("x", this.bar_x + this.x_scale(0) + 5)
        .attr("y", bar_yshift + bar_height - 3)
        .attr("fill", "black")
        .style("font", "14px tahoma, sans-serif")
        .text('0');
    // text.attr("x", this.bar_x + this.x_scale(data[i]) + 5)
    //     .attr("y", bar_yshift + bar_height - 3)
    //     .attr("fill", "black")
    //     .style("font", "14px tahoma, sans-serif")
    //     .text(data[i].toFixed(2));
    text = bar.append("text");
    text.attr("x", this.bar_x - 10)
        .attr("y", bar_yshift + bar_height - 3)
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .style("font", "14px tahoma, sans-serif")
        .text(`P(${name}) = `);
    while (text.node().getBBox()['width'] + 1 > (class_names_width - 10)) {
      // TODO: ta mostrando só dois, e talvez quando hover mostrar o texto
      // todo
      let cur_text = text.text().slice(0, text.text().length - 8);
      text.text(cur_text + '...) = ');
    }
    this.update_local_approximation()
  }
  update_local_approximation() {
    let total = 0;
    for (let [key, weight] of this.weights) {
      let val = this.values.get(key);
      total += weight * val;
    }
    total = Math.max(0, total);
    total = Math.min(1, total);
    this.local_bar.transition()
        .duration(1000)
        .attr("width", this.x_scale(total));
    this.local_number.transition()
        .duration(1000)
        .attr("x", this.bar_x + this.x_scale(total) + 5)
        .text(total.toFixed(2));
  }
}
export default LocalApproximation;
