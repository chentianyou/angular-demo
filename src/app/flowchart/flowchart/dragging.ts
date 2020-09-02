import { MouseCapture } from "./mouse.capture";

export class Dragging {
    mouseCapture: MouseCapture;
    threshold = 5;

    constructor(mouseCapture: MouseCapture) {
        this.mouseCapture = mouseCapture;
    }

    startDrag(evt, config) {

        let dragging = false;
        let x = evt.pageX;
        let y = evt.pageY;

        //
        // Handler for mousemove events while the mouse is 'captured'.
        //
        let mouseMove = (evt) => {

            if (!dragging) {
                if (Math.abs(evt.pageX - x) > this.threshold ||
                    Math.abs(evt.pageY - y) > this.threshold) {
                    dragging = true;

                    if (config.dragStarted) {
                        config.dragStarted(x, y, evt);
                    }

                    if (config.dragging) {
                        // First 'dragging' call to take into account that we have 
                        // already moved the mouse by a 'threshold' amount.
                        config.dragging(evt.pageX, evt.pageY, evt);
                    }
                }
            }
            else {
                if (config.dragging) {
                    config.dragging(evt.pageX, evt.pageY, evt);
                }

                x = evt.pageX;
                y = evt.pageY;
            }
        };
        //
        // Handler for when mouse capture is released.
        //
        let released = (evt) => {

            if (dragging) {
                if (config.dragEnded) {
                    config.dragEnded();
                }
            }
            else {
                if (config.clicked) {
                    config.clicked();
                }
            }
        };

        //
        // Handler for mouseup event while the mouse is 'captured'.
        // Mouseup releases the mouse capture.
        //
        let mouseUp = (evt) => {

            this.mouseCapture.release(evt);

            evt.stopPropagation();
            evt.preventDefault();
        };

        //
        // Acquire the mouse capture and start handling mouse events.
        //
        this.mouseCapture.acquire(evt, {
            mouseMove: mouseMove,
            mouseUp: mouseUp,
            released: released,
        });

        evt.stopPropagation();
        evt.preventDefault();

    }


}
