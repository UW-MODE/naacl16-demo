var Classes = function(class_names, max_class_name_length) {
  this.names = class_names;
  this.colors = d3.scale.category10().domain(this.names);
  this.colors_i = d3.scale.category10().domain(_.range(this.names.length));
  this.colors_i = function(i) {return i ==1 ? '#4dac26' : '#d01c8b';};
}
