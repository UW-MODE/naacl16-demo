var HorizontalBarplot = function (svg, classes, width, height, bar_height, class_name_width, space_between_bars, bar_yshift) {
  this.svg = svg;
  this.width = width;
  this.height = height;
  this.classes = classes;
  this.bar_height = bar_height;
  this.space_between_bars = space_between_bars;
  this.bar_x = class_name_width;
  this.bar_width = this.width - this.bar_x - 33;
  this.x_scale = d3.scale.linear().range([0, this.bar_width]);
  this.bar_yshift = bar_yshift;
  this.precision = 2;
  this.DrawSkeleton();
}

HorizontalBarplot.prototype.SetDomainMax = function(domain_max) {
  this.x_scale.domain([0, domain_max]);
}
HorizontalBarplot.prototype.SetPrecision = function(precision_digits) {
  this.precision = precision_digits;
}
// Returns the y position of bar i
HorizontalBarplot.prototype.BarY = function(i) {
  return (this.bar_height + this.space_between_bars) * i + this.bar_yshift;
}
// Returns the number of bars that can fit in the height alloted
HorizontalBarplot.prototype.NumBars = function() {
  var max_bars = Math.floor((this.height - this.bar_yshift) / (this.bar_height + this.space_between_bars));
  return Math.min(this.classes.names.length, max_bars);
}
// Draws the empty bars. If stuff already exists, delete them and redraw
HorizontalBarplot.prototype.DrawSkeleton = function() {
  this.n_bars = this.NumBars();
  this.svg.selectAll(".bars").remove();
  var bar = this.svg.append("g");
  bar.classed("bars", true);
  for (i = 0; i < this.n_bars; i++) {
    rect = bar.append("rect");
    rect.classed("bar_rect", true);
    rect.attr("x", this.bar_x)
        .attr("y", this.BarY(i))
        .attr("height", this.bar_height)
        .attr("width", 0);
    bar.append("rect").attr("x", this.bar_x)
        .attr("y", this.BarY(i))
        .attr("height", this.bar_height)
        .attr("width", this.bar_width - 1)
        .attr("fill-opacity", 0)
        .attr("stroke", "black");
    text = bar.append("text");
    text.classed("prob_text", true);
    text.attr("y", this.BarY(i) + this.bar_height - 3).attr("fill", "black").style("font", "14px tahoma, sans-serif");
    text = bar.append("text");
    text.classed("class_name", true)
    text.attr("x", this.bar_x - 10).attr("y", this.BarY(i) + this.bar_height - 3).attr("fill", "black").attr("text-anchor", "end").style("font", "14px tahoma, sans-serif");
  }
}
HorizontalBarplot.prototype.MapClassesToNameProbsAndColors = function(predict_proba) {
  var this_object = this;
  if (this.classes.names.length <= this.n_bars) {
    return [this.classes.names, predict_proba];
  }
  class_dict = _.map(_.range(this_object.classes.names.length), function (i) {return {'name': this_object.classes.names[i], 'prob': predict_proba[i], 'i' : i};});
  sorted = _.sortBy(class_dict, function (d) {return -d.prob});
  other = new Set();
  _.forEach(_.range(this.n_bars - 1, sorted.length), function(d) {other.add(sorted[d].name);});
  other_prob = 0;
  ret_probs = [];
  ret_names = [];
  for (d = 0 ; d < sorted.length; d++) {
    if (other.has(sorted[d].name)) {
      other_prob += sorted[d].prob;
    }
    else {
      ret_probs.push(sorted[d].prob);
      ret_names.push(sorted[d].name);
    }
  };
  ret_names.push("other");
  ret_probs.push(other_prob);
  return [ret_names, ret_probs];
}
HorizontalBarplot.prototype.UpdateBars = function(predict_proba, instant) {
  mapped = this.MapClassesToNameProbsAndColors(predict_proba);
  names = mapped[0];
  data = mapped[1];
  var pred = this.svg.selectAll(".bars")
  var bars = pred.selectAll(".bar_rect").data(data);
  var this_object = this;
  var change_obj = instant ? bars : bars.transition().duration(1000);
  change_obj
      .attr("width", function(d) { return this_object.x_scale(d)})
      .style("fill", function(d, i) {return this_object.classes.colors(names[i]);});
  bar_text = pred.selectAll(".prob_text").data(data);
  change_obj = instant ? bar_text : bar_text.transition().duration(1000);
  change_obj
      .attr("x", function(d) { return this_object.bar_x + this_object.x_scale(d) + 5;})
      .attr("fill", "black")
      .text(function(d) { return d.toFixed(this_object.precision)});
  name_object = pred.selectAll(".class_name").data(names)
  change_obj = instant ? name_object : name_object.transition().duration(1000);
  change_obj.text(function(d) {return d;});
}
