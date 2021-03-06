import * as d3 from 'd3';
import $ from 'jquery';
import bullet from './vendor/bullet';

//Function to convert hex value to rgb array
function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

//Function to take hypercube data and turn it into d3 readable array
function createDataArray(hypercubeData, layout) {

  //get dimension label if it exists, if not create an empty string
  if (layout.props.section1.dimLabel) {
    var dimLabel = layout.props.section1.dimLabel;
  }
  else {
    var dimLabel = '';
  }
  //create variables from layout settings
  var propShowDimSubTitles = layout.props.section1.showDimSubTitles,
    propMeasureBarSize = layout.props.section2.barSize,
    propMiddleRangeThresh = Number(layout.props.section4.middleThreshRange),
    propLowerRangeThresh = Number(layout.props.section4.lowerThreshRange),
    propUniformAxis = layout.props.section5.uniformAxisBool;


  //final array creation, create variables for testing and data manipulation as well
  var dataObject = [],
    numMeasures = hypercubeData.qMeasureInfo.length,
    numDims = hypercubeData.qDimensionInfo.length,
    dataPages = hypercubeData.qDataPages[0].qMatrix;
  var rangeMax = 0;

  //loop through all rows in data cube
  for (var row = 0; row < dataPages.length; row++) {
    //use dimensions if one was created
    if (numDims !== 0) {
      dataObject.push({ 'title': dataPages[row][0].qText });

      //check for subtitles in the menu text box
      if (propShowDimSubTitles == true) {
        dataObject[row]['subtitle'] = dimLabel;
      }
    }
    //if no dimensions were added, use the title listed
    else {
      dataObject.push({ 'title': dimLabel });
    }

    //check number of dimensions and build object based on the expressions available
    //use numDims to account for when chart does not have dimensions
    var value = dataPages[row][numDims].qNum;
    dataObject[row]['measures'] = [isNaN(value) ? 0 : value];
    if (numMeasures == 1) {
      dataObject[row]['markers'] = [0];
      dataObject[row]['ranges'] = [0, 0, 0];
    } else if (numMeasures == 2) {
      value = dataPages[row][numDims + 1].qNum;
      dataObject[row]['markers'] = [isNaN(value) ? 0 : value];
      dataObject[row]['ranges'] = [0, 0, 0];
    } else if (numMeasures == 3) {
      value = dataPages[row][numDims + 1].qNum;
      dataObject[row]['markers'] = [isNaN(value) ? 0 : value];
      value = dataPages[row][numDims + 2].qNum;
      value = isNaN(value) ? 0 : value;
      dataObject[row]['ranges'] =
        [value, value * propMiddleRangeThresh / 100, value * propLowerRangeThresh / 100];
    }
    //create the measure bar height as an additional data measure, this is driven from properties
    dataObject[row]['measureBarHeight'] = [propMeasureBarSize];

    //set range max to zero if the configuration is set to not create a single axis for all dimensions
    if (propUniformAxis == true) {
      //Find the biggest number in the current array and compare it to
      rangeMax = Math.max(
        rangeMax,
        dataObject[row]['measures'],
        dataObject[row]['markers'],
        dataObject[row]['ranges'][0]);
    }
  }

  //Find the common number format (if any)
  var tickFormatType = null;
  var tickFormatStr = null;
  for (var i = 0; i < numMeasures; i++) {
    if (tickFormatType == null) {
      tickFormatType = hypercubeData.qMeasureInfo[i].qNumFormat.qType;
      tickFormatStr = hypercubeData.qMeasureInfo[i].qNumFormat.qFmt;
    } else if (hypercubeData.qMeasureInfo[i].qNumFormat.qType
      && tickFormatType !== hypercubeData.qMeasureInfo[i].qNumFormat.qType) {

      // Got a new format that is different from previous
      tickFormatType = null;
      tickFormatStr = null;
      break;
    }
  }

  var decCount = 0;
  var extChar = '';
  var timeFormat = '';
  switch (tickFormatType) {
    case 'F':
      if (tickFormatStr.indexOf('%') != -1) {
        extChar = '%';
      }
    case 'M':
    case 'R':
      var decimalMatch = /\.[\d|#]+/.exec(tickFormatStr);
      if (decimalMatch) {
        decCount = decimalMatch[0].length - 1;
      }
      break;
    case 'D':
      timeFormat = tickFormatStr;
      timeFormat = timeFormat.replace(/YYYY/g, '%Y');
      timeFormat = timeFormat.replace(/MMMM/g, '%B');
      timeFormat = timeFormat.replace(/MMM/g, '%b');
      timeFormat = timeFormat.replace(/M{1,2}/g, '%m');
      timeFormat = timeFormat.replace(/D{1,2}/gi, '%d');
      timeFormat = timeFormat.replace(/hh/g, '%H');
      timeFormat = timeFormat.replace(/h/g, '%I');

      // Replace 'm' but not '%m'. Look-behind not supported by all browsers so do it manually
      var match;
      var minRegex = /m{1,2}/g;
      do {
        match = minRegex.exec(timeFormat);
        if (match && (match.index == 0 || timeFormat[match.index - 1] !== '%')) {
          timeFormat = timeFormat.substr(0, match.index) + '%M'
            + timeFormat.substr(match.index + match[0].length);
        }
      } while (match);

      timeFormat = timeFormat.replace(/s{1,2}/g, '%S');
      timeFormat = timeFormat.replace(/\[\.fff\]/gi, ''); // No good replacement for brackets
      timeFormat = timeFormat.replace(/TT/g, '%p');
      break;
    case 'IV':
      timeFormat = tickFormatStr;
      break;
  }

  //Loop through array again to bind some values
  for (var row = 0; row < dataPages.length; row++) {
    dataObject[row]['rangeMax'] = [rangeMax];
    dataObject[row]['tickFormat'] = [{
      'type': tickFormatType,
      'decCount': decCount,
      'extChar': extChar,
      'timeFormat': timeFormat
    }];
  }

  return dataObject;
}

export default function paint($element, layout, component) {

  //set hypercube variable and call function on hcData to return data in a json format
  var hc = layout.qHyperCube,
    hcData = createDataArray(hc, layout);

  //create variables for number of bars allowed and the size of the dimension area for text
  var dimWidth = Number(layout.props.section1.dimWidth),
    barsNum = layout.props.section2.barNum;


  // Create margin - should be replaced by dynamic numbers when this is eventually a responsive viz
  var margin = { top: 5, right: 20, bottom: 25, left: dimWidth };

  // Set chart object width
  var width = $element.width() - margin.left - margin.right;

  // Set chart object height
  if(barsNum > hcData.length){
    barsNum = hcData.length;
  }
  var height =Math.abs($element.height() / barsNum - margin.top - margin.bottom - 1);

  // Chart object id
  var id = 'container_' + layout.qInfo.qId;

  // Check to see if the chart element has already been created
  if (document.getElementById(id)) {
    // if it has been created, empty it's contents so we can redraw it
    $('#' + id).empty();
  } else {
    // if it hasn't been created, create it with the appropiate id and size
    $element.append($('<div />').attr('id', id).attr('class', 'divbullet' ).height('100%'));
  }
  d3.select(`#${id}`).classed({ 'edit_mode' : component._inEditState });
  var chart = bullet()
    .width(width)
    .height(height);

  var svg = d3.select('#' + id).selectAll('svg')
    .data(hcData)
    .enter().append('svg')
    .attr('class', 'bullet')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom - 2)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  //create labels for each bullet
  var title = svg.append('g')
    .style('text-anchor', 'start')
    .attr('transform', `translate(-${margin.left}, ${height / 2})`);
  title.append('text')
    .attr('class', 'title')
    .attr('clip-path', 'url(#titleClip)')
    .text(function (d) {
      if(d.title === undefined) return 'undefined';
      return d.title; });

  var titleClip = title.append('clipPath')
    .attr('id','titleClip' )
    .attr('transform', 'translate(0,-20)');

  titleClip.append('rect')
    .attr('id', 'titleRect')
    .attr('width', margin.left - 5 +'px')
    .attr('height', '25px');

  var subtitle = svg.append('g')
    .style('text-anchor', 'start')
    .attr('transform', `translate(-${margin.left},` +( (height / 2) + 5) +')');

  subtitle.append('text')
    .attr('class', 'subtitle')
    .attr('dy', '1em')
    .attr('clip-path', 'url(#clipText)')
    .text(function (d) { return d.subtitle; });

  var clip = subtitle.append('clipPath')
    .attr('id','clipText' );

  clip.append('rect')
    .attr('id', 'subRect')
    .attr('width', margin.left - 5 +'px')
    .attr('height', '25px');
  svg.call(chart);
  // Colors (with fallbacks to previous properties)
  const { props: { section2, section3, section4 } } = layout;
  const barColor = section2.barColor.color || section2.barColor;
  const markerColor = section3.markerColor.color || section3.markerColor;
  const rangeColor = section4.rangeColor.color || section4.rangeColor;

  //fill the bullet with the color specified in the menu
  $('#' + id + ' rect.measure').attr('fill', barColor);

  //color the marker with the color specified in the menu
  $('#' + id + ' line.marker').attr('stroke', markerColor);

  //convert hex to rgb as first step of gradient creation
  var rangeRGB = hexToRgb(rangeColor);
  const middleRangeThreshold = 0.7;
  const lowerRangeThreshold = 0.85;
  //bind the colors to the ranges on the chart
  $('#' + id + ' rect.range.s2').attr('fill', 'rgb(' + Math.floor(rangeRGB.r * middleRangeThreshold) + ', ' + Math.floor(rangeRGB.g * middleRangeThreshold) + ', ' + Math.floor(rangeRGB.b * middleRangeThreshold) + ')');
  $('#' + id + ' rect.range.s1').attr('fill', 'rgb(' + Math.floor(rangeRGB.r * lowerRangeThreshold) + ', ' + Math.floor(rangeRGB.g * lowerRangeThreshold) + ', ' + Math.floor(rangeRGB.b * lowerRangeThreshold) + ')');
  $('#' + id + ' rect.range.s0').attr('fill', 'rgb(' + rangeRGB.r + ', ' + rangeRGB.g + ', ' + rangeRGB.b + ')');
  d3.select(`#${id}`).append('div')
    .attr('class', 'tooltip')
    .style('opacity', '0')
    .append('p')
    .attr('class', 'ttvalue');
  d3.selectAll('rect')
    .on('mouseenter', function(d){
      if(component._inEditState) return;
      var event = d3.event;
      var x = event.pageX;
      var y = event.pageY;
      var container = this.parentNode.parentNode.parentNode; // d3.select('#' + id) always gives back the first object's element container, so when a user hover on a 2nd or 3rd or.. bar, its tooltip won't be rendered but the first object tooltip will ,,, DUE to the id not being updated

      d3.select(container)
        .select('.ttvalue')
        .text(d);
      d3.select(container)
        .select('.tooltip')
        .style('left', x + 10 + 'px')
        .style('top', y - 35 + 'px')
        .transition()
        .delay(750)
        .style('opacity', '0.95')
      ;
    })
    .on('mouseleave',function(){
      d3.selectAll('.tooltip')
        .style('opacity', '0')
        .transition()
      ;
    });
}
