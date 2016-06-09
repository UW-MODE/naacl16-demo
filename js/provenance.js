import d3 from 'd3';
import Explanation from './explanation_interface.js';
import PredictProba from './predict_proba.js';

class Provenance extends Explanation {
  constructor(exp, raw, raw_type='text') {
    super(exp, raw, raw_type=raw_type);
  }
  show(div) {
    div.classed('lime', true).classed('provenance', true);
    let this_object = this;
    let exp = this.exp;
    this.div = div;
    this.table_div = div.append('div');
    this.table_div.append('h3').text('Statistics in train');
    this.table_div.append('p').text(`Frequency: ${exp['raw_frequency']} examples (${(exp['norm_frequency'] * 100).toFixed(2)}% of train)`);
    let predict_proba_svg = this.table_div.append('svg').style('width', '250px');
    this.predict_proba = new PredictProba(predict_proba_svg, exp['class_names'], exp['class_distribution'], 'True label distribution');
    this.table_div.append('h3').text('Similar from train');
    this.table_div.style('margin-right', '50px');
    this.raw_div = div.append('div');

    let table = this.table_div.append('table');
    let thead = table.append('tr').classed('header', true);
    let thead_names = ['Id', 'True Class', 'Prediction']
    for (let name of thead_names) {
      thead.append('td').text(name);
    }
    let tbody = table.selectAll('.prov_row').data(exp['data'])
    let rows=  tbody.enter().append('tr')
                            .classed('prov_row', true)
                            .classed('active', (d, i) => i == 0 ? true : false);
    this_object.update_raw(exp['data'][0]['raw']);
    rows.append('td').text((d) => d['id']).style('color', 'black');
    rows.append('td').text(d => exp.class_names[d['true_class']]).style('background-color', d => this_object.class_colors(d['true_class']));
    rows.append('td').text(d => exp.class_names[d['prediction']]).style('background-color', d => this_object.class_colors(d['prediction']));
    rows.on('click', function(d, i) {
      rows.classed('active', false);
      d3.select(this).classed('active', true);
      this_object.update_raw(d['raw']);
      });
    return;
  }
  update_raw(raw_data) {
    this.raw_div.remove();
    this.raw_div = this.div.append('div');
    this.exp['raw_shower'].raw = raw_data;
    this.exp['raw_shower'].show_raw(this.raw_div);
  }
}
export default Provenance;
