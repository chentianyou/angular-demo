import { Directive, ElementRef, NgZone, EventEmitter, AfterViewInit, OnDestroy, Input, Output, HostListener } from '@angular/core';

@Directive({
  selector: '[pNodeitem]'
})
export class NodeitemDirective implements AfterViewInit, OnDestroy {
  @Input()
  data: any;
  @Input()
  dragEffect: string;
  @Output()
  onDragStart: EventEmitter<any>;
  @Output()
  onDragEnd: EventEmitter<any>;
  @Output()
  onDrag: EventEmitter<any>;

  el: ElementRef;
  zone: NgZone;
  dragListener: any;
  mouseDownListener: any;
  mouseUpListener: any;
  handle: any;

  constructor(
    el: ElementRef,
    zone: NgZone
  ) {
    this.el = el;
    this.zone = zone;
    this.onDragStart = new EventEmitter();
    this.onDragEnd = new EventEmitter();
    this.onDrag = new EventEmitter();
  }

  ngAfterViewInit() {
    this.el.nativeElement.draggable = true;
    this.bindMouseListeners();
  }

  ngOnDestroy() {
    this.unbindDragListener();
    this.unbindMouseListeners();
  }

  bindDragListener() {
    if (!this.dragListener) {
      this.zone.runOutsideAngular(() => {
        this.dragListener = this.drag.bind(this);
        this.el.nativeElement.addEventListener('drag', this.dragListener);
      });
    }
  };

  unbindDragListener() {
    if (this.dragListener) {
      this.zone.runOutsideAngular(() => {
        this.el.nativeElement.removeEventListener('drag', this.dragListener);
        this.dragListener = null;
      });
    }
  };

  bindMouseListeners() {
    if (!this.mouseDownListener && !this.mouseUpListener) {
      this.zone.runOutsideAngular(() => {
        this.mouseDownListener = this.mousedown.bind(this);
        this.mouseUpListener = this.mouseup.bind(this);
        this.el.nativeElement.addEventListener('mousedown', this.mouseDownListener);
        this.el.nativeElement.addEventListener('mouseup', this.mouseUpListener);
      });
    }
  }

  unbindMouseListeners() {
    if (this.mouseDownListener && this.mouseUpListener) {
      this.zone.runOutsideAngular(() => {
        this.el.nativeElement.removeEventListener('mousedown', this.mouseDownListener);
        this.el.nativeElement.removeEventListener('mouseup', this.mouseUpListener);
        this.mouseDownListener = null;
        this.mouseUpListener = null;
      });
    }
  };

  mousedown(event) {
    this.handle = event.target;
  }

  mouseup(event) {
    this.handle = null;
  }

  drag(event) {
    this.onDrag.emit(event);
  }

  @HostListener('dragstart', ['$event'])
  dragStart(event: DragEvent) {
    if (this.dragEffect) {
      event.dataTransfer.effectAllowed = this.dragEffect;
    }
    let point = {
      x: event.offsetX,
      y: event.offsetY,
    }
    event.dataTransfer.setData("offset", JSON.stringify(point));
    event.dataTransfer.setData('node', JSON.stringify(this.data));

    this.onDragStart.emit(event);
    this.bindDragListener();
  }

  @HostListener('dragend', ['$event'])
  dragEnd(event) {
    this.onDragEnd.emit(event);
    this.unbindDragListener();
  }
}
