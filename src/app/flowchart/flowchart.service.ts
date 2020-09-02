import { Injectable } from '@angular/core';

@Injectable()
export class FlowchartService {

  objectMap: Map<string, any>

  constructor() {
    this.objectMap = new Map();
  }

  addObject(id: string, o: any) {
    this.objectMap.set(id, o);
  }

  getObject(id) {
    return this.objectMap.get(id);
  }

  delObject(id):boolean {
    return this.objectMap.delete(id);
  }
}


export interface FCService {
  service: FlowchartService
}
