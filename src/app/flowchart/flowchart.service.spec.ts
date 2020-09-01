import { TestBed } from '@angular/core/testing';

import { FlowchartService } from './flowchart.service';

describe('FlowchartService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FlowchartService = TestBed.get(FlowchartService);
    expect(service).toBeTruthy();
  });
});
