import { getHighlightedElements } from "@/app/(files)/file/utilities/CanvasUtils";

export function DragSelectHandler(
    setInitialTransform,
    initialTransform,
    setElements,
    elements,
    mouseCoords
) {
    setInitialTransform((pre) => {
        return {
            ...pre,
            width: mouseCoords.x - pre.x,
            height: mouseCoords.y - pre.y,
        };
    });
    const highlighted = getHighlightedElements(elements, {
        ...initialTransform,
        width: mouseCoords.x - initialTransform.x,
        height: mouseCoords.y - initialTransform.y,
    });

    highlighted.forEach((index) => {
        setElements((pre) => {
            const newElements = [...pre];
            newElements[index].selected = true;
            return newElements;
        });
    });
}
