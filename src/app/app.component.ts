import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'angular-demo';

  graph: any;

  nodes = [
    {
      "name": "数据源",
      "id": 0,
      "x": -34,
      "y": 256,
      "width": 240,
      "height": 50,
      "inputConnectors": [],
      "outputConnectors": [
        {
          "name": "数据输出",
          "type": "A"
        },
      ],
      "icon": "icon-liujisuan"
    },
    {
      "name": "决策树模型",
      "id": 1,
      "x": 287,
      "y": 119,
      "icon": "icon-cube",
      "inputConnectors": [
        {
          "name": "训练数据输入",
          "type": "A"
        },
        {
          "name": "预测数据输入",
          "type": "A"
        }
      ],
      "outputConnectors": [
        {
          "name": "模型输出",
          "type": "B"
        },
      ],
      "width": 240,
      "height": 50,
    }
  ]

  constructor() {
    this.graph = {
      "nodes": [],
      "connections": []
    }
  }

  ngOnInit() {

  }


  ngAfterViewInit() {
  //   let _config = ({
  //     margin: 20,
  //     _width: 1000,
  //     _height: 1000,
  //     viewWidth: 300,
  //   })

  //   let config = ({
  //     ..._config,
  //     clippedWidth: _config._width - _config.margin * 2,
  //     clippedHeight: _config._height - _config.margin * 2,
  //     minimapScale: _config.viewWidth / _config._width,
  //     viewHeight: _config._height * (_config.viewWidth / _config._width)
  //   })

  //   let minimapScaleX = zoomScale =>
  //     d3.scaleLinear().domain([0, config._width]).range([0, config._width * zoomScale]);
  //   let minimapScaleY = zoomScale =>
  //     d3.scaleLinear().domain([0, config._height]).range([0, config._height * zoomScale]);


  //   let div = d3.select("#svg-canvas");
  //   let svgChart = div.append("svg")
  //     .attr('width', config.viewWidth)
  //     .attr('heigth', config.viewHeight);

  //   let gCam = svgChart.append('g');

  //   let stageChart = gCam.append('g')
  //     .attr('transform', this.trans(config.margin, config.margin, null));


  //   let svgMinimap = div.append('svg')
  //     .attr('width', minimapScaleX(config.minimapScale)(config._width))
  //     .attr('height', minimapScaleY(config.minimapScale)(config._height))
  //     .attr('viewBox', [0, 0, config._width, config._height].join(' '))
  //     .attr('preserveAspectRatio', 'xMidYMid meet');

  //   svgChart.append('g').attr('transform', this.trans(config.margin, config.margin, null));
  //   svgMinimap
  //     .append('rect')
  //     .attr('width', config._width)
  //     .attr('height', config._height)
  //     .attr('fill', 'pink');

  //   const stageMinimap = svgMinimap
  //     .append('g')
  //     .attr('transform', this.trans(config.margin, config.margin, null));
  //   // WARNING: *world size* should be larger than or equal to *viewport size*
  //   // if the world is smaller than viewport, the zoom action will yield weird coordinates.
  //   const worldWidth =
  //     config._width > config.viewWidth ? config._width : config.viewWidth;
  //   const worldHeight =
  //     config._height > config.viewHeight ? config._height : config.viewHeight;
  //   const zoom = d3
  //     .zoom()
  //     .scaleExtent([.2, 1]) // smaller front, larger latter
  //     .translateExtent([[0, 0], [worldWidth, worldHeight]]) // world extent
  //     .extent([[0, 0], [config.viewWidth, config.viewHeight]]) // viewport extent
  //     .on('zoom', (evt: any) => {
  //       if (evt.sourceEvent && evt.sourceEvent.type === "brush")
  //         return null;
  //       const t = evt.transform;
  //       console.log('onZoom', evt);
  //       gCam.attr('transform', this.trans(t.x, t.y, t.k));
  //       //prevent brush invoked event

  //       console.log(t.x, t.y);
  //       const scaleX = minimapScaleX(t.k);
  //       const scaleY = minimapScaleY(t.k);
  //       brush.move(gBrush, [
  //         [scaleX.invert(-t.x), scaleY.invert(-t.y)],
  //         [
  //           scaleX.invert(-t.x + config.viewWidth),
  //           scaleY.invert(-t.y + config.viewHeight)
  //         ]
  //       ]);
  //     });

  //   const gBrush = svgMinimap.append('g');
  //   const brush = d3
  //     .brush()
  //     .extent([[0, 0], [config._width, config._height]])
  //     .on('brush', (evt: any) => {
  //       console.log(evt);

  //       // prevent zoom invoked event
  //       if (evt.sourceEvent && evt.sourceEvent.type === "zoom")
  //         return null;
  //       if (Array.isArray(evt.selection)) {
  //         const [[brushX, brushY], [brushX2, brushY2]] = evt.selection;
  //         const zoomScale = d3.zoomTransform(svgChart.node()).k;
  //         console.log('brush', {
  //           brushX,
  //           brushY,
  //           zoomScale
  //         });

  //         const scaleX = minimapScaleX(zoomScale);
  //         const scaleY = minimapScaleY(zoomScale);

  //         svgChart.call(
  //           zoom.transform,
  //           d3.zoomIdentity.translate(-brushX, -brushY).scale(zoomScale)
  //         );
  //         console.log('zoom object');
  //         gCam.attr('transform', this.trans(scaleX(-brushX), scaleY(-brushY), zoomScale));
  //       }
  //     });

  //   let getDatum = () =>
  //     Array.from({ length: 10 }).map(() => Math.random() * 10);

  //   let data = Array.from({ length: 10 }).map(getDatum);
  //   console.log(data);

  //   let maxValueY = 9.976421948709994;
  //   maxValueY = d3.max(data, d => d3.max(d));

  //   let maxValueX = 9;
  //   maxValueX = d3.max(data, d => d.length - 1);

  //   let lineScaleX = d3
  //     .scaleLinear()
  //     .domain([0, maxValueX])
  //     .range([0, config.clippedWidth]);

  //   let lineScaleY = d3
  //     .scaleLinear()
  //     .domain([0, maxValueY])
  //     .range([0, config.clippedHeight]);

  //   let lineGen = d3
  //     .line()
  //     .x((d, i) => lineScaleX(i))
  //     .y((d, i) => lineScaleY(i))
  //     .curve(d3.curveBasis);

  //   let render = () => {
  //     stageChart
  //       .selectAll('path')
  //       .data(data)
  //       .join('path')
  //       .attr('d', lineGen);

  //     stageMinimap
  //       .selectAll('path')
  //       .data(data)
  //       .join('path')
  //       .attr('d', lineGen);

    
  //     svgMinimap.selectAll('.handle').remove();
  //     svgMinimap.selectAll('.overlay').remove();
  //   }
  //   render();
  }




  // trans(x, y, k) {
  //   const coord2d = `translate(${x}, ${y})`;
  //   if (!k) return coord2d;
  //   return coord2d + ` scale(${k})`;
  // }

  // ttrans(x, y, k) {
  //   return ['transform', this.trans(x, y, k)];
  // }

  nodeDbClick(event) {
    console.log(`node ${event.data.id} double click`);
  }

  nodeClick(event) {
    console.log(`node ${event.data.id} click`);

  }

  nodeSelected(event) {
    console.log(`node ${event.id} selected`);
  }

  nodeDeleted(event) {
    console.log(`node ${event.nodes} , connetions ${event.connections} will be delected`);
    // event.checked = false;
  }

  addNode(data) {
    console.log(data)
  }

  addConnection(data) {
    console.log(data)

  }

  connectionSelected(data) {
    console.log(data);
  }
}
