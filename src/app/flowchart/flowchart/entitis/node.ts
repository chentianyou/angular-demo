import { ConnectorViewModel } from "./connector";
import { FlowchartService, FCService } from "../../flowchart.service";
import { Toolkit } from "../../Toolkit";
import { FlowchartSetting } from "./graph";


export class NodeViewModel implements FCService {
    id: string;
    setting: FlowchartSetting;
    data: any;
    inputConnectors: ConnectorViewModel[];
    outputConnectors: ConnectorViewModel[];
    _selected = false;
    service: FlowchartService;
    selectedHandler: (data) => void;

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
    // Icon of the node
    //
    get icon() {
        return this.data.icon;
    }

    get hasIcon() {
        return this.data.icon && true;
    }

    //
    // Select the node.
    //
    select() {
        if (!this._selected && this.selectedHandler) {
            this.selectedHandler(this.data);
        }
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
        if (!this._selected && this.selectedHandler) {
            this.selectedHandler(this.data);
        }
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
