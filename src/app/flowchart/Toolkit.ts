export class Toolkit {

	/**
	 * Generats a unique ID (thanks Stack overflow :3)
	 * @returns {String}
	 */
	public static UID(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	public static computeConnectionSourceTangentX(pt1, pt2) {
		// return pt1.x + this.computeConnectionTangentOffset(pt1, pt2);
		return pt1.x;
	};

	public static computeConnectionTangentOffset(pt1, pt2) {
		// return (pt2.x - pt1.x) / 2;
		return (pt2.y - pt1.y) / 2
	}

	public static computeConnectionSourceTangentY(pt1, pt2) {
		// return pt1.y;
		return pt1.y + this.computeConnectionTangentOffset(pt1, pt2);
	};

	public static computeConnectionSourceTangent(pt1, pt2) {
		return {
			x: this.computeConnectionSourceTangentX(pt1, pt2),
			y: this.computeConnectionSourceTangentY(pt1, pt2),
		};
	};

	public static computeConnectionDestTangentX(pt1, pt2) {
		// return pt2.x - this.computeConnectionTangentOffset(pt1, pt2);
		return pt2.x;
	};

	//
	// Compute the tangent for the bezier curve.
	//
	public static computeConnectionDestTangentY(pt1, pt2) {
		// return pt2.y;
		return pt2.y - this.computeConnectionTangentOffset(pt1, pt2);
	};

	public static computeConnectionDestTangent(pt1, pt2) {
		return {
			x: this.computeConnectionDestTangentX(pt1, pt2),
			y: this.computeConnectionDestTangentY(pt1, pt2),
		};
	};

	public static translateCoordinates(element, x, y, evt) {
        var svg_elem = element.get(0);
        var matrix = svg_elem.getScreenCTM();
        var point = svg_elem.createSVGPoint();
        point.x = x - evt.view.pageXOffset;
        point.y = y - evt.view.pageYOffset;
        return point.matrixTransform(matrix.inverse());
    };
}
