function Intro() {
d3.selectAll('div').classed('hidden', false);
d3.selectAll('svg').classed('hidden', false);
d3.select('#intro').classed('hidden', true);
d3.selectAll('.form_stuff').classed('hidden', true);
current = 0;
ShowExample(0);
options = {"enableAnimation":false,
"showNavigation": true,
"delay": -1,
"tripIndex": 0,
"showCloseBox": true,
"tripTheme" : 'black'}
var trip = new Trip([
    {
      content: 'Ok, let me walk through what I\'m showing you here. <br />Press ESC at anytime to stop this introduction.<br />Feel free to use the -> and <- arrow keys on your keyboard.',
      position:'screen-center'
    },
    {
      sel: $('#current_example'), 
      content: 'I will show you a number of documents. Here you can see which document you are seeing.',
      position:'e'
    },
    {
      sel: $('#true_class_svg'),
      content: 'This shows you the true topic (Atheism or Christianity) of the document we\'re seeing.',
      position:'s'
    },
    {
      sel: $('#c1 .classifier_header'),
      content: 'Here on this side I will show information for Algorithm 1',
      position:'s'
    },
    {
      sel: $('#c2 .classifier_header'),
      content: 'While here is the information for Algorithm 2.',
      position:'s'
    },
    {
      sel: $('#c1 .pred'),
      content: 'Here I show you what this algorithm <br /> thinks this document is about',
      position:'w'
    },
    {
      sel: $('#explain1'),
      content: 'And here I show you which words <br /> were important in making that decision. <br />Note that the algorithm may be using good or bad words.',
      position:'e'
    },
    {
      sel: $('#explain1'),
      content: 'Each bar length indicates the importance of the word, <br /> while the color indicates if the word points to Christianity (green) or Atheism (pink)',
      position:'e'
    },
    {
      sel: $('.correct_mark'),
      content: 'Here I show you if this algorithm<br/ > predicted the right topic for this document.',
      position:'w'
    },
    {
      sel: $('.explain_text .title'),
      content: 'In here I show you the actual document. <br />The important words for this algorithm are colored and in bold.<br />Note that you can scroll up and down.',
      position:'n'
    },
    {
      sel: $('#c2 .classifier_header'),
      content: 'All of these are the same for Algorithm 2.',
      position:'s'
    },
    {
      sel: $('.btn:eq(3)'),
      content: 'You can navigate the different documents here.',
      position:'s',
    },
    {
      sel: $('.btn:eq(2)'),
      content: 'Let me take us all the way to the end.',
      position:'w',
      onTripEnd : function(tripIndex) {
        while (current != -1) {
          Next();
        }
      }
    },
    {
      sel: $('h1'),
      content: 'After the last document, we have this form for you to fill. <br /> Please take a look at all the documents before you do this.',
      position:'n'
    },
    {
      sel: $('h1'),
      content: 'This concludes our explanation. Let me take you back to the first document.<br /> Thanks!',
      position:'n',
      onTripEnd : function(tripIndex) {
        HideForm()
        current = 0;
        ShowExample(current);
      }
    },
   

], options); // details about options are listed below
trip.start();
}

