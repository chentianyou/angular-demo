import { MouseCapture } from "./mouse.capture";
import { Dragging } from "./dragging";
import { FlowchartComponent } from "./flowchart.component";
import { Toolkit } from "../Toolkit";
import { FlowchartService } from "../flowchart.service";
import { ConnectorViewModel } from "./entitis/connector";
import { NodeViewModel } from "./entitis/node";
import { FlowchartSetting } from "./entitis/graph";
import * as d3 from 'd3';
declare let $: any;

export class FlowchartController {
    mouseCapture: MouseCapture;
    dragging: Dragging;
    model: FlowchartComponent;
    setting: FlowchartSetting;
    service: FlowchartService;
    element: any;
    d3ele: any;
    gCam: any;

    minimapEle: any;
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
    // Panning = false;
    document;

    dragPoint1 = null;
    dragPoint2 = null;
    dragTangent1 = null;
    dragTangent2 = null;

    timeStamp = 0;
    minimapViewBox = { x: 0, y: 0, w: 100, h: 100 };
    size = { w: 300, h: 300 };
    canvasSize = { w: 100, h: 100 };
    isPanning = false;
    brush: d3.BrushBehavior<any> = null;
    gBrush = null;
    zoom = null;
    transform = { x: 0, y: 0, k: 1 };

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
        // this.viewBox = { x: 0, y: 0, w: this.element.width(), h: this.element.height() };
        this.size = { w: this.element.width(), h: this.element.height() }; // This is view size
        this.canvasSize = { w: this.size.w / this.setting.minimapScale, h: this.size.h / this.setting.minimapScale };
        this.mouseCapture.registerElement(element);
        this.d3ele = d3.select(this.element.get(0));
        this.gCam = this.d3ele.select("g");
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 2])
            .on("zoom", (evt: any) => {
                this.transform = evt.transform;
                if (evt.sourceEvent && evt.sourceEvent.type === "brush")
                    return null;
                this.gCam.attr("transform", this.trans(this.transform.x, this.transform.y, this.transform.k));
                const scaleX = this.minimapScaleX(this.transform.k);
                const scaleY = this.minimapScaleY(this.transform.k);
                this.brush.move(this.gBrush, [
                    [scaleX.invert(-this.transform.x), scaleY.invert(-this.transform.y)],
                    [scaleX.invert(-this.transform.x + this.size.w), scaleY.invert(-this.transform.y + this.size.h)]
                ]);
            });
    }

    registerMiniMapEle(element) {
        this.minimapEle = element;
        let svg = d3.select(this.minimapEle.get(0));
        let w = this.size.w;
        let h = this.size.h;
        svg.attr("viewBox", [0, 0, this.canvasSize.w, this.canvasSize.h].join(" "))
            .attr("preserveAspectRatio", "xMidYMid meet");
        this.gBrush = svg.append("g");
        this.brush = d3.brush()
            .extent([[0, 0], [this.canvasSize.w, this.canvasSize.h]])
            .on("brush", (evt: any) => {
                console.log(evt);

                if (!evt.sourceEvent)
                    return null;
                if (Array.isArray(evt.selection)) {
                    const [[brushX, brushY], [brushX2, brushY2]] = evt.selection;
                    const zoomScale = d3.zoomTransform(this.d3ele.node()).k;

                    const scaleX = this.minimapScaleX(zoomScale);
                    const scaleY = this.minimapScaleY(zoomScale);
                    this.d3ele.call(
                        this.zoom.transform,
                        d3.zoomIdentity.translate(-brushX, -brushY).scale(zoomScale),
                        null,
                        evt
                    );
                    this.gCam.attr("transform", this.trans(scaleX(-brushX), scaleY(-brushY), zoomScale));
                }

            });
        this.d3ele.call(this.zoom);
        this.gBrush.call(this.brush);
        this.brush.move(this.gBrush, [[0, 0], [w, h]]);
        svg.selectAll(".handle").remove();
        svg.selectAll(".overlay").remove();
    }

    minimapScaleX(zoomScale) {
        return d3.scaleLinear().domain([0, this.size.w]).range([0, this.size.w * zoomScale]);
    }
    minimapScaleY(zoomScale) {
        return d3.scaleLinear().domain([0, this.size.h]).range([0, this.size.h * zoomScale]);
    }

    trans(x, y, k) {
        const coord2d = `translate(${x}, ${y})`;
        if (!k) return coord2d;
        return coord2d + ` scale(${k})`;
    }

    hitTest(clientX, clientY) {

        //
        // Retreive the element the mouse is currently over.
        //
        return this.document.elementFromPoint(clientX, clientY);
    };

    hasClassSVG(obj, has) {
        let classes = obj.attr('class');
        if (!classes) {
            return false;
        }

        let index = classes.search(has);

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

    scaleX(x) {
        return (x - this.transform.x) / this.transform.k;
    }
    scaleY(y) {
        return (y - this.transform.y) / this.transform.k;
    }
    scalePoint(point) {
        return { x: this.scaleX(point.x), y: this.scaleY(point.y) };
    }

    mouseDown(evt) {
        let startMouseCoords;
        this.model.deselectAll();
        this.dragging.startDrag(evt, {

            //
            // Commence dragging... setup variables to display the drag selection rect.
            //
            dragStarted: (x, y, e) => {
                this.dragSelecting = evt.ctrlKey;
                // this.Panning = !evt.ctrlKey;
                let startPoint = this.scalePoint(Toolkit.translateCoordinates(this.element, x, y, evt));
                this.dragSelectionStartPoint = startPoint;
                startMouseCoords = { x: x, y: y };
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
            dragging: (x, y, e) => {
                let curPoint = this.scalePoint(Toolkit.translateCoordinates(this.element, x, y, evt));
                if (this.dragSelecting) {
                    let startPoint = this.dragSelectionStartPoint;
                    this.dragSelectionRect = {
                        x: curPoint.x > startPoint.x ? startPoint.x : curPoint.x,
                        y: curPoint.y > startPoint.y ? startPoint.y : curPoint.y,
                        width: curPoint.x > startPoint.x ? curPoint.x - startPoint.x : startPoint.x - curPoint.x,
                        height: curPoint.y > startPoint.y ? curPoint.y - startPoint.y : startPoint.y - curPoint.y,
                    };
                }
            },

            //
            // Dragging has ended... select all that are within the drag selection rect.
            //
            dragEnded: () => {
                this.dragSelecting = false;
                // this.Panning = false;
                this.model.applySelectionRect(this.dragSelectionRect);
                delete this.dragSelectionStartPoint;
                delete this.dragSelectionRect;
            },
            name: "mouseDown",
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

    drop(evt: DragEvent) {
        evt.preventDefault();
        let dataStr = evt.dataTransfer.getData("node");
        let offset = JSON.parse(evt.dataTransfer.getData("offset"));
        if (dataStr) {
            let data = JSON.parse(dataStr);
            data.id = Toolkit.UID();
            let point = Toolkit.translateCoordinates(this.element, evt.pageX - offset.x, evt.pageY - offset.y, evt)
            data.x = this.scaleX(point.x);
            data.y = this.scaleY(point.y);
            this.model.addNode(data);
            this.model.onDrop.emit({ data: data, originEvent: evt });
        }
    }

    nodeMouseDown(evt, node) {
        let lastMouseCoords;
        this.dragging.startDrag(evt, {

            //
            // Node dragging has commenced.
            //
            dragStarted: (x, y) => {
                lastMouseCoords = this.scalePoint(Toolkit.translateCoordinates(this.element, x, y, evt));

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
                let curCoords = this.scalePoint(Toolkit.translateCoordinates(this.element, x, y, evt));
                let deltaX = curCoords.x - lastMouseCoords.x;
                let deltaY = curCoords.y - lastMouseCoords.y;

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

            name: "nodeMouseDown",
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
                let curCoords = Toolkit.translateCoordinates(this.element, x, y, evt);
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
                let startCoords = this.scalePoint(Toolkit.translateCoordinates(this.element, x, y, evt));
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
                    let endConnector = this.service.getObject(this.mouseOverConnector) as ConnectorViewModel;
                    if (endConnector.type == connector.type) {
                        this.model.createNewConnection(connector, endConnector);
                    } else {
                        endConnector.err_msg = `[${connector.name()}]和[${endConnector.name()}]类型不匹配`;
                        setTimeout(() => { endConnector.err_msg = "" }, 3000);
                    }
                }

                this.draggingConnection = false;
                delete this.dragPoint1;
                delete this.dragTangent1;
                delete this.dragPoint2;
                delete this.dragTangent2;
            },
            name: "connectorMouseDown",

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

    get dragginArrowPath() {
        return `M ${this.dragPoint2.x} ${this.dragPoint2.y}
        L ${this.dragPoint2.x + this.setting.arrowSize} ${this.dragPoint2.y}
        L ${this.dragPoint2.x} ${this.dragPoint2.y + this.setting.arrowSize}
        L ${this.dragPoint2.x - this.setting.arrowSize} ${this.dragPoint2.y} Z`

    }
}