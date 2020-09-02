import { MouseCapture } from "./mouse.capture";
import { Dragging } from "./dragging";
import { FlowchartComponent } from "./flowchart.component";
import { Toolkit } from "../Toolkit";
import { FlowchartService } from "../flowchart.service";
import { ConnectorViewModel } from "./entitis/connector";
import { NodeViewModel } from "./entitis/node";
import { FlowchartSetting } from "./entitis/graph";
import { sp } from "@angular/core/src/render3";
declare var $: any;

export class FlowchartController {
    mouseCapture: MouseCapture;
    dragging: Dragging;
    model: FlowchartComponent;
    setting: FlowchartSetting;
    service: FlowchartService;
    element: any;
    dragSelectionStartPoint: any;
    dragSelectionRect: { x: number, y: number, width: number, height: number };
    mouseOverConnection = null;
    mouseOverConnector = null;
    mouseOverNode = null;

    connectionClass = 'connection';
    connectorClass = 'connector';
    nodeClass = 'node';

    draggingConnection = false;
    dragSelecting = false;
    document;

    dragPoint1 = null;
    dragPoint2 = null;
    dragTangent1 = null;
    dragTangent2 = null;
    timeStamp = 0;

    constructor(model: FlowchartComponent, element, service, setting) {
        this.mouseCapture = new MouseCapture();
        this.mouseCapture.registerElement(element);
        this.dragging = new Dragging(this.mouseCapture);
        this.model = model;
        this.element = $(element);
        this.document = document;
        this.setting = setting;
        this.service = service;
    }

    registerElement(element) {
        this.element = $(element);
        this.mouseCapture.registerElement(element);
    }

    hitTest(clientX, clientY) {

        //
        // Retreive the element the mouse is currently over.
        //
        return this.document.elementFromPoint(clientX, clientY);
    };

    hasClassSVG(obj, has) {
        var classes = obj.attr('class');
        if (!classes) {
            return false;
        }

        var index = classes.search(has);

        if (index == -1) {
            return false;
        }
        else {
            return true;
        }
    };

    searchUp(element, parentClass) {

        //
        // Reached the root.
        //
        if (element == null || element.length == 0) {
            return null;
        }

        // 
        // Check if the element has the class that identifies it as a connector.
        //
        if (this.hasClassSVG(element, parentClass)) {
            //
            // Found the connector element.
            //
            return element;
        }

        //
        // Recursively search parent elements.
        //
        return this.searchUp(element.parent(), parentClass);
    };

    checkForHit(mouseOverElement, whichClass) {

        //
        // Find the parent element, if any, that is a connector.
        //
        let hoverElement = this.searchUp(this.jQuery(mouseOverElement), whichClass);
        if (!hoverElement) {
            return null;
        }
        return hoverElement.data("index");
    };

    //
    // Wrap jQuery so it can easily be  mocked for testing.
    //
    jQuery(element) {
        return $(element);
    }

    mouseDown(evt) {

        this.model.deselectAll();
        this.dragging.startDrag(evt, {

            //
            // Commence dragging... setup variables to display the drag selection rect.
            //
            dragStarted: (x, y) => {
                this.dragSelecting = true;
                let startPoint = Toolkit.translateCoordinates(this.element, x, y, evt);
                this.dragSelectionStartPoint = startPoint;
                this.dragSelectionRect = {
                    x: startPoint.x,
                    y: startPoint.y,
                    width: 0,
                    height: 0,
                };
            },

            //
            // Update the drag selection rect while dragging continues.
            //
            dragging: (x, y) => {
                let startPoint = this.dragSelectionStartPoint;
                let curPoint = Toolkit.translateCoordinates(this.element, x, y, evt);

                this.dragSelectionRect = {
                    x: curPoint.x > startPoint.x ? startPoint.x : curPoint.x,
                    y: curPoint.y > startPoint.y ? startPoint.y : curPoint.y,
                    width: curPoint.x > startPoint.x ? curPoint.x - startPoint.x : startPoint.x - curPoint.x,
                    height: curPoint.y > startPoint.y ? curPoint.y - startPoint.y : startPoint.y - curPoint.y,
                };
            },

            //
            // Dragging has ended... select all that are within the drag selection rect.
            //
            dragEnded: () => {
                this.dragSelecting = false;
                this.model.applySelectionRect(this.dragSelectionRect);
                delete this.dragSelectionStartPoint;
                delete this.dragSelectionRect;
            },
        });

    }

    mouseMove(evt) {
        //
        // Clear out all cached mouse over elements.
        //
        this.mouseOverConnection = null;
        this.mouseOverConnector = null;
        this.mouseOverNode = null;

        let mouseOverElement = this.hitTest(evt.clientX, evt.clientY);
        if (mouseOverElement == null) {
            // Mouse isn't over anything, just clear all.
            return;
        }

        if (!this.draggingConnection) { // Only allow 'connection mouse over' when not dragging out a connection.

            // Figure out if the mouse is over a connection.
            let index = this.checkForHit(mouseOverElement, this.connectionClass);
            this.mouseOverConnection = index;
            if (this.mouseOverConnection) {
                // Don't attempt to mouse over anything else.
                return;
            }
        }

        // Figure out if the mouse is over a connector.
        let index = this.checkForHit(mouseOverElement, this.connectorClass);
        this.mouseOverConnector = index;
        if (this.mouseOverConnector) {
            // Don't attempt to mouse over anything else.
            return;
        }

        // Figure out if the mouse is over a node.
        index = this.checkForHit(mouseOverElement, this.nodeClass);
        this.mouseOverNode = index;
    }

    nodeMouseDown(evt, node) {
        let lastMouseCoords;
        this.dragging.startDrag(evt, {

            //
            // Node dragging has commenced.
            //
            dragStarted: (x, y) => {
                lastMouseCoords = Toolkit.translateCoordinates(this.element, x, y, evt);

                //
                // If nothing is selected when dragging starts, 
                // at least select the node we are dragging.
                //
                if (!node.selected()) {
                    this.model.deselectAll();
                    node.select();
                }
            },

            //
            // Dragging selected nodes... update their x,y coordinates.
            //
            dragging: (x, y) => {
                var curCoords = Toolkit.translateCoordinates(this.element, x, y, evt);
                var deltaX = curCoords.x - lastMouseCoords.x;
                var deltaY = curCoords.y - lastMouseCoords.y;

                this.model.updateSelectedNodesLocation(deltaX, deltaY);

                lastMouseCoords = curCoords;
            },

            //
            // The node wasn't dragged... it was clicked.
            //
            clicked: () => {
                if (this.timeStamp > 0) {
                    let span = evt.timeStamp - this.timeStamp;
                    if (span > 100 && span < 500) {
                        this.model.onNodeDoubleClick.emit({ data: node.data, originEvent: evt });
                        return;
                    }
                }
                this.timeStamp = evt.timeStamp;
                this.model.handleNodeClicked(node, evt);
            },

        });
    }

    connectorMouseDown(evt, node: NodeViewModel, connector: ConnectorViewModel, connectorIndex, isInputConnector) {

        //
        // Initiate dragging out of a connection.
        //
        this.dragging.startDrag(evt, {

            //
            // Called when the mouse has moved greater than the threshold distance
            // and dragging has commenced.
            //
            dragStarted: (x, y) => {
                var curCoords = Toolkit.translateCoordinates(this.element, x, y, evt);
                this.dragPoint1 = {
                    x: node.x + connector.x,
                    y: node.y + connector.y
                };
                this.dragPoint2 = {
                    x: curCoords.x,
                    y: curCoords.y
                };
                this.dragTangent1 = Toolkit.computeConnectionSourceTangent(this.dragPoint1, this.dragPoint2);
                this.dragTangent2 = Toolkit.computeConnectionDestTangent(this.dragPoint1, this.dragPoint2);
                this.draggingConnection = true;
            },

            //
            // Called on mousemove while dragging out a connection.
            //
            dragging: (x, y, evt) => {
                var startCoords = Toolkit.translateCoordinates(this.element, x, y, evt);
                this.dragPoint2 = {
                    x: startCoords.x,
                    y: startCoords.y
                };
                this.dragTangent1 = Toolkit.computeConnectionSourceTangent(this.dragPoint1, this.dragPoint2);
                this.dragTangent2 = Toolkit.computeConnectionDestTangent(this.dragPoint1, this.dragPoint2);
            },

            //
            // Clean up when dragging has finished.
            //
            dragEnded: () => {

                if (this.mouseOverConnector &&
                    this.mouseOverConnector !== connector.id) {

                    //
                    // Dragging has ended...
                    // The mouse is over a valid connector...
                    // Create a new connection.
                    //
                    let endConnector = this.service.getObject(this.mouseOverConnector);

                    this.model.createNewConnection(connector, endConnector);
                }

                this.draggingConnection = false;
                delete this.dragPoint1;
                delete this.dragTangent1;
                delete this.dragPoint2;
                delete this.dragTangent2;
            },

        });
    }

    connectionMouseDown(evt, connection) {

        this.model.handleConnectionMouseDown(connection, evt.ctrlKey);

        // Don't let the chart handle the mouse down.
        evt.stopPropagation();
        evt.preventDefault();
    }

    get draggingPath() {
        return `M ${this.dragPoint1.x}, ${this.dragPoint1.y}
       C ${this.dragTangent1.x}, ${this.dragTangent1.y}
         ${this.dragTangent2.x}, ${this.dragTangent2.y}
         ${this.dragPoint2.x}, ${this.dragPoint2.y}`
    }
}