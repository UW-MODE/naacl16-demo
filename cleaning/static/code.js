var class_names = data.class_names;
var classes = new Classes(data.class_names, 200)
var instances = _.shuffle(data.instances);
instances = instances.slice(0,6);
d3.select('#instance_ids').attr('value', _.reduce(_.map(instances, function(d) { return d.id;}), function(a, sum) {return a + "," + sum;}))
var colors = d3.scale.category10().domain([0,1]);
var preds1, preds2;
var explain1, explain2;
var current=0;
var left_c1 = Math.random() > 0.5;
// Fix random location on form.
if (!left_c1) {
  d3.select('#c1_radio').attr('value', 'c2');
  d3.select('#c2_radio').attr('value', 'c1');
}
d3.select('#n_examples').text(instances.length);

var Previous = function() {
  if (current == -1) {
    HideForm();
    current = instances.length;
  }
  if (current == 0) {
    return;
  }
  current = current - 1;
  ShowExample(current);
}
var Next = function() {
  if (current == -1) {
    return;
  }
  if (current == instances.length - 1) {
    ShowForm();
    current = -1;
    return;
  }
  current = current + 1;
  ShowExample(current);
}
var ShowForm = function() {
  d3.selectAll('.form_stuff').classed('hidden', false);

  d3.select('.explanations').classed('hidden', true);
  d3.select('#example_counter').classed('hidden', true);
  d3.select('#explain_text_div').classed('hidden', true);
  d3.select('.true_class').classed('hidden', true);
  d3.select('#true_class_svg').classed('hidden', true);
  
}
var HideForm = function() {
  d3.selectAll('.form_stuff').classed('hidden', true);
  d3.select('.explanations').classed('hidden', false);
  d3.select('#example_counter').classed('hidden', false);
  d3.select('#explain_text_div').classed('hidden', false);
  d3.select('.true_class').classed('hidden', false);
  d3.select('#true_class_svg').classed('hidden', false);
  
}
var DrawSkeletons = function() {
  var svg = d3.select('#true_class_svg');
  svg.attr('width', 120)
     .attr('height', 30);
  var true_class = svg.append('g')
  true_class.append('circle')
    .attr('cx', 15)
    .attr('cy', 15)
    .attr('r',  30 / 2)
    //.style('fill', colors(data.true_class));
  true_class.append("text").attr("x", 40).attr("y", 20).attr("fill", "black").style("font", "14px tahoma, sans-serif");
  
  svg = d3.select('#c1').select('.pred');
  //svg.append("text").attr("x", 0).attr("y", 15).attr("fill", "black").style("font", "14px tahoma, sans-serif").text("Classifier1 Prediction:");
  preds1 = svg.append('g')
  preds1.append('circle')
    .attr('cx', 15)
    .attr('cy', 15)
    .attr('r',  30 / 2)
  preds1.append("text").attr("x", 40).attr("y", 20).attr("fill", "black").style("font", "14px tahoma, sans-serif");

  //preds1 = new HorizontalBarplot(svg, classes, 300, 225, 17, 90, 5, 25)
  svg = d3.select('#c2').select('.pred');
  //svg.append("text").attr("x", 0).attr("y", 15).attr("fill", "black").style("font", "14px tahoma, sans-serif").text("Classifier2 Prediction:");
  //preds2 = new HorizontalBarplot(svg, classes, 300, 225, 17, 90, 5, 25)
  preds2 = svg.append('g')
  preds2.append('circle')
    .attr('cx', 15)
    .attr('cy', 15)
    .attr('r',  30 / 2)
  preds2.append("text").attr("x", 40).attr("y", 20).attr("fill", "black").style("font", "14px tahoma, sans-serif");
  explain1 = new FeatureContributions("#explain1", 200, 19, 80, 40, classes, true, false);
  explain2 = new FeatureContributions("#explain2", 200, 19, 80, 40, classes, true, false);


  // this.bars = new HorizontalBarplot(this.svg, classes, width, height, bar_height, class_name_width, space_between_bars, this.bar_yshift);
  // width = 100
  // height = 225
  // bar_height = 17
  // class_name_width = 90
  // space_between_bars = 5
  // height
}
var DrawCorrectMark = function(svg, is_correct) {
  svg.select('g').remove()
  correct = svg.append('g')
  if (is_correct) {
    correct.append('polyline')
      .attr('fill', 'none')
      .attr('stroke',"#006837")
      .attr('stroke-width', '5')
      .attr('points', '1,20 10,30 30,0')
  }
  else {
    correct.append('polyline')
      .attr('fill', 'none')
      .attr('stroke',"red")
      .attr('stroke-width', '5')
      .attr('points', '2,0 30,30')
    correct.append('polyline')
      .attr('fill', 'none')
      .attr('stroke',"red")
      .attr('stroke-width', '5')
      .attr('points', '2,30 30,0')
  }
}
var ShowExample = function(i) {
  d3.select('#current_example').text('#' + (i+1));
  d3.select('#true_class_svg').select('circle').style('fill', classes.colors_i(instances[i].true_class));
  d3.select('#true_class_svg').select('text').text(classes.names[instances[i].true_class]);

  //preds1.UpdateBars(instances[i].c1.predict_proba, true);
  //preds2.UpdateBars(instances[i].c2.predict_proba, true);
  var predicted_c1 = instances[i].c1.predict_proba[0] > instances[i].c1.predict_proba[1] ? 0 : 1;
  var predicted_c2 = instances[i].c2.predict_proba[0] > instances[i].c2.predict_proba[1] ? 0 : 1;
  var predicted = left_c1 ? predicted_c1 : predicted_c2;
  preds1.select('circle').style('fill', classes.colors_i(predicted));
  preds1.select('text').text(classes.names[predicted])

  svg=d3.select('#c1').select('.correct_mark');
  DrawCorrectMark(svg, predicted == instances[i].true_class);

  predicted = left_c1 ? predicted_c2 : predicted_c1;
  preds2.select('circle').style('fill', classes.colors_i(predicted));
  preds2.select('text').text(classes.names[predicted])

  svg=d3.select('#c2').select('.correct_mark');
  DrawCorrectMark(svg, predicted == instances[i].true_class);

  max1 = _.max(_.map(instances[i].c1.exp, function(x) { return Math.abs(x[1]);}));
  max2 = _.max(_.map(instances[i].c2.exp, function(x) { return Math.abs(x[1]);}));
  max = Math.max(max1, max2);
  var exp = left_c1 ? instances[i].c1.exp : instances[i].c2.exp;
  var mz = left_c1 ? max1 : max2;
  explain1.UpdateBars(exp, max);
  mz = left_c1 ? max2 : max1;
  exp = left_c1 ? instances[i].c2.exp : instances[i].c1.exp;
  explain2.UpdateBars(exp, max);
  var data = left_c1 ? instances[i].c1.data : instances[i].c2.data;
  d3.select("#text1").html(data);
  data = left_c1 ? instances[i].c2.data : instances[i].c1.data;
  d3.select("#text2").html(data);
}
var Instructions = function() {
  d3.selectAll('div').classed('hidden', true);
  d3.select('#intro').classed('hidden', false);

  
}
DrawSkeletons()
ShowExample(0)
turkSetAssignmentID();
Instructions();
//Intro();


