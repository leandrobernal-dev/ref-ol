import {
    calculateMidpoint,
    multipleElementSelected,
    rotate,
} from "@/app/(files)/file/utilities/CanvasUtils";

export function RotateHandler(
    elements,
    setElements,
    mouseCoords,
    initialTransform,
    selectedElementIndexes,
    scale
) {
    setElements((pre) => {
        const preCopy = [...pre];
        if (multipleElementSelected(elements)) {
            const {
                initW,
                initX,
                selectedElementsInitialValues,
                initH,
                initY,
                initCX,
                initCY,
            } = initialTransform;

            selectedElementIndexes.forEach((index) => {
                const { x, y, width, height, rotationAngle } =
                    selectedElementsInitialValues[index];

                // offset from center of bounding box
                const offset = Math.atan2(
                    initY - initCY - 20 / scale,
                    initX - initCX + initW / 2
                );
                // Angle of rotation of bounding box
                const angle = Math.atan2(
                    mouseCoords.y - initCY,
                    mouseCoords.x - initCX
                );
                // Rotate around center of bounding box
                const topLeft = rotate(x, y, initCX, initCY, angle - offset);
                const bottomRight = rotate(
                    x + width,
                    y + height,
                    initCX,
                    initCY,
                    angle - offset
                );
                const diagonalMidpoint = calculateMidpoint(
                    topLeft[0],
                    topLeft[1],
                    bottomRight[0],
                    bottomRight[1]
                );
                const cx = diagonalMidpoint[0]; // Get new center of element
                const cy = diagonalMidpoint[1];

                // Unrotate around center of element to get new position
                const newTopLeft = rotate(
                    topLeft[0],
                    topLeft[1],
                    cx,
                    cy,
                    (angle - offset) * -1
                );

                preCopy[index].x = newTopLeft[0];
                preCopy[index].y = newTopLeft[1];
                preCopy[index].rotationAngle = angle - offset + rotationAngle;
            });
        } else {
            const { x, y, width, height } = preCopy[selectedElementIndexes[0]];

            const cx = x + width / 2;
            const cy = y + height / 2;

            const offset = Math.atan2(y - cy - 20 / scale, x - cx + width / 2);
            const angle = Math.atan2(mouseCoords.y - cy, mouseCoords.x - cx);
            preCopy[selectedElementIndexes[0]].rotationAngle = angle - offset;
        }

        return preCopy;
    });
}
