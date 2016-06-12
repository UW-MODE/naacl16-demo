// Selected features is a set passed by reference. It will be modified by other
// stuff. maybe I should change this in the future.
var FeatureContributions = function (id, width, bar_height, x_offset, right_x_offset, classes, normalize, clickable_words) {
  this.clickable_words = clickable_words
  this.normalize = normalize;
  this.div = d3.select(id);
  this.svg = d3.select(id).append("svg").attr('width','100%');
  this.bars = this.svg.append('g')
                  .attr('transform', "translate(" + x_offset+ ",0)");
  this.line = this.svg.append("line")
                      .attr("x1", x_offset)
                      .attr("x2", x_offset)
                      .attr("y1", bar_height)
                      .style("stroke-width",2)
                      .style("stroke", "black");

  this.classes = classes;
  this.xscale = d3.scale.linear()
          .domain([0,1])
          .range([0, width - right_x_offset]);
  this.bar_height = bar_height;
  this.x_offset = x_offset;
}
FeatureContributions.prototype.UpdateBars = function(exp, max) {
  if (this.normalize) {
    // total = _.sum(_.map(exp, function(x) { return Math.abs(x[1]);}))
    total = max;
    var data = _.map(exp, function(x) {
      a = x.slice()
      a[1] = a[1] / total;
      return a;});
  }
  else {
    var data = exp;
  }
  var total_height = (this.bar_height + 10) * data.length;
  var yscale = d3.scale.linear()
          .domain([0, data.length])
          .range([0,total_height]);
  this.svg.attr('height', total_height + 10);
  this.line.attr("y2", Math.max(this.bar_height, total_height - 10 + this.bar_height));

  var this_object = this;
  var labels = this.svg.selectAll(".labels").data(data)
  labels.enter().append('text')
  labels.attr('x', this.x_offset - 2)
        .attr('y', function(d, i) { return yscale(i) + this_object.bar_height + 14})
        .attr('text-anchor', 'end')
        .style("fill", "black")
        .classed("labels", true)
        .text(function(d) {return d[0];});
  if (this.clickable_words) {
    labels.style('fill', function(d) {return clicked_words.has(d[0]) ? 'red' : 'black';})
          .style('text-decoration', function(d) {return clicked_words.has(d[0])? 'line-through' : 'none';})
          .on('click', function(d) {
            ToggleClicked(d[0]);
            d3.select(this).style('fill', clicked_words.has(d[0]) ? 'red' : 'black');
            d3.select(this).style('text-decoration', clicked_words.has(d[0])? 'line-through' : 'none');
          });
  }
  labels.exit().remove();
  var bars = this.bars.selectAll('rect').data(data)
  bars.enter().append('rect')
  bars.attr('height',this.bar_height)
      .attr({'x':0,'y':function(d,i){ return yscale(i)+ this_object.bar_height; }})
      .style("fill", function(d) { return this_object.classes.colors_i(+(d[1] > 0)); })
      .attr('width',function(d){ return this_object.xscale(Math.abs(d[1])); })
  bars.exit().attr('width', 0).remove();

  if (this.normalize) {
    return;
  }
  var bartext = this.bars.selectAll("text").data(data)
  bartext.enter()
         .append('text');
  bartext.attr('x', function(d) {return this_object.xscale(Math.abs(d[1])) + 5; })
         .attr('y', function(d,i){ return yscale(i)+35; })
         .text(function (d) {return Math.abs(d[1]).toFixed(2);});
  bartext.exit().remove();
}
