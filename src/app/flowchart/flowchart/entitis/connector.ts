import { Toolkit } from "../../Toolkit";
import { FlowchartService, FCService } from "../../flowchart.service";

export class ConnectorViewModel implements FCService {
    id: string;
    data: any;
    _parentNode: any;
    _x: any;
    _y: any;
    used = false;
    err_msg: string = "";
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

    // The type of the connector
    get type() {
        return this.data.type || ""
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