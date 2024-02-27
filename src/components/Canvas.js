"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const usePressedKeys = () => {
    const [pressedKeys, setPressedKeys] = useState(new Set());

    useEffect(() => {
        const handleKeyDown = (event) => {
            setPressedKeys((prevKeys) => new Set(prevKeys).add(event.key));
        };

        const handleKeyUp = (event) => {
            setPressedKeys((prevKeys) => {
                const updatedKeys = new Set(prevKeys);
                updatedKeys.delete(event.key);
                return updatedKeys;
            });
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    return pressedKeys;
};

class ImageElement {
    constructor(src, x, y) {
        this.src = src;
        this.x = x;
        this.y = y;
        this.width = null;
        this.height = null;
        this.isHovered = false;
        this.image = null;
        this.rotationAngle = 0;
        this.id = null;
        this.selected = false;
    }

    create() {
        this.image = new Image();
        this.image.src = this.src;
        this.width = this.image.naturalWidth;
        this.height = this.image.naturalHeight;
        this.id = Math.random().toString(36).substring(2, 9);
    }
    resize(w, h) {
        this.width = w;
        this.height = h;
    }
}
const cursorType = (position) => {
    switch (position) {
        case 0:
        case 1:
            return "cursor-nwse-resize";
        case 2:
        case 3:
            return "cursor-nesw-resize";
        case 4:
        case 5:
            return "cursor-move";
        default:
            return "cursor-auto";
    }
};

export default function Canvas() {
    const canvasRef = useRef(null);
    const [panOffset, setPanOffset] = useState({ x: 500, y: 300 });
    const [scale, setScale] = useState(0.3);
    const [windowSize, setWindowSize] = useState(null);

    const [elements, setElements] = useState([]);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialTransform, setInitialTransform] = useState({});
    const [cursor, setCursor] = useState("cursor-auto");
    const [transformControls, setTransformControls] = useState([]);
    const [selectedTransformControl, setSelectedTransformControl] =
        useState(-1);
    const maxZoom = 3.0;
    const minZoom = 0.01;
    const minWidth = 20;
    const minHeight = 20;

    const [undo, setUndo] = useState([]);
    const [action, setAction] = useState("none");
    const pressedKeys = usePressedKeys();

    useEffect(() => {
        const canvas = canvasRef.current;
        const boundingRect = canvas.getBoundingClientRect();

        // Event listener for mouse wheel (zoom)
        function handleWheel(event) {
            event.preventDefault();
            const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1; // Zoom in or out

            // Calculate mouse position relative to canvas
            const mouseX = event.clientX - boundingRect.left;
            const mouseY = event.clientY - boundingRect.top;

            // Calculate new scale based on zoom origin
            const newScale = scale * scaleFactor;

            // Check if new scale is within limits
            if (newScale >= minZoom && newScale <= maxZoom) {
                // Update scale and pan offset
                setScale(newScale);
                setPanOffset((prevPosition) => ({
                    x:
                        prevPosition.x -
                        (mouseX - prevPosition.x) * (scaleFactor - 1),
                    y:
                        prevPosition.y -
                        (mouseY - prevPosition.y) * (scaleFactor - 1),
                }));
            }
        }
        let selectedElementIndexes = elements
            .map((element, index) => (element.selected ? index : null))
            .filter((index) => index !== null);

        function handleMouseDown(event) {
            const mouseCoords = getMouseCoordinates(event);
            event.preventDefault();

            // if middle mouse / panning
            if (event.button === 1) {
                setCursor("cursor-grabbing");
                setAction("panning");
            }

            if (event.button === 0) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                // Get clicked transform control
                let selectedControl = getTransformControl(mouseCoords);
                setTransformControls((pre) =>
                    selectedControl !== -1 ? pre : []
                );
                setSelectedTransformControl(selectedControl);

                // Get all the element's id that are hovered
                const clickedElements = elements
                    .map((element, index) =>
                        element.isHovered ? element.id : null
                    )
                    .filter((element) => element !== null);

                // If multiple elements are selected, check if mouse is over any of the selected elements for multi-element drag
                const multiDrag =
                    elements.reduce(
                        (count, element) =>
                            element.selected ? count + 1 : count,
                        0
                    ) > 1
                        ? isOntopOfElement(mouseCoords.x, mouseCoords.y, {
                              x: transformControls[0].x,
                              y: transformControls[0].y,
                              width:
                                  transformControls[1].x -
                                  transformControls[0].x,
                              height:
                                  transformControls[3].y -
                                  transformControls[0].y,
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
                                              ] === element.id ||
                                              element.selected
                                          ) {
                                              isSelected = true;
                                          }
                                      } else if (
                                          clickedElements.includes(element.id)
                                      ) {
                                          isSelected = true;
                                      }
                                  } else {
                                      // If shift key is pressed, select multiple elements
                                      if (event.shiftKey) {
                                          if (
                                              clickedElements.includes(
                                                  element.id
                                              ) ||
                                              element.selected
                                          ) {
                                              if (element.selected) {
                                                  //   console.log(element.id);
                                              }
                                              isSelected = true;
                                          }
                                      } else if (
                                          clickedElements.includes(element.id)
                                      ) {
                                          isSelected = true;
                                      }
                                  }
                                  return {
                                      ...element,
                                      selected: isSelected,
                                  };
                              })
                            : [...pre];
                        const selectedEls = newElements
                            .map((element, index) =>
                                element.selected ? index : null
                            )
                            .filter((index) => index !== null);

                        // Move selected elements to the end of the array
                        if (selectedEls.length < 2) {
                            selectedEls.forEach((index) => {
                                const moveElement = newElements.splice(
                                    index,
                                    1
                                )[0];
                                newElements.push(moveElement);
                            });
                        }

                        if (selectedEls.length > 0 && selectedControl === -1) {
                            // Set DragStart
                            if (selectedEls.length > 1) {
                                setDragStart({
                                    x: newElements.map((element, index) =>
                                        element.selected
                                            ? element.x - mouseCoords.x
                                            : null
                                    ),
                                    y: newElements.map((element, index) =>
                                        element.selected
                                            ? element.y - mouseCoords.y
                                            : null
                                    ),
                                });
                            } else {
                                setDragStart({
                                    x:
                                        elements[
                                            selectedEls[selectedEls.length - 1]
                                        ].x - mouseCoords.x,
                                    y:
                                        elements[
                                            selectedEls[selectedEls.length - 1]
                                        ].y - mouseCoords.y,
                                });
                            }

                            // if a resize control is selected, cancel drag | Prioritize resize action & cursor3
                            setAction("dragging");
                        }
                        return newElements;
                    });
                } else {
                    // If one of the contols is selected, store initial values and set action
                    // Store initial transform values
                    if (multipleElementSelected) {
                        setInitialTransform((pre) => ({
                            initCX:
                                transformControls[0].x +
                                (transformControls[2].x -
                                    transformControls[0].x) /
                                    2,
                            initCY:
                                transformControls[0].y +
                                (transformControls[3].y -
                                    transformControls[0].y) /
                                    2,
                            initX: transformControls[0].x,
                            initY: transformControls[0].y,
                            mousePressX: mouseCoords.x,
                            mousePressY: mouseCoords.y,
                            initW:
                                transformControls[2].x - transformControls[0].x,
                            initH:
                                transformControls[3].y - transformControls[0].y,
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

            // SAMPLE ADD IMAGE ELEMENT
            if (event.button === 2) {
                const newElement = new ImageElement(
                    "https://i.pinimg.com/564x/90/e2/2e/90e22eb27604c0064e86ce5478b9fa8c.jpg",
                    mouseCoords.x,
                    mouseCoords.y
                );
                newElement.create();
                createElement(newElement);
            }
        }
        function getSelectedObjects(objectsArray, selectionBox) {
            let selectedObjectIndices = [];

            // Determine the boundaries of the selection box
            let selectionLeft = Math.min(
                selectionBox.x,
                selectionBox.x + selectionBox.width
            );
            let selectionRight = Math.max(
                selectionBox.x,
                selectionBox.x + selectionBox.width
            );
            let selectionTop = Math.min(
                selectionBox.y,
                selectionBox.y + selectionBox.height
            );
            let selectionBottom = Math.max(
                selectionBox.y,
                selectionBox.y + selectionBox.height
            );

            // Iterate through each object
            for (let i = 0; i < objectsArray.length; i++) {
                let obj = objectsArray[i];
                // Check for intersection
                if (
                    obj.x < selectionRight &&
                    obj.x + obj.width > selectionLeft &&
                    obj.y < selectionBottom &&
                    obj.y + obj.height > selectionTop
                ) {
                    // Object is inside or partially inside the selection box
                    selectedObjectIndices.push(i);
                }
            }

            return selectedObjectIndices;
        }
        function handleMouseMove(event) {
            const mouseCoords = getMouseCoordinates(event);

            if (action === "panning") {
                setPanOffset((prevPanOffset) => ({
                    x: prevPanOffset.x + event.movementX,
                    y: prevPanOffset.y + event.movementY,
                }));
            }
            if (action === "dragselect") {
                setInitialTransform((pre) => {
                    const highlighted = getSelectedObjects(elements, {
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
            if (action === "dragging") {
                setElements((pre) => {
                    const preCopy = [...pre];
                    if (multipleElementSelected) {
                        selectedElementIndexes.forEach((index) => {
                            preCopy[index].x =
                                mouseCoords.x + dragStart.x[index];
                            preCopy[index].y =
                                mouseCoords.y + dragStart.y[index];
                        });
                    } else {
                        preCopy[preCopy.length - 1].x =
                            mouseCoords.x + dragStart.x;
                        preCopy[preCopy.length - 1].y =
                            mouseCoords.y + dragStart.y;
                    }
                    return preCopy;
                });
            }

            if (action === "resizing") {
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
                    if (multipleElementSelected) {
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
                            const { rotationAngle } =
                                preCopy[selectedElementIndexes[0]];
                            const { newW, newH, newx, newy } = getResize(
                                rotationAngle,
                                left,
                                top,
                                xResize,
                                yResize
                            );
                            preCopy[selectedElementIndexes[0]].x =
                                newx - newW / 2;
                            preCopy[selectedElementIndexes[0]].y =
                                newy - newH / 2;
                            preCopy[selectedElementIndexes[0]].width = newW;
                            preCopy[selectedElementIndexes[0]].height = newH;
                            return preCopy;
                        });
                    }

                    function getResize(
                        rotationAngle,
                        left,
                        top,
                        xResize,
                        yResize
                    ) {
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
                        let rotatedWDiff =
                            cosFraction * wDiff + sinFraction * hDiff;
                        let rotatedHDiff =
                            cosFraction * hDiff - sinFraction * wDiff;
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
                            if (newW < minWidth) {
                                newW = minWidth;
                            }
                        }
                        if (yResize) {
                            if (top) {
                                newH = initH - rotatedHDiff;
                            } else {
                                newH = initH + rotatedHDiff;
                            }
                            if (newH < minHeight) {
                                newH = minHeight;
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
            if (action === "rotating") {
                setElements((pre) => {
                    const preCopy = [...pre];
                    if (multipleElementSelected) {
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
                            const topLeft = rotate(
                                x,
                                y,
                                initCX,
                                initCY,
                                angle - offset
                            );
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
                            preCopy[index].rotationAngle =
                                angle - offset + rotationAngle;
                        });
                    } else {
                        const { x, y, width, height } =
                            preCopy[selectedElementIndexes[0]];

                        const cx = x + width / 2;
                        const cy = y + height / 2;

                        const offset = Math.atan2(
                            y - cy - 20 / scale,
                            x - cx + width / 2
                        );
                        const angle = Math.atan2(
                            mouseCoords.y - cy,
                            mouseCoords.x - cx
                        );
                        preCopy[selectedElementIndexes[0]].rotationAngle =
                            angle - offset;
                    }

                    return preCopy;
                });
            }

            let hovering = false;
            elements.forEach((element, index) => {
                const isHovered = isOntopOfElement(
                    mouseCoords.x,
                    mouseCoords.y,
                    element
                );

                if (!isHovered) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        preCopy[index].isHovered = false;
                        return preCopy;
                    });
                    return; // if cursor is not over element
                }

                hovering = true;
                setElements((pre) => {
                    const preCopy = [...pre];
                    preCopy[index].isHovered = true;
                    return preCopy;
                });
            });

            // Check if mouse is hovering inside any resize control
            let selectedControl = getTransformControl(mouseCoords);

            const multiDrag =
                elements.reduce(
                    (count, element) => (element.selected ? count + 1 : count),
                    0
                ) > 1
                    ? isOntopOfElement(mouseCoords.x, mouseCoords.y, {
                          x: transformControls[0].x,
                          y: transformControls[0].y,
                          width:
                              transformControls[1].x - transformControls[0].x,
                          height:
                              transformControls[3].y - transformControls[0].y,
                          rotationAngle: 0,
                      })
                    : false;
            setCursor(() => {
                switch (action) {
                    case "resizing":
                        return cursorType(selectedTransformControl);
                    case "panning":
                        return "cursor-grabbing";
                    default:
                        if (selectedControl !== -1) {
                            return cursorType(selectedControl);
                        } else if (hovering || multiDrag) {
                            return "cursor-move";
                        }
                        return "cursor-auto";
                }
            });
        }
        function handleMouseUp(event) {
            setAction("none");
        }
        function handleContextMenu(event) {
            event.preventDefault();
        }
        function getTransformControl(mouseCoords) {
            let selectedControl = transformControls.findIndex((control) => {
                const dx = mouseCoords.x - control.x;
                const dy = mouseCoords.y - control.y;
                return (
                    dx * dx + dy * dy <=
                    ((control.width / 2) * control.width) / 2
                );
            });
            return selectedControl;
        }
        function radToDeg(angle) {
            return (180 * angle) / Math.PI;
        }
        function degToRad(angle) {
            return (Math.PI / 180) * angle;
        }
        // Attach event listeners
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("wheel", handleWheel, { passive: false });
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("contextmenu", handleContextMenu);

        // Clean up event listeners on component unmount
        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [
        action,
        elements,
        dragStart,
        scale,
        transformControls,
        selectedTransformControl,
        initialTransform,
    ]);

    const multipleElementSelected =
        elements.reduce(
            (count, element) => (element.selected ? count + 1 : count),
            0
        ) > 1;

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

    //
    function handleUndo() {
        if (!undo.length) return;

        const prev = undo.pop();
        // setUndo([...undo, elements]);
        setElements([prev]);
    }
    useEffect(() => {
        if (pressedKeys.has("Control")) {
            if (pressedKeys.has("z") || pressedKeys.has("Z")) {
                handleUndo();
            }
        }
    }, [pressedKeys]);

    // Apply transformations to canvas context
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw background
        ctx.fillStyle = "#101010";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw rectangle around selected elements
        if (elements.length !== 0) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            // Iterate through each image to find the minimum and maximum coordinates
            for (let i = 0; i < elements.length; i++) {
                let image = elements[i];
                let bbox = getRotatedBoundingBox(image);
                minX = Math.min(minX, bbox.minX);
                minY = Math.min(minY, bbox.minY);
                maxX = Math.max(maxX, bbox.minX + bbox.width);
                maxY = Math.max(maxY, bbox.minY + bbox.height);
            }

            // Adjusting for panOffset and scale
            let adjustedX = minX * scale + panOffset.x;
            let adjustedY = minY * scale + panOffset.y;
            let adjustedWidth = (maxX - minX) * scale;
            let adjustedHeight = (maxY - minY) * scale;

            // Now you can draw the rectangle with adjusted values
            ctx.fillStyle = "#171717"; // for example, semi-transparent black
            ctx.fillRect(adjustedX, adjustedY, adjustedWidth, adjustedHeight);
        }

        ctx.save();
        // Apply transformations
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(scale, scale);

        updateCanvas();

        ctx.restore();
    }, [scale, panOffset, windowSize, elements, undo]);
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
        let minX = Math.min(
            topLeft[0],
            topRight[0],
            bottomLeft[0],
            bottomRight[0]
        );
        let minY = Math.min(
            topLeft[1],
            topRight[1],
            bottomLeft[1],
            bottomRight[1]
        );
        let maxX = Math.max(
            topLeft[0],
            topRight[0],
            bottomLeft[0],
            bottomRight[0]
        );
        let maxY = Math.max(
            topLeft[1],
            topRight[1],
            bottomLeft[1],
            bottomRight[1]
        );

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
    //
    function updateCanvas() {
        const canvas = canvasRef.current;
        /** @type {CanvasRenderingContext2D} */
        const ctx = canvas.getContext("2d");
        elements.forEach((element, index) => {
            let { x, y, width, height, image, rotationAngle } = element;

            const cx = (x * 2 + width) / 2;
            const cy = (y * 2 + height) / 2;

            // Rotate around center
            ctx.translate(cx, cy);
            ctx.rotate(rotationAngle);
            ctx.translate(-cx, -cy);

            // Draw image
            ctx.drawImage(
                image,
                x, // - image.naturalWidth / 2,
                y, // - image.naturalHeight / 2,
                width,
                height
            );
            // Draw outline and transform controls for single selected element
            if (element.selected && !multipleElementSelected) {
                // Draw line for rotate control
                ctx.strokeStyle = "#50C4FF";
                ctx.lineWidth = 1 / scale;
                ctx.beginPath();
                ctx.moveTo((x + (x + width)) / 2, y);
                ctx.lineTo((x + (x + width)) / 2, y - 20 / scale);
                ctx.stroke();

                // Draw outline
                ctx.strokeStyle = "#50C4FF";
                ctx.lineWidth = 1 / scale;
                ctx.strokeRect(x, y, width, height);

                const controlSize = 10 / scale;
                const controllers = [
                    {
                        x: x,
                        y: y,
                    }, // Top-left
                    {
                        x: x + width,
                        y: y + height,
                    }, // Bottom-right
                    {
                        x: x + width,
                        y: y,
                    }, // Top-right
                    {
                        x: x,
                        y: y + height,
                    }, // Bottom-left
                    {
                        x: x + width / 2,
                        y: y - 20 / scale,
                    }, // Rotate control
                ];
                // Draw controls
                ctx.fillStyle = "#50C4FF";
                controllers.forEach(({ x, y }) => {
                    // Draw circle with origin point in center and diameter of 10 / scale
                    ctx.beginPath();
                    ctx.arc(x, y, 10 / scale / 2, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill(); // Add fill to the circle
                });

                const topLeft = rotate(x, y, cx, cy, rotationAngle);
                const bottomRight = rotate(
                    x + width,
                    y + height,
                    cx,
                    cy,
                    rotationAngle
                );
                const topRight = rotate(x + width, y, cx, cy, rotationAngle);
                const bottomLeft = rotate(x, y + height, cx, cy, rotationAngle);

                // Set transform controls
                const controls = [
                    {
                        x: topLeft[0],
                        y: topLeft[1],
                        width: controlSize,
                        height: controlSize,
                    }, // Top-left
                    {
                        x: bottomRight[0],
                        y: bottomRight[1],
                        width: controlSize,
                        height: controlSize,
                    }, // Bottom-right
                    {
                        x: topRight[0],
                        y: topRight[1],
                        width: controlSize,
                        height: controlSize,
                    }, // Top-right
                    {
                        x: bottomLeft[0],
                        y: bottomLeft[1],
                        width: controlSize,
                        height: controlSize,
                    }, // Bottom-left
                    {
                        x: rotate(
                            x + width / 2,
                            y - 20 / scale,
                            cx,
                            cy,
                            rotationAngle
                        )[0],
                        y: rotate(
                            x + width / 2,
                            y - 20 / scale,
                            cx,
                            cy,
                            rotationAngle
                        )[1],
                        width: controlSize,
                        height: controlSize,
                    }, // Rotate control
                ];
                setTransformControls(() => controls);
            }

            // Reset transformations
            ctx.translate(cx, cy);
            ctx.rotate(-rotationAngle);
            ctx.translate(-cx, -cy);
        });

        // Draw outline and transform for multiple selected elements
        if (multipleElementSelected) {
            const selectedEls = elements.filter((element, index) =>
                element.selected ? element : null
            );
            if (selectedEls.length !== 0) {
                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;

                // Iterate through each image to find the minimum and maximum coordinates
                for (let i = 0; i < selectedEls.length; i++) {
                    let image = selectedEls[i];
                    let bbox = getRotatedBoundingBox(image);
                    minX = Math.min(minX, bbox.minX);
                    minY = Math.min(minY, bbox.minY);
                    maxX = Math.max(maxX, bbox.minX + bbox.width);
                    maxY = Math.max(maxY, bbox.minY + bbox.height);
                }

                // Adjusting for panOffset and scale
                let adjustedX = minX;
                let adjustedY = minY;
                let adjustedWidth = maxX - minX;
                let adjustedHeight = maxY - minY;

                // Draw outline
                ctx.strokeStyle = "#50C4FF";
                ctx.lineWidth = 1 / scale;
                ctx.strokeRect(
                    adjustedX,
                    adjustedY,
                    adjustedWidth,
                    adjustedHeight
                );

                let x = adjustedX,
                    y = adjustedY,
                    width = adjustedWidth,
                    height = adjustedHeight;
                const controlSize = 10 / scale;

                const controllers = [
                    {
                        x: x,
                        y: y,
                        width: controlSize,
                        height: controlSize,
                    }, // Top-left
                    {
                        x: x + width,
                        y: y + height,
                        width: controlSize,
                        height: controlSize,
                    }, // Bottom-right
                    {
                        x: x + width,
                        y: y,
                        width: controlSize,
                        height: controlSize,
                    }, // Top-right
                    {
                        x: x,
                        y: y + height,
                        width: controlSize,
                        height: controlSize,
                    }, // Bottom-left
                    {
                        x: x + width / 2,
                        y: y - 20 / scale,
                        width: controlSize,
                        height: controlSize,
                    }, // Rotate control
                ];
                setTransformControls(() => controllers);

                // Draw line for rotate control
                ctx.strokeStyle = "#50C4FF";
                ctx.lineWidth = 1 / scale;
                ctx.beginPath();
                ctx.moveTo((x + (x + width)) / 2, y);
                ctx.lineTo((x + (x + width)) / 2, y - 20 / scale);
                ctx.stroke();
                // Draw controls
                ctx.fillStyle = "#50C4FF";
                controllers.forEach(({ x, y }) => {
                    // Draw circle with origin point in center and diameter of 10 / scale
                    ctx.beginPath();
                    ctx.arc(x, y, 10 / scale / 2, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill(); // Add fill to the circle
                });
            }
        }

        // Draw dragselect highlight rect
        if (action === "dragselect") {
            ctx.strokeStyle = "#50C4FF";
            ctx.lineWidth = 0.5 / scale;

            // Draw translucent rect with less translucent outline
            ctx.fillStyle = "rgba(80, 196, 255, 0.15)";
            ctx.strokeStyle = "rgba(0, 169, 255, 1)";
            ctx.fillRect(
                initialTransform.x,
                initialTransform.y,
                initialTransform.width,
                initialTransform.height
            );
            ctx.strokeRect(
                initialTransform.x,
                initialTransform.y,
                initialTransform.width,
                initialTransform.height
            );
        }

        // Draw grid
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1 / scale;
        ctx.beginPath();
        ctx.moveTo(0, -5 / scale);
        ctx.lineTo(0, 5 / scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5 / scale, 0);
        ctx.lineTo(5 / scale, 0);
        ctx.stroke();
    }

    function createElement(newElement) {
        const elementsCopy = [...elements];
        elementsCopy[elements.length] = newElement;
        setElements(elementsCopy, true);
        setUndo([...undo, ...elementsCopy]);
    }
    function updateElement(id) {}

    function getMouseCoordinates(event) {
        const canvas = canvasRef.current;
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

    // Get midpoint of two points
    function calculateMidpoint(x1, y1, x2, y2) {
        var xMidpoint = (x1 + x2) / 2;
        var yMidpoint = (y1 + y2) / 2;
        return [xMidpoint, yMidpoint];
    }
    function rotate(x, y, cx, cy, angle) {
        return [
            (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
            (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
        ];
    }

    // SAMPLE ADD ELEMENT
    useEffect(() => {
        const newElement = new ImageElement(
            // "https://i.pinimg.com/564x/6d/be/cd/6dbecdc197af6b2a9278550bb31d4f8f.jpg",
            // https://i.pinimg.com/564x/2d/d2/ab/2dd2abaf2d73de92bd383a77bd9f5880.jpg,
            "https://i.pinimg.com/564x/40/cf/8f/40cf8ff8cf5d692f31439a71d6d69912.jpg",
            0,
            0
        );
        newElement.create();
        createElement(newElement);
    }, []);

    // Rerender when window resizes, disable default page zoom
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        const handleWheel = (event) => {
            event.preventDefault();
        };
        window.addEventListener("resize", handleResize);
        window.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="canvas"
            // width={window.innerWidth}
            // height={window.innerHeight}
            className={`fixed top-0 left-0 overflow-hidden ${cursor}`}
        ></canvas>
    );
}
