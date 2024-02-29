"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ImageElement from "@/app/(files)/file/classes/ImageElement";
import { usePressedKeys } from "@/app/(files)/file/hooks/customHooks";
import { cursorType } from "@/app/(files)/file/utilities/CursorUtils";
import { ZoomHandler } from "@/app/(files)/file/handlers/ZoomHandler";
import { MouseDownHandler } from "@/app/(files)/file/handlers/MouseDownHandler";
import {
    getMouseCoordinates,
    getTransformControl,
    isOntopOfElement,
    multipleElementSelected,
} from "@/app/(files)/file/utilities/CanvasUtils";
import { PanHandler } from "@/app/(files)/file/handlers/PanHandler";
import { DragSelectHandler } from "@/app/(files)/file/handlers/DragSelectHandler";
import { DragHandler } from "@/app/(files)/file/handlers/DragHandler";
import { ResizeHandler } from "@/app/(files)/file/handlers/ResizeHandler";
import { RotateHandler } from "@/app/(files)/file/handlers/RotateHandler";
import { updateCanvas } from "@/app/(files)/file/utilities/CanvasDrawing";
import useHistory, {
    AddCommand,
    DeleteCommand,
} from "@/app/(files)/file/hooks/useHistory";

export default function Canvas() {
    const canvasRef = useRef(null);
    const [panOffset, setPanOffset] = useState({ x: 200, y: 200 });
    const [scale, setScale] = useState(0.3);
    const [windowSize, setWindowSize] = useState(null);

    const [elements, setElements] = useState([]);
    const { executeCommand, undo, redo } = useHistory(elements, setElements);
    const [initialValues, setInitialValues] = useState([]);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialTransform, setInitialTransform] = useState({});
    const [cursor, setCursor] = useState("cursor-auto");
    const [transformControls, setTransformControls] = useState([]);
    const [selectedTransformControl, setSelectedTransformControl] =
        useState(-1);

    const [isLoaded, setIsLoaded] = useState(false);

    const [undo, setUndo] = useState([]);
    const [action, setAction] = useState("none");
    const pressedKeys = usePressedKeys();
    useEffect(() => {
        const canvas = canvasRef.current;
        const boundingRect = canvas.getBoundingClientRect();

        let selectedElementIndexes = elements
            .map((element, index) => (element.selected ? index : null))
            .filter((index) => index !== null);

        // Event listener for mouse wheel (zoom)
        function handleWheel(event) {
            ZoomHandler(event, boundingRect, scale, setScale, setPanOffset);
        }

        function handleMouseDown(event) {
            const mouseCoords = getMouseCoordinates(
                event,
                canvasRef.current,
                panOffset,
                scale
            );
            setInitialValues(elements);
            MouseDownHandler(
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
                setDragStart,
                pressedKeys,
                createElement,
                setInitialValues
            );
        }

        function handleMouseMove(event) {
            const mouseCoords = getMouseCoordinates(
                event,
                canvasRef.current,
                panOffset,
                scale
            );

            if (action === "panning") {
                PanHandler(event, setPanOffset);
            }
            if (action === "dragselect") {
                DragSelectHandler(
                    setInitialTransform,
                    setElements,
                    elements,
                    mouseCoords
                );
            }
            if (action === "dragging") {
                DragHandler(
                    elements,
                    setElements,
                    mouseCoords,
                    dragStart,
                    selectedElementIndexes
                );
            }
            if (action === "resizing") {
                ResizeHandler(
                    elements,
                    selectedTransformControl,
                    initialTransform,
                    setElements,
                    selectedElementIndexes,
                    mouseCoords
                );
            }
            if (action === "rotating") {
                RotateHandler(
                    elements,
                    setElements,
                    mouseCoords,
                    initialTransform,
                    selectedElementIndexes,
                    scale
                );
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
            let selectedControl = getTransformControl(
                mouseCoords,
                transformControls
            );

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
        initialValues,
    ]);

    // Apply transformations to canvas context
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        updateCanvas(
            canvas,
            elements,
            action,
            initialTransform,
            multipleElementSelected(elements),
            scale,
            setTransformControls,
            panOffset
        );
    }, [scale, panOffset, windowSize, elements]);

    useEffect(() => {
        if (pressedKeys.has("Control")) {
            if (pressedKeys.has("z") || pressedKeys.has("Z")) {
                undo();
            }
            if (pressedKeys.has("y") || pressedKeys.has("Y")) {
                redo();
            }
        }
        if (pressedKeys.has("Delete")) {
            const indexToDelete = elements
                .map((element) => {
                    return element.selected ? element.id : null;
                })
                .filter((id) => id !== null);

            if (indexToDelete.length === 0) return;
            const deleteCommand = new DeleteCommand(
                indexToDelete,
                elements,
                setElements
            );
            executeCommand(deleteCommand);
        }
    }, [pressedKeys]);

    const handleDragOver = (e) => {
        e.preventDefault();
    };
    function createElement(newElement) {
        const elementsCopy = [...elements];
        elementsCopy[elements.length] = newElement;
        const addCommand = new AddCommand(newElement, setElements);
        executeCommand(addCommand);
        setElements(elementsCopy, true);
    }
    const handleDrop = (e) => {
        e.preventDefault();
        const mouseCoords = getMouseCoordinates(
            e,
            canvasRef.current,
            panOffset,
            scale
        );

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                const image = new Image();
                image.src = imageData;
                image.onload = () => {
                    const newElement = new ImageElement(
                        imageData,
                        mouseCoords.x - image.width / 2,
                        mouseCoords.y - image.height / 2
                    );
                    newElement.create();
                    createElement(newElement);
                };
            };
            reader.readAsDataURL(file);
        } else {
            console.log("Please drop an image file.");
        }
    };

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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`fixed top-0 left-0 overflow-hidden ${cursor}`}
        ></canvas>
    );
}
