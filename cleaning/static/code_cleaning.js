var class_names = data.class_names;
var classes = new Classes(data.class_names, 200)
var instances = _.shuffle(data.instances);
d3.select('#instance_ids').attr('value', _.reduce(_.map(instances, function(d) { return d.id;}), function(a, sum) {return a + "," + sum;}))
var colors = d3.scale.category10().domain([0,1]);
var preds1;
var explain1;
var current=0;
var clicked_words = new Set();
var ToggleClicked = function(word) {
  if (clicked_words.has(word)) {
    clicked_words.delete(word);
  } 
  else {
    clicked_words.add(word);
  }
  var current_words = [];
  clicked_words.forEach(function(d) {current_words.push(d);})
  words_text = _.reduce(current_words, function(sum, n) { return sum + "," + n;})
  d3.select('#badwords').attr('value', words_text);

}
// Fix random location on form.
d3.select('#n_examples').text(instances.length);
d3.select('#c1').style('height', '520px');
d3.select("#explain_text_div").style('float', 'left').style('width', '48%').style('clear', 'none').style('height', '520px');
d3.select("#explain_text_div").style('float', 'left').style('width', '48%').style('clear', 'none');
d3.select(".explain_text")
  .style('width', 'auto')
  .style('margin', '0px')
  .style('border-left', '1px solid')
  .style('border-right','1px solid')
  .style('border-top', '1px solid')
  .style('border-bottom', '1px dashed')
  .style('padding', '10px');
d3.select(".explanations").style('display', 'inline');

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
  d3.select('#c1').classed('hidden', true);
  d3.select('#example_counter').classed('hidden', true);
  d3.select('#explain_text_div').classed('hidden', true);
  d3.select('.true_class').classed('hidden', true);
  d3.select('#true_class_svg').classed('hidden', true);
  ShowSelectedFeatures();
  
}
var HideForm = function() {
  d3.selectAll('.form_stuff').classed('hidden', true);
  d3.select('.explanations').classed('hidden', false);
  d3.select('#c1').classed('hidden', false);
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

  explain1 = new FeatureContributions("#explain1", 200, 19, 80, 40, classes, true, true);

  // this.bars = new HorizontalBarplot(this.svg, classes, width, height, bar_height, class_name_width, space_between_bars, this.bar_yshift);
  // width = 100
  // height = 225
  // bar_height = 17
  // class_name_width = 90
  // space_between_bars = 5
  // height
  d3.select('#submitButton').on('click', function() {
    badwords = d3.select('#badwords').node().value
    params = JSON.stringify({'bad_words' : badwords})
    //d3.select("#RESPONSE_old").text('computing')
    d3.select("#RESPONSE_new").text('computing')
    d3.xhr("api/finish", "application/json").post(params, function(error, data) {
      ret_data = JSON.parse(data.responseText);
      //d3.select('#RESPONSE_old').text(ret_data['old_accuracy'].toFixed(3));
      d3.select('#RESPONSE_new').text(ret_data['new_accuracy'].toFixed(3) + '%');
    });
  })
}
var ShowSelectedFeatures = function () {
  var current_words = [];
  clicked_words.forEach(function(d) {current_words.push(d);})
  div = d3.select('#selected_features');
  div.selectAll(".active_features").remove();
  saved = div.selectAll(".active_features").data(current_words)
  zs = saved.enter().append("span")
  zs.classed("active_features", true);
  ps = zs.append("span");
  ps.classed('active_text', true)
    .html(function(d,i) { return '&nbsp;&nbsp;' +  d + '&nbsp;&nbsp;'})
  xs = zs
       .append("span")
       .html("&#10799 ")
       .on("click", function(d) {
          ToggleClicked(d);
          ShowSelectedFeatures()
        });
  xs.style("color", "red").style('cursor', 'pointer');
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
  d3.select('.pred').classed('hidden', true)
  d3.select('.correct_mark').classed('hidden', true)
  d3.select('#current_example').text('#' + (i+1));
  d3.select('#true_class_svg').select('circle').style('fill', classes.colors_i(instances[i].true_class));
  d3.select('#true_class_svg').select('text').text(classes.names[instances[i].true_class]);

  //preds1.UpdateBars(instances[i].c1.predict_proba, true);
  //preds2.UpdateBars(instances[i].c2.predict_proba, true);
  var predicted_c1 = instances[i].c1.predict_proba[0] > instances[i].c1.predict_proba[1] ? 0 : 1;
  preds1.select('circle').style('fill', classes.colors_i(predicted_c1));
  preds1.select('text').text(classes.names[predicted_c1])

  svg=d3.select('#c1').select('.correct_mark');
  DrawCorrectMark(svg, predicted_c1 == instances[i].true_class);

  max1 = _.max(_.map(instances[i].c1.exp, function(x) { return Math.abs(x[1]);}));
  var exp = instances[i].c1.exp;
  explain1.UpdateBars(exp, max1);
  var data = instances[i].c1.data;
  d3.select("#text1").html(data);
}
var Instructions = function() {
  d3.selectAll('div').classed('hidden', true);
  d3.select('#intro').classed('hidden', false);
}
var Start = function() {
  d3.selectAll('div').classed('hidden', false);
  d3.selectAll('svg').classed('hidden', false);
  d3.select('#intro').classed('hidden', true);
  d3.selectAll('.form_stuff').classed('hidden', true);
  current = 0;
  ShowExample(0);
}
DrawSkeletons()
ShowExample(0)
Instructions();
//Intro();


