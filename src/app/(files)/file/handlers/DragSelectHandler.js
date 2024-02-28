import { getHighlightedElements } from "@/app/(files)/file/utilities/CanvasUtils";

export function DragSelectHandler(
    setInitialTransform,
    setElements,
    elements,
    mouseCoords
) {
    setInitialTransform((pre) => {
        const highlighted = getHighlightedElements(elements, {
            ...pre,
            width: mouseCoords.x - pre.x,
            height: mouseCoords.y - pre.y,
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
        return {
            ...pre,
            width: mouseCoords.x - pre.x,
            height: mouseCoords.y - pre.y,
        };
    });
}
