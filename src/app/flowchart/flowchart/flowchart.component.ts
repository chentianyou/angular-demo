import { Component, OnInit, Input, ElementRef, AfterViewInit, ViewChild, Output, EventEmitter, HostListener } from '@angular/core';
import { FlowchartController } from "./flowchart.controller";
import { Toolkit } from "../Toolkit";
import { FlowchartService, FCService } from '../flowchart.service';
import { NodeViewModel } from './entitis/node';
import { ConnectionViewModel } from './entitis/connection';
import { FlowchartNode, FlowchartSetting } from './entitis/graph';
import * as d3 from 'd3';
declare var $: any;

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
    connectorSize: 5,
    arrowSize: 5,
    minimapScale: 0.4,
  };

  @Input()
  data: { nodes: FlowchartNode[], connections: any[] };

  @Output()
  onDrop: EventEmitter<any> = new EventEmitter();

  // node event
  @Output()
  onNodeDoubleClick: EventEmitter<any> = new EventEmitter(); //
  @Output()
  onNodeSelected: EventEmitter<any> = new EventEmitter(); //
  @Output()
  onDeleted: EventEmitter<any> = new EventEmitter(); //
  @Output()
  onNodeClicked: EventEmitter<any> = new EventEmitter(); //
  @Output()
  onAddNode: EventEmitter<any> = new EventEmitter(); //

  // connnection event
  @Output()
  onAddConnection: EventEmitter<any> = new EventEmitter();
  @Output()
  onConnectionSelected: EventEmitter<any> = new EventEmitter();

  @ViewChild('svg_ele') svg;
  @ViewChild('minimap') minimap;

  element = null;
  minimapEle = null;

  constructor(
    ele: ElementRef,
    service: FlowchartService,
  ) {
    this.service = service;
    this.controller = new FlowchartController(this, ele.nativeElement, this.service, this.setting);
    this.data = {
      nodes: [],
      connections: [],
    }
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
    this.minimapEle = $(this.minimap.nativeElement);
    this.controller.registerMiniMapEle(this.minimapEle);
  }

  // event functions
  dragOver(evt: DragEvent) {
    evt.preventDefault();
  }



  // Disable contexmenu
  contextmenu(evt) {
    return false;
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(evt: KeyboardEvent) {
    switch (evt.keyCode) {
      case 8: //backspace
      case 46: //delete
        this.deleteSelected();
        break;
    }
  }
  // end event functions

  createNodesViewModel(nodesDataModel) {
    let nodesViewModel = [];
    if (nodesDataModel) {
      for (let i = 0; i < nodesDataModel.length; ++i) {
        let node = new NodeViewModel(nodesDataModel[i], this.setting, this.service);
        node.selectedHandler = (data) => { this.onNodeSelected.emit(data) };
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
    let connection = new ConnectionViewModel(connectionDataModel, sourceConnector, destConnector, this.service, this.setting);
    connection.selectedHandler = (data) => { this.onConnectionSelected.emit(data); };
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

    let connectionViewModel = new ConnectionViewModel(connectionDataModel, outputConnector, inputConnector, this.service, this.setting);
    connectionViewModel.selectedHandler = (data) => { this.onConnectionSelected.emit(data); };
    this.service.addObject(connectionViewModel.id, connectionViewModel);
    connectionsViewModel.push(connectionViewModel);
    inputConnector.used = true;
    outputConnector.used = true;
    this.onAddConnection.emit(connectionViewModel.data);
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
    let node = new NodeViewModel(nodeDataModel, this.setting, this.service);
    node.selectedHandler = (data) => { this.onNodeSelected.emit(data) };
    this.service.addObject(node.id, node);
    this.nodes.push(node);
    this.onAddNode.emit(node.data);
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
  handleNodeClicked(node: NodeViewModel, evt) {
    if (evt.ctrlKey) {
      node.toggleSelected();
    }
    else if (!node.selected()) {
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
    this.onNodeClicked.emit({ data: node.data, originEvent: evt });
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

    let deletedNodeUIds = [];
    let deleteConnectionUIds = [];

    let deletedNodes = [];
    let deletedConnections = [];
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
        deletedNodeUIds.push(node.id);
        deletedNodes.push(node);
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
      } else {
        deleteConnectionUIds.push(connection.id);
        deletedConnections.push(connection);
      }
    }

    let event = {
      checked: true,
      nodes: deletedNodes,
      connections: deletedConnections
    }
    this.onDeleted.emit(event);
    if (!event.checked) {
      return
    }


    // Delete node and connections in flowchart service
    for (let id in deletedNodeUIds) {
      this.service.delObject(id);
    }
    for (let id in deleteConnectionUIds) {
      this.service.delObject(id);
    }

    //
    // Update nodes and connections.
    //
    this.nodes = newNodeViewModels;
    this.data.nodes = newNodeDataModels;
    this.connections = newConnectionViewModels;
    this.data.connections = newConnectionDataModels;

    // Set connector to unused
    for (let connection of deletedConnections) {
      connection.source.used = false;
      connection.dest.used = false;
    }
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

