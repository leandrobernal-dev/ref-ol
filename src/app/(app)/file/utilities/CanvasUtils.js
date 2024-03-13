// Get scaled mouse coordinates
function getMouseCoordinates(event, canvasRef, panOffset, scale) {
    const canvas = canvasRef;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    return {
        x: (mouseX - panOffset.x) / scale,
        y: (mouseY - panOffset.y) / scale,
    };
}

// Rotate a point around an origin
function rotate(x, y, cx, cy, angle) {
    // return [
    //     Math.cos(angle) * (x - cx) - Math.sin(angle) * (y - cy) + cx,
    //     Math.sin(angle) * (x - cx) + Math.cos(angle) * (y - cy) + cy,
    // ];
    return [
        (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
        (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
    ];
}

// Get the indices of the elements that are highlighted by the selection box
function getHighlightedElements(elementsArray, selectionBox) {
    let selectedObjectIndices = [];

    // Determine the boundaries of the selection box
    let x = Math.min(selectionBox.x, selectionBox.x + selectionBox.width);
    let width = Math.max(selectionBox.x, selectionBox.x + selectionBox.width);
    let y = Math.min(selectionBox.y, selectionBox.y + selectionBox.height);
    let height = Math.max(selectionBox.y, selectionBox.y + selectionBox.height);

    // Iterate through each object
    for (let i = 0; i < elementsArray.length; i++) {
        let obj = elementsArray[i];
        const cx = obj.x + obj.width / 2;
        const cy = obj.y + obj.height / 2;
        // Calculate the rotated coordinates of the rectangle's corners
        let rotatedTopLeft = rotate(obj.x, obj.y, cx, cy, obj.rotationAngle);
        let rotatedTopRight = rotate(
            obj.x + obj.width,
            obj.y,
            cx,
            cy,
            obj.rotationAngle
        );
        let rotatedBottomLeft = rotate(
            obj.x,
            obj.y + obj.height,
            cx,
            cy,
            obj.rotationAngle
        );
        let rotatedBottomRight = rotate(
            obj.x + obj.width,
            obj.y + obj.height,
            cx,
            cy,
            obj.rotationAngle
        );

        // Check for intersection
        if (
            rotatedTopLeft[0] < width &&
            rotatedTopRight[0] > x &&
            rotatedTopLeft[1] < height &&
            rotatedBottomLeft[1] > y
            // rotatedTopLeft.x < x + width &&
            // rotatedTopRight.x > x &&
            // rotatedTopLeft.y < y + height &&
            // rotatedBottomRight.y > y
        ) {
            // Object is inside or partially inside the selection box
            selectedObjectIndices.push(i);
        }
    }

    return selectedObjectIndices;
}

// Get the index of the transform control that is selected
function getTransformControl(mouseCoords, transformControls) {
    let selectedControl = transformControls.findIndex((control) => {
        const dx = mouseCoords.x - control.x;
        const dy = mouseCoords.y - control.y;
        return dx * dx + dy * dy <= ((control.width / 2) * control.width) / 2;
    });
    return selectedControl;
}

// Check if multiple elements are selected
const multipleElementSelected = (elements) =>
    elements.reduce(
        (count, element) => (element.selected ? count + 1 : count),
        0
    ) > 1;

// Get midpoint of two points
function calculateMidpoint(x1, y1, x2, y2) {
    var xMidpoint = (x1 + x2) / 2;
    var yMidpoint = (y1 + y2) / 2;
    return [xMidpoint, yMidpoint];
}

// Check if the mouse is on top of a rotated element
function isOntopOfElement(mouseX, mouseY, element) {
    // Initialize the inside flag
    let inside = false;

    // Get the corners of the element
    const corners = getElementCorner(
        element.x,
        element.y,
        element.width,
        element.height,
        element.rotationAngle
    );

    // Create a point from the mouse coordinates
    const point = [mouseX, mouseY];

    // Check if the point is inside the element
    for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
        const xi = corners[i][0];
        const yi = corners[i][1];
        const xj = corners[j][0];
        const yj = corners[j][1];

        // Check if the line segment intersects with the point
        const intersect =
            yi > point[1] !== yj > point[1] &&
            point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

        // Toggle the inside flag if there is an intersection
        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
}
function getElementCorner(x, y, width, height, angle) {
    const cx = (x * 2 + width) / 2;
    const cy = (y * 2 + height) / 2;

    const topLeft = rotate(x, y, cx, cy, angle);
    const topRight = rotate(x + width, y, cx, cy, angle);
    const bottomRight = rotate(x + width, y + height, cx, cy, angle);
    const bottomLeft = rotate(x, y + height, cx, cy, angle);

    return [
        [topLeft[0], topLeft[1]],
        [topRight[0], topRight[1]],
        [bottomRight[0], bottomRight[1]],
        [bottomLeft[0], bottomLeft[1]],
    ];
}

// Get bounding box of a rotated image
function getRotatedBoundingBox(image) {
    // Calculate the center point of the image
    let centerX = image.x + image.width / 2;
    let centerY = image.y + image.height / 2;

    // Calculate the rotated coordinates of each corner
    let topLeft = rotate(
        image.x,
        image.y,
        centerX,
        centerY,
        image.rotationAngle
    );
    let topRight = rotate(
        image.x + image.width,
        image.y,
        centerX,
        centerY,
        image.rotationAngle
    );
    let bottomLeft = rotate(
        image.x,
        image.y + image.height,
        centerX,
        centerY,
        image.rotationAngle
    );
    let bottomRight = rotate(
        image.x + image.width,
        image.y + image.height,
        centerX,
        centerY,
        image.rotationAngle
    );

    // Find the minimum and maximum coordinates
    let minX = Math.min(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]);
    let minY = Math.min(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]);
    let maxX = Math.max(topLeft[0], topRight[0], bottomLeft[0], bottomRight[0]);
    let maxY = Math.max(topLeft[1], topRight[1], bottomLeft[1], bottomRight[1]);

    // Calculate the width and height of the bounding box
    let width = maxX - minX;
    let height = maxY - minY;

    return {
        minX: minX,
        minY: minY,
        width: width,
        height: height,
    };
}
function radToDeg(angle) {
    return (180 * angle) / Math.PI;
}
function degToRad(angle) {
    return (Math.PI / 180) * angle;
}
export {
    getMouseCoordinates,
    rotate,
    getHighlightedElements,
    getTransformControl,
    multipleElementSelected,
    calculateMidpoint,
    radToDeg,
    degToRad,
    isOntopOfElement,
    getRotatedBoundingBox,
};
