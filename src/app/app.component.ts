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
      "name": "Example Node 1",
      "id": 0,
      "x": -34,
      "y": 256,
      "width": 350,
      "height": 100,
      "inputConnectors": [
        {
          "name": "A"
        },
        {
          "name": "B"
        },
        {
          "name": "C"
        }
      ],
      "outputConnectors": [
        {
          "name": "A"
        },
        {
          "name": "B"
        },
        {
          "name": "C"
        }
      ]
    },
    {
      "name": "Example Node 2",
      "id": 1,
      "x": 287,
      "y": 119,
      "inputConnectors": [
        {
          "name": "A"
        },
        {
          "name": "B"
        },
        {
          "name": "C"
        }
      ],
      "outputConnectors": [
        {
          "name": "A"
        },
        {
          "name": "B"
        },
        {
          "name": "C"
        }
      ],
      "width": 250,
      "height": 100
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

  startDrag(evt) {
    console.log(evt);
  }

}
