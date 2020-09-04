import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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
