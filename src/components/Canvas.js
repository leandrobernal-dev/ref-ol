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
    }

    create() {
        this.image = new Image();
        this.image.src = this.src;
        this.width = this.image.naturalWidth;
        this.height = this.image.naturalHeight;
    }
}

export default function Canvas() {
    const canvasRef = useRef(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [windowSize, setWindowSize] = useState(null);

    const [elements, setElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null); // Selected Element index
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cursor, setCursor] = useState("cursor-auto");

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

            // Calculate new position based on zoom origin
            setPanOffset((prevPosition) => ({
                x:
                    prevPosition.x -
                    (mouseX - prevPosition.x) * (scaleFactor - 1),
                y:
                    prevPosition.y -
                    (mouseY - prevPosition.y) * (scaleFactor - 1),
            }));

            setScale((prevScale) => prevScale * scaleFactor);
        }

        function handleMouseDown(event) {
            event.preventDefault();

            // if middle mouse / panning
            if (event.button === 1) {
                setAction("panning");
            }

            // if mouse is over elements
            if (event.button === 0) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                // Get all the element's indexes that are hovered
                const hoveredElements = elements
                    .map((element, index) => (element.isHovered ? index : null))
                    .filter((element) => element !== null);
                // Get the last index of the hovered elements
                const hoveredElementIndex =
                    hoveredElements[hoveredElements.length - 1];

                setSelectedElement(
                    hoveredElements.length > 0 ? elements.length - 1 : null
                );

                if (
                    hoveredElementIndex < 0 ||
                    hoveredElementIndex === undefined
                )
                    return; // return if clicked on empty canvas

                // Move selected element to last to render on top
                setElements((pre) => {
                    const preCopy = [...pre];
                    const movedElement = preCopy.splice(
                        hoveredElementIndex,
                        1
                    )[0];
                    preCopy.push(movedElement);
                    return preCopy;
                });

                // Set DragStart to hovered/selected Element
                setDragStart({
                    x: elements[hoveredElementIndex].x * scale - mouseX,
                    y: elements[hoveredElementIndex].y * scale - mouseY,
                });

                setAction("dragging");
            }

            // SAMPLE ADD IMAGE ELEMENT
            if (event.button === 2) {
                const mouseCoord = getMouseCoordinates(event);
                const newElement = new ImageElement(
                    "https://i.pinimg.com/564x/90/e2/2e/90e22eb27604c0064e86ce5478b9fa8c.jpg",
                    mouseCoord.x,
                    mouseCoord.y
                );
                newElement.create();
                updateElement(newElement);
            }
        }

        function handleMouseMove(event) {
            if (action === "panning") {
                setPanOffset((prevPanOffset) => ({
                    x: prevPanOffset.x + event.movementX,
                    y: prevPanOffset.y + event.movementY,
                }));
            }

            if (action === "dragging") {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const mouseX = (event.clientX - rect.left) * scaleX;
                const mouseY = (event.clientY - rect.top) * scaleY;

                setElements((pre) => {
                    const preCopy = [...pre];
                    preCopy[preCopy.length - 1].x =
                        (mouseX + dragStart.x) / scale;
                    preCopy[preCopy.length - 1].y =
                        (mouseY + dragStart.y) / scale;

                    return preCopy;
                });
            }

            let hovering = false;

            const mouseCoords = getMouseCoordinates(event);
            elements.forEach((element, index) => {
                const isHovered = isHovering(
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
            setCursor(hovering ? "cursor-move" : "cursor-auto");
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
    }, [action, elements, dragStart, scale, selectedElement]);

    function isHovering(x, y, element) {
        const x1 = element.x;
        const y1 = element.y;
        const x2 = element.x + element.width;
        const y2 = element.y + element.height;
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
            return true;
        }

        return false;
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

    // Rerender when window resizes, disable default page zoom
    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
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

    // Apply transformations to canvas context
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw background
        ctx.fillStyle = "#0D0D0D";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // ctx.setTransform(scale, 0, 0, scale, panOffset.x, panOffset.y);
        // Apply transformations
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(scale, scale);

        updateCanvas();

        ctx.restore();
    }, [scale, panOffset, windowSize, elements, selectedElement, undo]);

    //
    function updateCanvas() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        elements.forEach((element, index) => {
            if (index === selectedElement) {
                ctx.fillStyle = "blue";
                ctx.fillRect(
                    element.x - 1 / scale,
                    element.y - 1 / scale,
                    element.width + 2 / scale,
                    element.height + 2 / scale
                );
            }
            ctx.drawImage(
                element.image,
                element.x, // - image.naturalWidth / 2,
                element.y, // - image.naturalHeight / 2,
                element.width,
                element.height
            );
        });

        ctx.fillStyle = "red";
        ctx.fillRect(0, 0, 100, 100);
    }

    function updateElement(newElement) {
        const elementsCopy = [...elements];
        elementsCopy[elements.length] = newElement;
        setElements(elementsCopy, true);
        setUndo([...undo, ...elementsCopy]);
    }

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

    // SAMPLE ADD ELEMENT
    useEffect(() => {
        const newElement = new ImageElement(
            "https://i.pinimg.com/564x/6d/be/cd/6dbecdc197af6b2a9278550bb31d4f8f.jpg",
            0,
            0
        );
        newElement.create();
        updateElement(newElement);
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
