export interface FlowchartSetting {
    defaultNodeWidth?: number;
    nodeNameHeight?: number;
    connectorHeight?: number;
    connectorSize?: number;
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
  