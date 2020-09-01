import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowchartComponent } from './flowchart/flowchart.component';
import { FlowchartService } from "./flowchart.service";
import { NodeitemDirective } from './nodeitem/nodeitem.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    FlowchartComponent,
    NodeitemDirective,
  ],
  providers: [
    FlowchartService,
  ],
  declarations: [
    FlowchartComponent,
    NodeitemDirective,
  ]
})
export class FlowchartModule { }
