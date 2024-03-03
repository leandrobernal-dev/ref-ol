"use client";

import {
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
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
    MoveCommand,
    ResizeCommand,
    RotateCommand,
    SelectCommand,
} from "@/app/(files)/file/hooks/useHistory";
import { FileDataContext } from "@/app/(files)/file/context/FileContext";
import KeyboardShortcuts from "@/app/(files)/file/utilities/Shortcuts";

export default function Canvas() {
    const canvasRef = useRef(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(0.3);
    const [windowSize, setWindowSize] = useState(null);

    // const [elements, setElements] = useState([]);
    const { elements, setElements } = useContext(FileDataContext);
    const { executeCommand, undo, redo } = useHistory();
    const [initialValues, setInitialValues] = useState([]);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
    const [initialTransform, setInitialTransform] = useState({});
    const [cursor, setCursor] = useState("cursor-auto");
    const [transformControls, setTransformControls] = useState([]);
    const [selectedTransformControl, setSelectedTransformControl] =
        useState(-1);

    const [action, setAction] = useState("none");
    const [prevAction, setPrevAction] = useState("none");
    const pressedKeys = usePressedKeys();

    // Main handler for mouse events
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
            setInitialValues(JSON.parse(JSON.stringify(elements)) || []);
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
                pressedKeys
            );
        }

        function handleMouseMove(event) {
            const mouseCoords = getMouseCoordinates(
                event,
                canvasRef.current,
                panOffset,
                scale
            );
            setMouseCoords(mouseCoords);

            if (action === "panning") {
                PanHandler(event, setPanOffset);
            }
            if (action === "dragselect") {
                DragSelectHandler(
                    setInitialTransform,
                    initialTransform,
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
        function handleDragOver(event) {
            event.preventDefault();
        }
        function handleDrop(event) {
            event.preventDefault();

            const mouseCoords = getMouseCoordinates(
                event,
                canvasRef.current,
                panOffset,
                scale
            );

            const files = event.dataTransfer.files;
            const newElements = []; // Array to store new elements
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
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
                                mouseCoords.y - image.height / 2,
                                true
                            );
                            newElement.create();
                            newElements.push(newElement); // Add new element to the array
                            if (newElements.length === files.length) {
                                // If all files processed, create elements
                                createElement(newElements);
                            }
                        };
                    };
                    reader.readAsDataURL(file);
                } else {
                    console.log("File dropped is not an image.");
                }
            }
        }

        // Attach event listeners
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("dragover", handleDragOver);
        canvas.addEventListener("drop", handleDrop);
        canvas.addEventListener("wheel", handleWheel, { passive: false });
        canvas.addEventListener("mousemove", handleMouseMove);

        // Clean up event listeners on component unmount
        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("dragover", handleDragOver);
            canvas.removeEventListener("drop", handleDrop);
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, [
        action,
        elements,
        dragStart,
        scale,
        transformControls,
        selectedTransformControl,
        initialTransform,
        panOffset,
    ]);

    // setting drag start
    useEffect(() => {
        const selectedEls = elements
            .map((element, index) =>
                element.selected ? { element, index } : null
            )
            .filter((element) => element !== null);
        // Set DragStart
        if (action !== "dragging") return;
        if (selectedEls.length === 1) {
            setDragStart(() => ({
                x: elements[selectedEls[0].index].x - mouseCoords.x,
                y: elements[selectedEls[0].index].y - mouseCoords.y,
            }));
        } else {
            setDragStart({
                x: elements.map((element, index) =>
                    element.selected ? element.x - mouseCoords.x : null
                ),
                y: elements.map((element, index) =>
                    element.selected ? element.y - mouseCoords.y : null
                ),
            });
        }
    }, [elements]);
    // Setting undo/redo
    useEffect(() => {
        setPrevAction(action); // Store previous action
        if (action !== "none") return; // If no action is being performed, return
        const selectedElements = elements
            .map((element, index) =>
                element.selected ? { id: element.id, index } : null
            )
            .filter((id) => id !== null);
        // If previous action was dragging, execute move command
        if (prevAction === "dragging") {
            const initialPositions = selectedElements.map((element) => ({
                id: element.id,
                x: initialValues[element.index].x,
                y: initialValues[element.index].y,
            }));
            const newPositions = selectedElements.map((element) => ({
                id: element.id,
                x: elements[element.index].x,
                y: elements[element.index].y,
            }));
            const deltaX = newPositions[0].x - initialPositions[0].x;
            const deltaY = newPositions[0].y - initialPositions[0].y;
            // Save to history if there was a change in position
            if (deltaX !== 0 && deltaY !== 0) {
                const moveCommand = new MoveCommand(
                    selectedElements.map((element) => element.id),
                    initialPositions,
                    newPositions,
                    setElements
                );
                executeCommand(moveCommand);
            } else {
                addSelectCommand();
            }
        }
        if (prevAction === "rotating") {
            const initialTransforms = selectedElements.map((element) => ({
                id: element.id,
                x: initialValues[element.index].x,
                y: initialValues[element.index].y,
                rotationAngle: initialValues[element.index].rotationAngle,
            }));
            const newTransforms = selectedElements.map((element) => ({
                id: element.id,
                rotationAngle: elements[element.index].rotationAngle,
                x: elements[element.index].x,
                y: elements[element.index].y,
            }));
            const deltaRotations =
                newTransforms[0].rotationAngle -
                initialTransforms[0].rotationAngle;
            // Save to history if there was a change in rotation
            if (deltaRotations.rotationAngle !== 0) {
                const rotationCommand = new RotateCommand(
                    selectedElements.map((element) => element.id),
                    initialTransforms,
                    newTransforms,
                    setElements
                );
                executeCommand(rotationCommand);
            }
        }
        if (prevAction === "resizing") {
            const initialTransforms = selectedElements.map((element) => ({
                id: element.id,
                x: initialValues[element.index].x,
                y: initialValues[element.index].y,
                width: initialValues[element.index].width,
                height: initialValues[element.index].height,
            }));
            const newTransforms = selectedElements.map((element) => ({
                id: element.id,
                x: elements[element.index].x,
                y: elements[element.index].y,
                width: elements[element.index].width,
                height: elements[element.index].height,
            }));
            const deltaWidth =
                newTransforms[0].width - initialTransforms[0].width;
            const deltaHeight =
                newTransforms[0].height - initialTransforms[0].height;
            // Save to history if there was a change in size
            if (deltaWidth !== 0 || deltaHeight !== 0) {
                const resizeCommand = new ResizeCommand(
                    selectedElements.map((element) => element.id),
                    initialTransforms,
                    newTransforms,
                    setElements
                );
                executeCommand(resizeCommand);
            }
        }
        if (prevAction === "dragselect") {
            addSelectCommand();
        }

        function addSelectCommand() {
            // if no change in position, add SelectCommand to history
            const initialSelections = initialValues.map((element) => ({
                id: element.id,
                selected: element.selected,
            }));
            const newSelections = elements.map((element) => ({
                id: element.id,
                selected: element.selected,
            }));
            // Check if there are changes in selection
            if (
                String(newSelections.map((el) => el.selected)) !==
                String(initialSelections.map((el) => el.selected))
            ) {
                const selectCommand = new SelectCommand(
                    initialSelections
                        .filter((element) => element.selected)
                        .map((element) => element.id),
                    newSelections
                        .filter((element) => element.selected)
                        .map((el) => el.id),
                    setElements
                );
                executeCommand(selectCommand);
            }
        }
    }, [action]);

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
    }, [scale, panOffset, windowSize, elements, mouseCoords]);

    function createElement(newElements) {
        const addCommand = new AddCommand(newElements, setElements);
        executeCommand(addCommand);
    }

    // Rerender when window resizes, disable default page zoom
    useEffect(() => {
        // Center canvas onload
        setPanOffset({
            x: canvasRef.current.width / 2,
            y: canvasRef.current.height / 2,
        });
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
        <>
            <canvas
                ref={canvasRef}
                id="canvas"
                className={`fixed top-0 left-0 overflow-hidden ${cursor}`}
            ></canvas>
            <KeyboardShortcuts
                elements={elements}
                setElements={setElements}
                executeCommand={executeCommand}
                undo={undo}
                redo={redo}
            />
        </>
    );
}
