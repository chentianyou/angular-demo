import { FlowchartModule } from './flowchart.module';

describe('FlowchartModule', () => {
  let flowchartModule: FlowchartModule;

  beforeEach(() => {
    flowchartModule = new FlowchartModule();
  });

  it('should create an instance', () => {
    expect(flowchartModule).toBeTruthy();
  });
});
