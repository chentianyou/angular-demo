import { FlowchartService, FCService } from "../../flowchart.service";
import { Toolkit } from "../../Toolkit";
import { FlowchartSetting } from "./graph";

export class ConnectionViewModel implements FCService {
    id: string;
    data: any;
    source: any;
    dest: any;
    _selected = false;
    service: FlowchartService;
    selectedHandler: (data) => void;
    setting: FlowchartSetting;

    constructor(connectionDataModel, sourceConnector, destConnector, service: FlowchartService, setting: FlowchartSetting) {
        this.data = connectionDataModel;
        this.source = sourceConnector;
        this.dest = destConnector;
        // Set to true when the connection is selected.
        this._selected = false;
        this.id = Toolkit.UID();
        this.service = service;
        this.setting = setting;
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

    get arrowPath() {
        return `M ${this.destCoordX()} ${this.destCoordY()}
        L ${this.destCoordX() + this.setting.arrowSize} ${this.destCoordY()}
        L ${this.destCoordX()} ${this.destCoordY() + this.setting.arrowSize}
        L ${this.destCoordX() - this.setting.arrowSize} ${this.destCoordY()} Z`
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
        if (!this._selected && this.selectedHandler) {
            this.selectedHandler(this.data);
        }
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
        if (!this._selected && this.selectedHandler) {
            this.selectedHandler(this.data);
        }
        this._selected = !this._selected;
    };

    //
    // Returns true if the connection is selected.
    //
    selected() {
        return this._selected;
    };



}

