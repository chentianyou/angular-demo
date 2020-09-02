
declare var $: any;

export class MouseCapture {
    mouseCaptureConfig = null;
    element = $(document);

    mouseMove(evt) {        
        if (this.mouseCaptureConfig && this.mouseCaptureConfig.mouseMove) {

            this.mouseCaptureConfig.mouseMove(evt);

            // $rootScope.$digest();
        }
    }

    mouseUp(evt) {
        if (this.mouseCaptureConfig && this.mouseCaptureConfig.mouseUp) {

            this.mouseCaptureConfig.mouseUp(evt);

            // $rootScope.$digest();
        }
    };

    registerElement(element) {
        this.element = $(element);
    }

    acquire(evt, config) {
        //
        // Release any prior mouse capture.
        //
        this.release(evt);

        this.mouseCaptureConfig = config;

        // 
        // In response to the mousedown event register handlers for mousemove and mouseup 
        // during 'mouse capture'.
        //

        this.element.mousemove(this.mouseMove.bind(this));
        this.element.mouseup(this.mouseUp.bind(this));
    }

    //
    // Release the 'mouse capture'.
    //
    release(evt) {

        if (this.mouseCaptureConfig) {

            if (this.mouseCaptureConfig.released) {
                //
                // Let the client know that their 'mouse capture' has been released.
                //
                this.mouseCaptureConfig.released(evt);
            }

            this.mouseCaptureConfig = null;
        }

        this.element.unbind("mousemove", this.mouseMove.bind(this));
        this.element.unbind("mouseup", this.mouseUp.bind(this));
    }
}