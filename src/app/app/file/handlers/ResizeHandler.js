import { minImageHeight, minImageWidth } from "@/app/app/file/config/config";
import { multipleElementSelected } from "@/app/app/file/utilities/CanvasUtils";

export function ResizeHandler(
    elements,
    selectedTransformControl,
    initialTransform,
    setElements,
    selectedElementIndexes,
    mouseCoords
) {
    switch (selectedTransformControl) {
        case 0:
            resizeHandler(true, true, true, true);
            break;
        case 1:
            resizeHandler(false, false, true, true);
            break;
        case 2:
            resizeHandler(false, true, true, true);
            break;
        case 3:
            resizeHandler(true, false, true, true);
            break;
        default:
            return;
    }
    function resizeHandler(
        left = false,
        top = false,
        xResize = false,
        yResize = false
    ) {
        if (multipleElementSelected(elements)) {
            const {
                initW,
                initX,
                selectedElementsInitialValues,
                initH,
                initY,
            } = initialTransform;
            const { newW, newH, newx, newy } = getResize(
                0,
                left,
                top,
                xResize,
                yResize
            );
            // const scaleFactor =
            //     (newx - newW / 2 + newW) / (initX + initW); // Divide new width by initial width to get scale factor
            let scaleFactor = newW / initW; // Divide new width by initial width to get scale factor
            setElements((pre) => {
                const preCopy = [...pre];
                let originX, originY;
                selectedElementIndexes.forEach((index) => {
                    const { x, y, width, height } =
                        selectedElementsInitialValues[index];
                    let nx, ny, nw, nh;

                    switch (selectedTransformControl) {
                        case 0:
                            originX = newx - newW / 2 + newW;
                            originY = newy - newH / 2 + newH;
                            break;
                        case 1:
                            originX = newx - newW / 2;
                            originY = newy - newH / 2;
                            break;
                        case 2:
                            originX = newx - newW / 2;
                            originY = newy - newH / 2 + newH;
                            break;
                        case 3:
                            originX = newx - newW / 2 + newW;
                            originY = newy - newH / 2;
                            break;
                        default:
                            break;
                    }

                    nx = (x - originX) * scaleFactor; // Subtract element.x from the origin before scaling
                    ny = (y - originY) * scaleFactor;
                    nw = (x - originX + width) * scaleFactor - nx; // Subtract scaled top left corner from scaled x to get width
                    nh = (y - originY + height) * scaleFactor - ny; // Subtract scaled bottom left corner from scaled y to get height

                    preCopy[index].x = nx + originX; // Add origin back to the scaled values
                    preCopy[index].y = ny + originY;
                    preCopy[index].width = nw;
                    preCopy[index].height = nh;
                });
                return preCopy;
            });
        } else {
            setElements((pre) => {
                const preCopy = [...pre];
                const { rotationAngle } = preCopy[selectedElementIndexes[0]];
                const { newW, newH, newx, newy } = getResize(
                    rotationAngle,
                    left,
                    top,
                    xResize,
                    yResize
                );
                preCopy[selectedElementIndexes[0]].x = newx - newW / 2;
                preCopy[selectedElementIndexes[0]].y = newy - newH / 2;
                preCopy[selectedElementIndexes[0]].width = newW;
                preCopy[selectedElementIndexes[0]].height = newH;
                return preCopy;
            });
        }

        function getResize(rotationAngle, left, top, xResize, yResize) {
            const {
                initW,
                initH,
                mousePressX,
                mousePressY,
                initCX,
                initCY,
                initX,
                initY,
            } = initialTransform;

            let cosFraction = Math.cos(rotationAngle);
            let sinFraction = Math.sin(rotationAngle);
            //
            let wDiff = mouseCoords.x - mousePressX;
            let hDiff = mouseCoords.y - mousePressY;
            let rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff;
            let rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff;
            let newW = initW,
                newH = initH,
                newx = initCX,
                newy = initCY;

            //calculate width and height
            if (xResize) {
                if (left) {
                    newW = initW - rotatedWDiff;
                } else {
                    newW = initW + rotatedWDiff;
                }
                if (newW < minImageWidth) {
                    newW = minImageWidth;
                }
            }
            if (yResize) {
                if (top) {
                    newH = initH - rotatedHDiff;
                } else {
                    newH = initH + rotatedHDiff;
                }
                if (newH < minImageHeight) {
                    newH = minImageHeight;
                }
            }

            // aspect ratio contraint
            let sc = Math.max(newW / initW, newH / initH);
            newW = sc * initW;
            newH = sc * initH;
            // Recalculate position
            if (xResize) {
                if (left) {
                    rotatedWDiff = initW - newW;
                } else {
                    rotatedWDiff = newW - initW;
                }
                newx += 0.5 * rotatedWDiff * cosFraction;
                newy += 0.5 * rotatedWDiff * sinFraction;
            }
            if (yResize) {
                if (top) {
                    rotatedHDiff = initH - newH;
                } else {
                    rotatedHDiff = newH - initH;
                }
                newx -= 0.5 * rotatedHDiff * sinFraction;
                newy += 0.5 * rotatedHDiff * cosFraction;
            }

            return { newW, newH, newx, newy };
        }
    }
}
