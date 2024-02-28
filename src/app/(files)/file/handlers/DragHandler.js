import { multipleElementSelected } from "@/app/(files)/file/utilities/CanvasUtils";

export function DragHandler(
    elements,
    setElements,
    mouseCoords,
    dragStart,
    selectedElementIndexes
) {
    setElements((pre) => {
        const preCopy = [...pre];
        if (multipleElementSelected(elements)) {
            selectedElementIndexes.forEach((index) => {
                preCopy[index].x = mouseCoords.x + dragStart.x[index];
                preCopy[index].y = mouseCoords.y + dragStart.y[index];
            });
        } else {
            preCopy[preCopy.length - 1].x = mouseCoords.x + dragStart.x;
            preCopy[preCopy.length - 1].y = mouseCoords.y + dragStart.y;
        }
        return preCopy;
    });
}
