import paint from './paint';
import './stylesheet.css';

if (!window._babelPolyfill) { //eslint-disable-line no-underscore-dangle
  require('@babel/polyfill');
}

//----------individual accordion labels-------------
//Dimension
var dimLabel = {
  ref: 'props.section1.dimLabel',
  label: 'Dimension Label',
  type: 'string',
  expression: 'optional'
};

var showDimSubTitles = {
  ref: 'props.section1.showDimSubTitles',
  label: 'Display Label',
  type: 'boolean',
  defaultValue: false
};
var dimWidth = {
  ref: 'props.section1.dimWidth',
  label: 'Change space for dimension text',
  type: 'number',
  defaultValue: 60,
  min: 10,
  max: 200,
  component: 'slider'
};
//Measure configuration
var barSize = {
  ref: 'props.section2.barSize',
  label: 'Change size of bar',
  type: 'number',
  defaultValue: 33,
  min: 10,
  max: 100,
  component: 'slider'
};
var barNum = {
  ref: 'props.section2.barNum',
  label: 'Quantity of bars showed(max. 20)',
  type: 'integer',
  defaultValue: 4,
  min: 1,
  max: 20,
  change : ({ props: { section2 } })=>{
    if(section2.barNum > 20){
      section2.barNum = 20;
    }
    if(section2.barNum < 1){
      section2.barNum = 1;
    }
  }
};
var barColor = {
  ref: 'props.section2.barColor',
  label: 'Change bar color',
  type: 'object',
  defaultValue: {
    color: '#4682B4',
    index: 0
  },
  component: 'color-picker',
  dualOutput: true
};
//Marker configuration
var markerColor = {
  ref: 'props.section3.markerColor',
  label: 'Change marker color',
  type: 'object',
  defaultValue: {
    color: '#000000'
  },
  component: 'color-picker',
  dualOutput: true
};
//Range configuration
var rangeColor = {
  ref: 'props.section4.rangeColor',
  label: 'Change range color',
  type: 'object',
  defaultValue: {
    color: '#D3D3D3'
  },
  component: 'color-picker',
  dualOutput: true
};
var lowerThreshRange = {
  ref: 'props.section4.lowerThreshRange',
  label: 'Set lower range (%)',
  type: 'number',
  defaultValue: 50,
  min: 0,
  max: 100,
  change: ({ props: { section4 } }) => {
    if(section4.lowerThreshRange > section4.middleThreshRange){
      if(section4.middleThreshRange === 0){
        section4.middleThreshRange = 1;
      }
      section4.lowerThreshRange = section4.middleThreshRange - 1;
    }
    if(section4.lowerThreshRange < 0 ){
      section4.lowerThreshRange = 0;
    }
    if(section4.lowerThreshRange > 100){
      section4.lowerThreshRange = 100;
    }
  }
};
var middleThreshRange = {
  ref: 'props.section4.middleThreshRange',
  type: 'number' ,
  label: 'Set middle range (%)',
  defaultValue: 75,
  min: 0,
  max: 100,
  change: ({ props: { section4 } }) => {
    if(section4.middleThreshRange < section4.lowerThreshRange){
      if(section4.lowerThreshRange === 100){
        section4.lowerThreshRange = 99;
      }
      section4.middleThreshRange = section4.lowerThreshRange + 1;
    }
    if(section4.middleThreshRange < 0){
      section4.middleThreshRange = 0;
    }
    if(section4.middleThreshRange > 100){
      section4.middleThreshRange = 100;
    }
  }
};
//Axis configuration
var uniformAxisBool = {
  ref: 'props.section5.uniformAxisBool',
  label: 'Consistent for all axis dimension values',
  type: 'boolean',
  defaultValue: true
};

export default {
  definition: {
    type: 'items',
    component: 'accordion',
    items: {
      data:{
        uses: 'data',
        items:{
          dimensions:{
            disabledRef: ''
          },
          measures: {
            disabledRef: ''
          }
        }
      },
      sorting: {
        uses: 'sorting'
      },
      appearance: {
        uses: 'settings',
        items: {
          header1: {
            type: 'items',
            label: 'Dimension',
            items: {
              dimensionLabel: dimLabel,
              dimensionTitleBtn: showDimSubTitles,
              dimWidth: dimWidth
            }
          },
          header2: {
            type: 'items',
            label: 'Measure Bar',
            items: {
              barSize: barSize,
              barNum: barNum,
              barColor: barColor
            }
          },
          header3: {
            type: 'items',
            label: 'Marker',
            items: {
              markerColor: markerColor
            }
          },
          header4: {
            type: 'items',
            label: 'Range',
            items: {
              rangeColor: rangeColor,
              middleThreshRange: middleThreshRange,
              lowerThreshRange: lowerThreshRange
            }
          },
          header5: {
            type: 'items',
            label: 'Axis',
            items: {
              uniformAxisBool: uniformAxisBool
            }
          }
        }
      },
      about: {
        component: 'items',
        label: 'About',
        items: {
          header: {
            label: 'Bullet chart',
            style: 'header',
            component: 'text'
          },
          paragraph1: {
            label: `Bullet chart is Qlik Sense chart which allows the user to visualize up to three measures across one or no dimensions.`,
            component: 'text'
          },
          paragraph2: {
            label: 'Bullet chart is based upon an extension created by Kevin McGovern.',
            component: 'text'
          }
        }
      }
    },
  },  
  initialProperties: {
    qHyperCubeDef: {
      qDimensions: [],
      qMeasures: [],
      qInitialDataFetch: [
        {
          qWidth: 10,
          qHeight: 100
        }
      ]
    }
  },
  data : {
    dimensions: {
      min: 0,
      max: 1
    },
    measures: {
      min: 1,
      max: 3
    }
  },
  support: {
    snapshot: true,
    export: true,
    exportData: true
  },
  paint: function ($element, layout) {
    let component = this;
    try {
      paint($element, layout, component);
    }
    catch (e) {
      console.error(e); // eslint-disable-line no-console
      throw e;
    }
  },
};
