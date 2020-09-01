import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowchartComponent } from './flowchart/flowchart.component';
import { FlowchartService } from "./flowchart.service";

@NgModule({
  imports: [
    CommonModule
  ],
  exports:[
    FlowchartComponent,
  ],
  providers:[
    FlowchartService,
  ],
  declarations: [FlowchartComponent]
})
export class FlowchartModule { }
