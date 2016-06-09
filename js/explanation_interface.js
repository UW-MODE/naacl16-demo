import {range, sortBy, isUndefined} from 'lodash';
class Explanation {
  constructor (exp, raw, raw_type='text') {
    this.exp = exp;
    this.raw = raw;
    this.raw_type = raw_type;
  }
  show(div) {
    throw 'Must implement show';
  }
  show_raw(div) {
    // Implement some default behaviour
    if (this.raw_type == 'text') {
      this.display_raw_text(div, this.raw);
    }
    else if (this.raw_type == 'tabular') {
      this.display_raw_tabular(div, this.raw);
    }
  }
  set_class_colors(colors) {
    this.class_colors = colors;
  }
  set_class_names(names) {
    this.class_names = names;
  }

  // data is an array of Objects, each containing 'name', 'value'.
  // color : object that maps from id to color
  // (optional)
  display_raw_tabular(div, data, colors={}) {
    div.append('h3').text('Data row:');
    let table = div.append('table');
    table.style('border-collapse', 'collapse')
         .style('color', 'white')
         .style('width', '100% !important')
         .style('table-layout', 'fixed')
         .style('overflow', 'scroll')
         .style('border-style', 'hidden');
    let thead = table.append('tr').style('background-color' , 'gray') ;
    let tbody = table.append('tr').attr('id', 'raw_tabular_body');
    for (let i of range(data.length)) {
      let feature = data[i];
      if (isUndefined(this.exp['show_only_colored']) || !isUndefined(colors[i])) {
        thead.append('td').text(feature['name'])
        let element = tbody.append('td').text(feature['value'])
        if (!isUndefined(colors[i])) {
          element.style('background-color', colors[i]);
        }
        else {
          element.style('color', 'black');
        }
      }
    }
    table.selectAll('td').style('padding', '8px')
                         .style('border-style', 'hidden')
                         .style('max-width', '150px')
                         //.style('word-break', 'break-all');
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
      let after = node.splitText(start);
      after.nodeValue = after.nodeValue.substring(word.length);
      node.parentNode.insertBefore(match, after);
      subtract += end;
      node = after;
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
export default Explanation;

