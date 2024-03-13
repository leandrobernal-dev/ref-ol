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
    getRotatedBoundingBox,
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
import {
    AddCommand,
    MoveCommand,
    ResizeCommand,
    RotateCommand,
    SelectCommand,
} from "@/app/(files)/file/hooks/useHistory";
import KeyboardShortcuts from "@/app/(files)/file/utilities/Shortcuts";
import { FileContext } from "@/app/(files)/file/context/FileContext";
import { createImageFile } from "@/app/(files)/actions/create";

export default function Canvas({ setAddLoaderOpen, setAddLoaderProgress }) {
    const canvasRef = useRef(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [windowSize, setWindowSize] = useState(null);

    const { elements, setElements, executeCommand, undo, redo, fileId } =
        useContext(FileContext);
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

            let hovering =
                elements
                    .map((element, index) =>
                        isOntopOfElement(mouseCoords.x, mouseCoords.y, element)
                            ? element.id
                            : null
                    )
                    .filter((element) => element !== null).length > 0;

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
        function fitRectanglesIntoGrid(rectangles, mouseX, mouseY, gap = 10) {
            // Find the maximum dimensions of the rectangles
            let maxWidth = 0;
            let maxHeight = 0;
            for (const rectangle of rectangles) {
                if (rectangle.width > maxWidth) {
                    maxWidth = rectangle.width;
                }
                if (rectangle.height > maxHeight) {
                    maxHeight = rectangle.height;
                }
            }

            // Calculate the grid dimensions based on the maximum dimensions of the rectangles
            const gridWidth = Math.max(maxWidth, mouseX) + maxWidth + gap; // Add gap
            const gridHeight = Math.max(maxHeight, mouseY) + maxHeight + gap; // Add gap

            // Sort rectangles by decreasing height
            rectangles.sort((a, b) => b.height - a.height);

            let currentX = mouseX;
            let currentY = mouseY;
            let maxHeightInRow = 0;

            for (const rectangle of rectangles) {
                // Check if the current rectangle can fit in the remaining space of the row
                if (currentX + rectangle.width > gridWidth) {
                    // Move to the next row
                    currentX = mouseX;
                    currentY += maxHeightInRow + gap; // Add gap
                    maxHeightInRow = 0;
                }

                // Update the starting position of the rectangle
                rectangle.x = currentX;
                rectangle.y = currentY;

                // Update the max height in the row if necessary
                if (rectangle.height > maxHeightInRow) {
                    maxHeightInRow = rectangle.height;
                }

                // Move to the next position in the row
                currentX += rectangle.width + gap; // Add gap
            }

            return rectangles;
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
            // return if at least one of the files exceeds over 500kb file size
            if (Array.from(files).some((file) => file.size > 500000)) {
                alert(
                    "At least one of the file exceeds 500kb in size. Please upload a smaller file."
                );
                return;
            }
            if (
                Array.from(files).some(
                    (file) => !file.type.startsWith("image/")
                )
            ) {
                alert(
                    "At least one of the files is not an image type. Please upload only image files."
                );
                return;
            }

            setAddLoaderOpen(true);
            setAddLoaderProgress({ total: files.length, finished: 0 });

            const newElements = []; // Array to store new elements
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    const image = new Image();
                    image.src = imageData;
                    image.onload = async () => {
                        const newElement = new ImageElement({
                            src: image.src,
                            x: mouseCoords.x - image.width / 2,
                            y: mouseCoords.y - image.height / 2,
                            selected: true,
                            key: file.name,
                        });
                        await newElement.create();
                        newElements.push(newElement); // Add new element to the array

                        // Check if all files have been processed
                        if (newElements.length === files.length) {
                            const newAddedFiles = [];
                            // Create new file one by one
                            const packedElements = fitRectanglesIntoGrid(
                                newElements,
                                mouseCoords.x,
                                mouseCoords.y
                            ); // Pack elements into grid
                            for (const newElement of newElements) {
                                const newFile = await createImageFile(
                                    JSON.stringify({ newElement, fileId })
                                );
                                newAddedFiles.push(JSON.parse(newFile));
                            }

                            createElement(
                                packedElements.map((el, index) => ({
                                    ...el,
                                    id: newAddedFiles[index].id,
                                }))
                            );
                            setAddLoaderOpen(false);
                        }
                    };
                };
                reader.onloadend = () => {
                    // Update loader progress
                    setAddLoaderProgress((prev) => ({
                        ...prev,
                        finished: prev.finished + 1,
                    }));
                };
                reader.readAsDataURL(file);
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
        mouseCoords,
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

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }, [windowSize]);
    useEffect(() => {
        const canvas = canvasRef.current;
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
            let rectX = minX;
            let rectY = minY;
            let rectWidth = maxX - minX;
            let rectHeight = maxY - minY;

            // Calculate the maximum scale factor needed to fit the rectangle within the canvas
            const scaleX = canvas.width / rectWidth;
            const scaleY = canvas.height / rectHeight;
            const fitScale = Math.min(scaleX, scaleY);
            const margin = 0.7; // Adjust this value as needed
            let adjustedFitScale = fitScale * margin;

            // Calculate the center of the rectangle
            const rectCenterX = rectX + rectWidth / 2;
            const rectCenterY = rectY + rectHeight / 2;

            // Calculate the canvas center after applying the scale and panOffset
            const canvasCenterX = canvas.width / 2;
            const canvasCenterY = canvas.height / 2;

            // Calculate the translation needed to center the rectangle
            const translateX = canvasCenterX - rectCenterX * adjustedFitScale;
            const translateY = canvasCenterY - rectCenterY * adjustedFitScale;

            // Set the scale and panOffset
            setScale(adjustedFitScale);
            setPanOffset(() => ({
                x: translateX,
                y: translateY,
            }));
        } else {
            setScale(0.3);
            setPanOffset({ x: canvas.width / 2, y: canvas.height / 2 });
        }
    }, []);
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
            panOffset,
            mouseCoords
        );
    }, [scale, panOffset, elements, mouseCoords]);

    function createElement(newElements) {
        const addCommand = new AddCommand(newElements, setElements);
        executeCommand(addCommand);
    }

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
