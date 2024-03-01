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
    setElements((pre) => {
        const newElements = pre.map((element, index) => {
            return {
                ...element,
                selected: highlighted.includes(index),
            };
        });
        return newElements;
    });
}
