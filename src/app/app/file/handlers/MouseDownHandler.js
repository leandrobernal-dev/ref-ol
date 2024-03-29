import ImageElement from "@/app/app/file/classes/ImageElement";
import {
    getTransformControl,
    isOntopOfElement,
    multipleElementSelected,
} from "@/app/app/file/utilities/CanvasUtils";

export function MouseDownHandler(
    event,
    elements,
    setElements,
    setInitialTransform,
    setAction,
    setCursor,
    mouseCoords,
    setTransformControls,
    setSelectedTransformControl,
    transformControls,
    selectedElementIndexes,
    pressedKeys
) {
    event.preventDefault();

    // if middle mouse / panning
    if (event.button === 1) {
        setCursor("cursor-grabbing");
        setAction("panning");
    }

    // if left mouse
    if (event.button === 0) {
        if (pressedKeys.has(" ")) {
            setCursor("cursor-grabbing");
            setAction("panning");
            return;
        }

        // Get clicked transform control
        let selectedControl = getTransformControl(
            mouseCoords,
            transformControls
        );
        setTransformControls((pre) => (selectedControl !== -1 ? pre : []));
        setSelectedTransformControl(selectedControl);

        // Get all the element's id that are hovered
        const clickedElements = elements
            .map((element, index) =>
                isOntopOfElement(mouseCoords.x, mouseCoords.y, element)
                    ? element.id
                    : null
            )
            .filter((element) => element !== null);

        // If multiple elements are selected, check if mouse is over any of the selected elements for multi-element drag
        const multiDrag =
            elements.reduce(
                (count, element) => (element.selected ? count + 1 : count),
                0
            ) > 1
                ? isOntopOfElement(mouseCoords.x, mouseCoords.y, {
                      x: transformControls[0].x,
                      y: transformControls[0].y,
                      width: transformControls[1].x - transformControls[0].x,
                      height: transformControls[3].y - transformControls[0].y,
                      rotationAngle: 0,
                  })
                : false;
        // Set selected elements logic | If no control is selected, select elements
        if (selectedControl === -1) {
            if (!(clickedElements.length > 0 || multiDrag)) {
                setInitialTransform(() => ({
                    x: mouseCoords.x,
                    y: mouseCoords.y,
                }));
                setAction("dragselect");
                setElements((pre) =>
                    pre.map((element) => ({ ...element, selected: false }))
                );
                return;
            }
            setElements((pre) => {
                const newElements = !multiDrag
                    ? pre.map((element) => {
                          let isSelected = false;
                          // If mouse is over multiple elements, select the last indexed element
                          if (clickedElements.length > 1) {
                              if (event.shiftKey) {
                                  if (
                                      clickedElements[
                                          clickedElements.length - 1
                                      ] === element.id
                                  ) {
                                      isSelected = true;
                                  }
                              } else if (clickedElements.includes(element.id)) {
                                  if (
                                      clickedElements[
                                          clickedElements.length - 1
                                      ] === element.id
                                  ) {
                                      isSelected = true;
                                  }
                              }
                          } else {
                              // If shift key is pressed, select multiple elements
                              if (event.shiftKey) {
                                  if (
                                      clickedElements.includes(element.id) ||
                                      element.selected
                                  ) {
                                      if (element.selected) {
                                          //   console.log(element.id);
                                      }
                                      isSelected = true;
                                  }
                              } else if (clickedElements.includes(element.id)) {
                                  isSelected = true;
                              }
                          }
                          return {
                              ...element,
                              selected: isSelected,
                          };
                      })
                    : [...pre];

                return newElements;
            });
            if (multiDrag || clickedElements.length > 0) {
                setAction("dragging");
            }
        } else {
            // If one of the contols is selected, store initial values and set action
            // Store initial transform values
            if (multipleElementSelected(elements)) {
                setInitialTransform((pre) => ({
                    initCX:
                        transformControls[0].x +
                        (transformControls[2].x - transformControls[0].x) / 2,
                    initCY:
                        transformControls[0].y +
                        (transformControls[3].y - transformControls[0].y) / 2,
                    initX: transformControls[0].x,
                    initY: transformControls[0].y,
                    mousePressX: mouseCoords.x,
                    mousePressY: mouseCoords.y,
                    initW: transformControls[2].x - transformControls[0].x,
                    initH: transformControls[3].y - transformControls[0].y,
                    selectedElementsInitialValues: elements.map(
                        (element, index) =>
                            element.selected ? { ...element } : null
                    ),
                }));
            } else {
                setInitialTransform((pre) => ({
                    initCX:
                        elements[selectedElementIndexes[0]].x +
                        elements[selectedElementIndexes[0]].width / 2,
                    initCY:
                        elements[selectedElementIndexes[0]].y +
                        elements[selectedElementIndexes[0]].height / 2,
                    initX: elements[selectedElementIndexes[0]].x,
                    initY: elements[selectedElementIndexes[0]].y,
                    mousePressX: mouseCoords.x,
                    mousePressY: mouseCoords.y,
                    initW: elements[selectedElementIndexes[0]].width,
                    initH: elements[selectedElementIndexes[0]].height,
                }));
            }
            if (selectedControl === 4) {
                setAction("rotating");
                return;
            }

            setAction("resizing");
        }
    }
}
