import d3 from 'd3';
import Barchart from './bar_chart.js';
import {sortBy, range, isUndefined} from 'lodash';
class ProsAndCons { 
  constructor(exp, positions=false) {
    this.exp = exp;
    this.class_colors = d3.scale.category10().domain(range(2))
    this.positions = positions;
  }
  remove_underline(word_weight) {
    let ret = []
    for (let ww of word_weight) {
      let word = ww[0];
      let idx = word.lastIndexOf('_');
      if (idx == -1) {
        ret.push(ww);
      }
      else {
        ret.push([word.substring(0, idx), ww[1]]);
      }
    }
    return ret;
  }
  show(div) {
    div.html('');
    let svg = div.append('svg').style('width', '100%');
    let colors=[this.class_colors(0), this.class_colors(1)];
    let word_weight = this.exp['word_weight']
    if (this.positions) {
      word_weight = this.remove_underline(word_weight);
    }
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
  show_raw_positions(div, text) {
    div.html('');
    let colors=[this.class_colors(0), this.class_colors(1)];
    let word_weight = this.exp['word_weight']
    let word_lists = [[], []]
    for (let [word, weight] of this.exp['word_weight']) {
      let idx = word.lastIndexOf('_')
      if (idx == -1) {
        continue;
      }
      let word2 = word.substring(0, idx);
      let start = +(word.substring(idx+1))
      let end = start + word2.length
      if (weight > 0) {
        word_lists[1].push([start, end]);
      }
      else {
        word_lists[0].push([start, end]);
      }
    }
    this.display_raw_text(div, text, word_lists, colors, true);
  }
  // this.exp must have word_weight
  show_raw(div, text) {
    if (this.positions) {
      this.show_raw_positions(div, text);
      return;
    }
    div.html('');
    let colors=[this.class_colors(0), this.class_colors(1)];
    let word_weight = this.exp['word_weight']
    let word_lists = [[], []]
    for (let [word, weight] of this.exp['word_weight']) {
      if (weight > 0) {
        word_lists[1].push(word);
      }
      else {
        word_lists[0].push(word);
      }
    }
    this.display_raw_text(div, text, word_lists, colors);
  }

  // Words is an array of arrays, of length (colors). if with_positions is true,
  // words is an array of [start,end] positions instead
  display_raw_text(div, raw_text, word_lists=[], colors=[], positions=false) {
    div.classed('lime', true).classed('text_div', true);
    div.append('h3').text('Text with highlighted words');
    let highlight_tag = 'span';
    let text_span = div.append('span').text(raw_text);
    let position_lists = word_lists;
    if (!positions) {
      position_lists = this.wordlists_to_positions(word_lists, raw_text);
    }
    let objects = []
    for (let i of range(position_lists.length)) {
      position_lists[i].map(x => objects.push({'label' : i, 'start': x[0], 'end': x[1]}));
    }
    objects = sortBy(objects, x=>x['start']);
    let node = text_span.node().childNodes[0];
    let subtract = 0;
    for (let obj of objects) {
      let word = raw_text.slice(obj.start, obj.end);
      let start = obj.start - subtract;
      let end = obj.end - subtract;
      let match = document.createElement(highlight_tag);
      match.appendChild(document.createTextNode(word));
      match.style.backgroundColor = colors[obj.label];
      try {
        let after = node.splitText(start);
        after.nodeValue = after.nodeValue.substring(word.length);
        node.parentNode.insertBefore(match, after);
        subtract += end;
        node = after;
      }
      catch (err){
      }
    }
  }
  wordlists_to_positions(word_lists, raw_text) {
    let ret = []
    for(let words of word_lists) {
      if (words.length === 0) {
        ret.push([]);
        continue;
      }
      let re = new RegExp("\\b(" + words.join('|') + ")\\b",'igm')
      let temp;
      let list = [];
      while ((temp = re.exec(raw_text)) !== null) {
        list.push([temp.index, temp.index + temp[0].length]);
      }
      ret.push(list);
    }
    return ret;
  }
}
export default ProsAndCons;
