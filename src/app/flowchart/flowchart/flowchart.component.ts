import { Component, OnInit, Input, ElementRef, AfterViewInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { FlowchartController } from "./flowchart.controller";
import { Toolkit } from "../Toolkit";
import { FlowchartService } from '../flowchart.service';
import { env } from 'process';
declare var $: any;

export interface FlowchartSetting {
  defaultNodeWidth?: number;
  nodeNameHeight?: number;
  connectorHeight?: number;
  connectorSize?: number;
}

interface FCService {
  service: FlowchartService
}

export interface FlowchartNode {
  name: string,
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  inputConnectors: FlowchartConnector[],
  outputConnectors: FlowchartConnector[],
  data: any,
}

export interface FlowchartConnector {
  name: string,
  type: string,
}

export interface FlowChartConnection {
  name: string,
  source: { nodeId: number, connectorIndex: number },
  dest: { nodeId: number, connectorIndex: number },
}

@Component({
  selector: 'app-flowchart',
  templateUrl: './flowchart.component.html',
  styleUrls: ['./flowchart.component.css']
})
export class FlowchartComponent implements OnInit, AfterViewInit, FCService {
  controller: FlowchartController;
  nodes: NodeViewModel[];
  connections: ConnectionViewModel[];
  service: FlowchartService;

  @Input()
  setting: FlowchartSetting = {
    defaultNodeWidth: 250,
    nodeNameHeight: 40,
    connectorHeight: 35,
    connectorSize: 10,
  };

  @Input()
  data: { nodes: FlowchartNode[], connections: any[] };

  @Output()
  onDragOver: EventEmitter<any> = new EventEmitter();

  @Output()
  onDrageEnd: EventEmitter<any> = new EventEmitter();

  @ViewChild('svg_ele') svg;
  element = null;

  constructor(
    ele: ElementRef,
    service: FlowchartService,
  ) {
    this.service = service;
    this.controller = new FlowchartController(this, ele.nativeElement, this.service, this.setting);
  }

  ngOnInit() {
    if (this.data) {
      this.nodes = this.createNodesViewModel(this.data.nodes);
      this.connections = this._createConnectionsViewModel(this.data.connections)
    }
  }

  ngAfterViewInit() {
    this.element = $(this.svg.nativeElement)
    this.controller.registerElement(this.element);
  }

  // event functions
  dragOver(evt: DragEvent) {
    evt.preventDefault();
  }

  drop(evt: DragEvent) {
    evt.preventDefault();
    let dataStr = evt.dataTransfer.getData("node");
    let offset = JSON.parse(evt.dataTransfer.getData("offset"));
    if (dataStr) {
      let data = JSON.parse(dataStr);

      data.id = this.data.nodes.length;
      let point = Toolkit.translateCoordinates(this.element, evt.pageX - offset.x, evt.pageY - offset.y, evt)
      data.x = point.x;
      data.y = point.y;
      console.log("drop ", data);
      this.addNode(data);
    }
  }
  // end event functions

  createNodesViewModel(nodesDataModel) {
    let nodesViewModel = [];
    if (nodesDataModel) {
      for (let i = 0; i < nodesDataModel.length; ++i) {
        let node = new NodeViewModel(nodesDataModel[i], this.setting, this.service);
        this.service.addObject(node.id, node);
        nodesViewModel.push(node);
      }
    }
    return nodesViewModel;
  };

  findNode(nodeID) {
    for (let i = 0; i < this.nodes.length; ++i) {
      let node = this.nodes[i];
      if (node.data.id == nodeID) {
        return node;
      }
    }
    throw new Error("Failed to find node " + nodeID);
  }

  findInputConnector(nodeID, connectorIndex) {
    let node = this.findNode(nodeID);
    if (!node.inputConnectors || node.inputConnectors.length <= connectorIndex) {
      throw new Error("Node " + nodeID + " has invalid input connectors.");
    }
    return node.inputConnectors[connectorIndex];
  }

  findOutputConnector(nodeID, connectorIndex) {

    let node = this.findNode(nodeID);

    if (!node.outputConnectors || node.outputConnectors.length <= connectorIndex) {
      throw new Error("Node " + nodeID + " has invalid output connectors.");
    }

    return node.outputConnectors[connectorIndex];
  };

  _createConnectionViewModel(connectionDataModel) {
    let sourceConnector = this.findOutputConnector(connectionDataModel.source.nodeID, connectionDataModel.source.connectorIndex);
    let destConnector = this.findInputConnector(connectionDataModel.dest.nodeID, connectionDataModel.dest.connectorIndex);
    let connection = new ConnectionViewModel(connectionDataModel, sourceConnector, destConnector, this.service);
    this.service.addObject(connection.id, connection);
    return connection;
  }

  _createConnectionsViewModel(connectionsDataModel) {

    let connectionsViewModel = [];

    if (connectionsDataModel) {
      for (let i = 0; i < connectionsDataModel.length; ++i) {
        connectionsViewModel.push(this._createConnectionViewModel(connectionsDataModel[i]));
      }
    }

    return connectionsViewModel;
  };

  createNewConnection(startConnector, endConnector) {

    let connectionsDataModel = this.data.connections;
    if (!connectionsDataModel) {
      connectionsDataModel = this.data.connections = [];
    }

    let connectionsViewModel = this.connections;
    if (!connectionsViewModel) {
      connectionsViewModel = this.connections = [];
    }

    let startNode = startConnector.parentNode();
    let startConnectorIndex = startNode.outputConnectors.indexOf(startConnector);
    let startConnectorType = 'output';
    if (startConnectorIndex == -1) {
      startConnectorIndex = startNode.inputConnectors.indexOf(startConnector);
      startConnectorType = 'input';
      if (startConnectorIndex == -1) {
        throw new Error("Failed to find source connector within either inputConnectors or outputConnectors of source node.");
      }
    }

    let endNode = endConnector.parentNode();
    let endConnectorIndex = endNode.inputConnectors.indexOf(endConnector);
    let endConnectorType = 'input';
    if (endConnectorIndex == -1) {
      endConnectorIndex = endNode.outputConnectors.indexOf(endConnector);
      endConnectorType = 'output';
      if (endConnectorIndex == -1) {
        throw new Error("Failed to find dest connector within inputConnectors or outputConnectors of dest node.");
      }
    }

    if (startConnectorType == endConnectorType) {
      throw new Error("Failed to create connection. Only output to input connections are allowed.")
    }

    if (startNode == endNode) {
      throw new Error("Failed to create connection. Cannot link a node with itself.")
    }

    let newStartNode = {
      nodeID: startNode.data.id,
      connectorIndex: startConnectorIndex,
    }

    let newEndNode = {
      nodeID: endNode.data.id,
      connectorIndex: endConnectorIndex,
    }

    let connectionDataModel = {
      source: startConnectorType == 'output' ? newStartNode : newEndNode,
      dest: startConnectorType == 'output' ? newEndNode : newStartNode,
    };
    connectionsDataModel.push(connectionDataModel);

    let outputConnector = startConnectorType == 'output' ? startConnector : endConnector;
    let inputConnector = startConnectorType == 'output' ? endConnector : startConnector;

    let connectionViewModel = new ConnectionViewModel(connectionDataModel, outputConnector, inputConnector, this.service);
    this.service.addObject(connectionViewModel.id, connectionViewModel);
    connectionsViewModel.push(connectionViewModel);
  };

  addNode(nodeDataModel) {
    if (!this.data.nodes) {
      this.data.nodes = [];
    }

    // 
    // Update the data model.
    //
    this.data.nodes.push(nodeDataModel);

    // 
    // Update the view model.
    //
    let node = new NodeViewModel(nodeDataModel, this.setting, this.service)
    this.service.addObject(node.id, node);
    this.nodes.push(node);
  }

  //
  // Select all nodes and connections in the chart.
  //
  selectAll() {
    let nodes = this.nodes;
    for (let i = 0; i < nodes.length; ++i) {
      let node = nodes[i];
      node.select();
    }

    let connections = this.connections;
    for (let i = 0; i < connections.length; ++i) {
      let connection = connections[i];
      connection.select();
    }
  }

  //
  // Deselect all nodes and connections in the chart.
  //
  deselectAll() {
    let nodes = this.nodes;
    if (nodes) {
      for (let i = 0; i < nodes.length; ++i) {
        let node = nodes[i];
        node.deselect();
      }

      let connections = this.connections;
      for (let i = 0; i < connections.length; ++i) {
        let connection = connections[i];
        connection.deselect();
      }
    }
  };

  //
  // Update the location of the node and its connectors.
  //
  updateSelectedNodesLocation(deltaX, deltaY) {
    let selectedNodes = this.getSelectedNodes();
    for (let i = 0; i < selectedNodes.length; ++i) {
      let node = selectedNodes[i];
      node.data.x += deltaX;
      node.data.y += deltaY;
    }
  };

  //
  // Handle mouse click on a particular node.
  //
  handleNodeClicked(node, ctrlKey) {

    if (ctrlKey) {
      node.toggleSelected();
    }
    else {
      this.deselectAll();
      node.select();
    }

    // Move node to the end of the list so it is rendered after all the other.
    // This is the way Z-order is done in SVG.

    let nodeIndex = this.nodes.indexOf(node);
    if (nodeIndex == -1) {
      throw new Error("Failed to find node in view model!");
    }
    this.nodes.splice(nodeIndex, 1);
    this.nodes.push(node);
  };

  //
  // Handle mouse down on a connection.
  //
  handleConnectionMouseDown(connection, ctrlKey) {

    if (ctrlKey) {
      connection.toggleSelected();
    }
    else {
      this.deselectAll();
      connection.select();
    }
  };

  //
  // Delete all nodes and connections that are selected.
  //
  deleteSelected() {

    let newNodeViewModels = [];
    let newNodeDataModels = [];

    let deletedNodeIds = [];

    //
    // Sort nodes into:
    //		nodes to keep and 
    //		nodes to delete.
    //

    for (let nodeIndex = 0; nodeIndex < this.nodes.length; ++nodeIndex) {

      let node = this.nodes[nodeIndex];
      if (!node.selected()) {
        // Only retain non-selected nodes.
        newNodeViewModels.push(node);
        newNodeDataModels.push(node.data);
      }
      else {
        // Keep track of nodes that were deleted, so their connections can also
        // be deleted.
        deletedNodeIds.push(node.data.id);
      }
    }

    let newConnectionViewModels = [];
    let newConnectionDataModels = [];

    //
    // Remove connections that are selected.
    // Also remove connections for nodes that have been deleted.
    //
    for (let connectionIndex = 0; connectionIndex < this.connections.length; ++connectionIndex) {

      let connection = this.connections[connectionIndex];
      if (!connection.selected() &&
        deletedNodeIds.indexOf(connection.data.source.nodeID) === -1 &&
        deletedNodeIds.indexOf(connection.data.dest.nodeID) === -1) {
        //
        // The nodes this connection is attached to, where not deleted,
        // so keep the connection.
        //
        newConnectionViewModels.push(connection);
        newConnectionDataModels.push(connection.data);
      }
    }

    //
    // Update nodes and connections.
    //
    this.nodes = newNodeViewModels;
    this.data.nodes = newNodeDataModels;
    this.connections = newConnectionViewModels;
    this.data.connections = newConnectionDataModels;
  };

  //
  // Select nodes and connections that intersect the selection rect.
  //
  applySelectionRect(selectionRect) {
    this.deselectAll();
    let s_left = selectionRect.x,
      s_right = selectionRect.x + selectionRect.width,
      s_top = selectionRect.y,
      s_bottom = selectionRect.y + selectionRect.height;

    if (this.nodes) {
      for (let i = 0; i < this.nodes.length; ++i) {
        let node = this.nodes[i];
        let n_left = node.x,
          n_right = node.x + node.width,
          n_top = node.y,
          n_bottom = node.y + node.height;
        if (s_left < n_right && n_left < s_right && s_top < n_bottom && n_top < s_bottom) {
          // Select nodes that are within the selection rect.
          node.select();
        }
      }
    }

    if (this.connections) {
      for (let i = 0; i < this.connections.length; ++i) {
        let connection = this.connections[i];
        if (connection.source.parentNode().selected() &&
          connection.dest.parentNode().selected()) {
          // Select the connection if both its parent nodes are selected.
          connection.select();
        }
      }
    }

  };

  //
  // Get the array of nodes that are currently selected.
  //
  getSelectedNodes() {
    let selectedNodes = [];

    for (let i = 0; i < this.nodes.length; ++i) {
      let node = this.nodes[i];
      if (node.selected()) {
        selectedNodes.push(node);
      }
    }

    return selectedNodes;
  };

  //
  // Get the array of connections that are currently selected.
  //
  getSelectedConnections() {
    let selectedConnections = [];

    for (let i = 0; i < this.connections.length; ++i) {
      let connection = this.connections[i];
      if (connection.selected()) {
        selectedConnections.push(connection);
      }
    }
    return selectedConnections;
  };

}

export class ConnectorViewModel implements FCService {
  id: string;
  data: any;
  _parentNode: any;
  _x: any;
  _y: any;
  service: FlowchartService;

  constructor(connectorDataModel, x, y, parentNode, service) {
    this.data = connectorDataModel;
    this._parentNode = parentNode;
    this._x = x;
    this._y = y;
    this.id = Toolkit.UID();
    this.service = service;
  }

  //
  // The name of the connector.
  //
  name() {
    return this.data.name;
  }

  //
  // X coordinate of the connector.
  //
  get x() {
    return this._x;
  };

  //
  // Y coordinate of the connector.
  //
  get y() {
    return this._y;
  };

  //
  // The parent node that the connector is attached to.
  //
  parentNode() {
    return this._parentNode;
  };
}

export class NodeViewModel implements FCService {
  id: string;
  setting: FlowchartSetting;
  data: any;
  inputConnectors: ConnectorViewModel[];
  outputConnectors: ConnectorViewModel[];
  _selected = false;
  service: FlowchartService;

  constructor(nodeDataModel, setting: FlowchartSetting, service: FlowchartService) {
    this.setting = setting;
    this.data = nodeDataModel;
    this.service = service;

    // set the default width value of the node
    if (!this.data.width || this.data.width < 0) {
      this.data.width = setting.defaultNodeWidth;
    }
    this.inputConnectors = this.createConnectorsViewModel(this.data.inputConnectors, 0, this);
    this.outputConnectors = this.createConnectorsViewModel(this.data.outputConnectors, this.data.height, this);

    this.relayoutConnector(this.inputConnectors);
    this.relayoutConnector(this.outputConnectors);
    // Set to true when the node is selected.
    this._selected = false;
    this.id = Toolkit.UID();
  }

  relayoutConnector(connectors: ConnectorViewModel[]) {
    let len = connectors.length;
    let m = (len - 1) / 2;
    for (let i = 0; i < len; i++) {
      let connector = connectors[i];
      connector._x = this.width / 2 + (i - m) * this.setting.connectorHeight;
    }
  }
  computeConnectorX(connectorIndex: number): number {
    return (connectorIndex * this.setting.connectorHeight);
  }

  createConnectorsViewModel(connectorDataModels, y, parentNode) {
    let viewModels = [];
    if (connectorDataModels) {
      for (let i = 0; i < connectorDataModels.length; ++i) {
        let connectorViewModel = new ConnectorViewModel(connectorDataModels[i], this.computeConnectorX(i), y, parentNode, this.service);
        this.service.addObject(connectorViewModel.id, connectorViewModel);
        viewModels.push(connectorViewModel);
      }
    }
    return viewModels;
  }

  //
  // Name of the node.
  //
  name() {
    return this.data.name || "";
  };

  //
  // X coordinate of the node.
  //
  get x() {
    return this.data.x;
  };

  //
  // Y coordinate of the node.
  //
  get y() {
    return this.data.y;
  };

  //
  // Width of the node.
  //
  get width() {
    return this.data.width;
  }

  //
  // Height of the node.
  //
  get height() {
    return this.data.height;
  }

  //
  // Select the node.
  //
  select() {
    this._selected = true;
  };

  //
  // Deselect the node.
  //
  deselect() {
    this._selected = false;
  };

  //
  // Toggle the selection state of the node.
  //
  toggleSelected() {
    this._selected = !this._selected;
  };

  //
  // Returns true if the node is selected.
  //
  selected() {
    return this._selected;
  };

  //
  // Internal function to add a connector.
  _addConnector(connectorDataModel, y, connectorsDataModel, connectorsViewModel) {
    let connectorViewModel =
      new ConnectorViewModel(connectorDataModel, 0,
        y, this, this.service);

    this.service.addObject(connectorViewModel.id, connectorViewModel)
    connectorsDataModel.push(connectorDataModel);

    // Add to node's view model.
    connectorsViewModel.push(connectorViewModel);
  }

  //
  // Add an input connector to the node.
  //
  addInputConnector(connectorDataModel) {

    if (!this.data.inputConnectors) {
      this.data.inputConnectors = [];
    }
    this._addConnector(connectorDataModel, 0, this.data.inputConnectors, this.inputConnectors);
  };

  //
  // Add an ouput connector to the node.
  //
  addOutputConnector(connectorDataModel) {

    if (!this.data.outputConnectors) {
      this.data.outputConnectors = [];
    }
    this._addConnector(connectorDataModel, this.data.height, this.data.outputConnectors, this.outputConnectors);
  };
}

export class ConnectionViewModel implements FCService {
  id: string;
  data: any;
  source: any;
  dest: any;
  _selected = false;
  service: FlowchartService;

  constructor(connectionDataModel, sourceConnector, destConnector, service: FlowchartService) {
    this.data = connectionDataModel;
    this.source = sourceConnector;
    this.dest = destConnector;
    // Set to true when the connection is selected.
    this._selected = false;
    this.id = Toolkit.UID();
    this.service = service;
  }

  name() {
    return this.data.name || "";
  }

  get path() {
    return `M ${this.sourceCoordX()},${this.sourceCoordY()}
      C ${this.sourceTangentX()}, ${this.sourceTangentY()}
      ${this.destTangentX()}, ${this.destTangentY()}
      ${this.destCoordX()}, ${this.destCoordY()}`
  }

  sourceCoordX() {
    return this.source.parentNode().x + this.source.x;
  };

  sourceCoordY() {
    return this.source.parentNode().y + this.source.y;
  };

  sourceCoord() {
    return {
      x: this.sourceCoordX(),
      y: this.sourceCoordY()
    };
  }

  sourceTangentX() {
    return Toolkit.computeConnectionSourceTangentX(this.sourceCoord(), this.destCoord());
  };

  sourceTangentY() {
    return Toolkit.computeConnectionSourceTangentY(this.sourceCoord(), this.destCoord());
  };




  destCoordX() {
    return this.dest.parentNode().x + this.dest.x;
  };

  destCoordY() {
    return this.dest.parentNode().y + this.dest.y;
  };

  destCoord() {
    return {
      x: this.destCoordX(),
      y: this.destCoordY()
    };
  }

  destTangentX() {
    return Toolkit.computeConnectionDestTangentX(this.sourceCoord(), this.destCoord());
  };

  destTangentY() {
    return Toolkit.computeConnectionDestTangentY(this.sourceCoord(), this.destCoord());
  };

  middleX(scale) {
    if (typeof (scale) == "undefined")
      scale = 0.5;
    return this.sourceCoordX() * (1 - scale) + this.destCoordX() * scale;
  };

  middleY(scale) {
    if (typeof (scale) == "undefined")
      scale = 0.5;
    return this.sourceCoordY() * (1 - scale) + this.destCoordY() * scale;
  };


  //
  // Select the connection.
  //
  select() {
    this._selected = true;
  };

  //
  // Deselect the connection.
  //
  deselect() {
    this._selected = false;
  };

  //
  // Toggle the selection state of the connection.
  //
  toggleSelected() {
    this._selected = !this._selected;
  };

  //
  // Returns true if the connection is selected.
  //
  selected() {
    return this._selected;
  };
}

