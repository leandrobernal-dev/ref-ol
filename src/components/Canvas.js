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
const cursorType = (position) => {
    switch (position) {
        case 0:
        case 1:
            return "cursor-nwse-resize";
        case 2:
        case 3:
            return "cursor-nesw-resize";
        default:
            return "cursor-auto";
    }
};

export default function Canvas() {
    const canvasRef = useRef(null);
    const [panOffset, setPanOffset] = useState({ x: 300, y: 300 });
    const [scale, setScale] = useState(1);
    const [windowSize, setWindowSize] = useState(null);

    const [elements, setElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null); // Selected Element index
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cursor, setCursor] = useState("cursor-auto");
    const [resizeControls, setResizeControls] = useState([]);
    const [selectedResizeControl, setSelectedResizeControl] = useState(-1);

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

                // Get clicked resize control
                let selectedControl = resizeControls.findIndex(function (
                    control
                ) {
                    return (
                        mouseCoords.x >= control.x &&
                        mouseCoords.x <= control.x + control.width &&
                        mouseCoords.y >= control.y &&
                        mouseCoords.y <= control.y + control.height
                    );
                });
                setSelectedResizeControl(selectedControl);

                // Get all the element's indexes that are hovered
                const hoveredElements = elements
                    .map((element, index) => (element.isHovered ? index : null))
                    .filter((element) => element !== null);
                // Get the last index of the hovered elements
                const hoveredElementIndex =
                    hoveredElements[hoveredElements.length - 1];
                const selectedElementIndex =
                    hoveredElements.length > 0 ? elements.length - 1 : null;

                setSelectedElement((pre) =>
                    selectedControl !== -1 ? pre : selectedElementIndex
                );
                setResizeControls((pre) => (selectedControl !== -1 ? pre : []));

                if (selectedControl !== -1) {
                    setAction("resizing");
                }
                if (
                    hoveredElementIndex > 0 ||
                    hoveredElementIndex !== undefined
                ) {
                    if (selectedControl === -1) {
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

                        // if a resize control is selected, cancel drag | Prioritize resize action & cursor3
                        setAction("dragging");
                    }
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

        function handleMouseMove(event) {
            const mouseCoords = getMouseCoordinates(event);

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

            if (action === "resizing") {
                if (selectedResizeControl === 0) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        const aspectRatio =
                            preCopy[selectedElement].width /
                            preCopy[selectedElement].height;
                        const useWidth =
                            mouseCoords.x < preCopy[selectedElement].x;
                        const useHeight =
                            mouseCoords.y > preCopy[selectedElement].y;
                        let newWidth, newHeight, newX, newY;

                        if (useHeight) {
                            newWidth =
                                preCopy[selectedElement].width -
                                (mouseCoords.x - preCopy[selectedElement].x);
                            newHeight = newWidth / aspectRatio;
                            newX = mouseCoords.x;
                            newY =
                                preCopy[selectedElement].y +
                                preCopy[selectedElement].height -
                                newHeight;
                        } else {
                            newHeight =
                                preCopy[selectedElement].height -
                                (mouseCoords.y - preCopy[selectedElement].y);
                            newWidth = newHeight * aspectRatio;
                            newX =
                                preCopy[selectedElement].x +
                                preCopy[selectedElement].width -
                                newWidth;
                            newY = mouseCoords.y;
                        }
                        preCopy[selectedElement].width = newWidth;
                        preCopy[selectedElement].height = newHeight;
                        preCopy[selectedElement].x = newX;
                        preCopy[selectedElement].y = newY;
                        return preCopy;
                    });
                } else if (selectedResizeControl === 1) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        const aspectRatio =
                            preCopy[selectedElement].width /
                            preCopy[selectedElement].height;
                        // MAINTAIN ASPECT RATIO WHILE RESIZING REFERENCE:  https://www.sitepoint.com/community/t/maintain-aspect-ratio-while-resizing/406455/7
                        const useWidth =
                            mouseCoords.x <
                            preCopy[selectedElement].x +
                                preCopy[selectedElement].width;
                        const newHeight = useWidth
                            ? mouseCoords.y - preCopy[selectedElement].y
                            : (mouseCoords.x - preCopy[selectedElement].x) /
                              aspectRatio;
                        const newWidth = useWidth
                            ? (mouseCoords.y - preCopy[selectedElement].y) *
                              aspectRatio
                            : mouseCoords.x - preCopy[selectedElement].x;
                        preCopy[selectedElement].width = newWidth;
                        preCopy[selectedElement].height = newHeight;
                        return preCopy;
                    });
                } else if (selectedResizeControl === 2) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        const aspectRatio =
                            preCopy[selectedElement].width /
                            preCopy[selectedElement].height;
                        const useWidth =
                            mouseCoords.x <
                            preCopy[selectedElement].x +
                                preCopy[selectedElement].width;
                        let newHeight, newWidth;
                        if (useWidth) {
                            newHeight =
                                preCopy[selectedElement].height -
                                (mouseCoords.y - preCopy[selectedElement].y);
                            newWidth = newHeight * aspectRatio;
                        } else {
                            newWidth =
                                mouseCoords.x - preCopy[selectedElement].x;
                            newHeight = newWidth / aspectRatio;
                        }
                        const newY =
                            preCopy[selectedElement].y +
                            (preCopy[selectedElement].height - newHeight);
                        preCopy[selectedElement].y = newY;
                        preCopy[selectedElement].width = newWidth;
                        preCopy[selectedElement].height = newHeight;
                        return preCopy;
                    });
                } else if (selectedResizeControl === 3) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        const aspectRatio =
                            preCopy[selectedElement].width /
                            preCopy[selectedElement].height;
                        const useWidth =
                            mouseCoords.y <
                            preCopy[selectedElement].y +
                                preCopy[selectedElement].height;
                        let newHeight, newWidth;
                        if (useWidth) {
                            newWidth =
                                preCopy[selectedElement].width -
                                (mouseCoords.x - preCopy[selectedElement].x);
                            newHeight = newWidth / aspectRatio;
                        } else {
                            newHeight =
                                mouseCoords.y - preCopy[selectedElement].y;
                            newWidth = newHeight * aspectRatio;
                        }
                        const newX =
                            preCopy[selectedElement].x +
                            (preCopy[selectedElement].width - newWidth);
                        preCopy[selectedElement].x = newX;
                        preCopy[selectedElement].width = newWidth;
                        preCopy[selectedElement].height = newHeight;
                        return preCopy;
                    });
                }
            }

            let hovering = false;
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

            // Check if mouse is hovering inside any resize control
            let selectedControl = resizeControls.findIndex(function (control) {
                return (
                    mouseCoords.x >= control.x &&
                    mouseCoords.x <= control.x + control.width &&
                    mouseCoords.y >= control.y &&
                    mouseCoords.y <= control.y + control.height
                );
            });

            setCursor(() => {
                switch (action) {
                    case "resizing":
                        return cursorType(selectedResizeControl);
                    case "panning":
                        return "cursor-grabbing";
                    default:
                        if (selectedControl !== -1) {
                            return cursorType(selectedControl);
                        } else if (hovering) {
                            return "cursor-move";
                        }
                        return "cursor-grab";
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
        selectedElement,
        resizeControls,
        selectedResizeControl,
    ]);

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

    // Apply transformations to canvas context
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
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
            const { x, y, width, height, image } = element;

            ctx.drawImage(
                image,
                x, // - image.naturalWidth / 2,
                y, // - image.naturalHeight / 2,
                width,
                height
            );

            if (index === selectedElement) {
                // Draw outline
                ctx.strokeStyle = "#50C4FF";
                ctx.lineWidth = 1 / scale;
                ctx.strokeRect(x, y, width, height);
                const controlSize = 10 / scale;

                const controls = [
                    {
                        x: x - controlSize / 2,
                        y: y - controlSize / 2,
                        width: controlSize,
                        height: controlSize,
                    }, // Top-left
                    {
                        x: x + width - controlSize / 2,
                        y: y + height - controlSize / 2,
                        width: controlSize,
                        height: controlSize,
                    }, // Bottom-right
                    {
                        x: x + width - controlSize / 2,
                        y: y - controlSize / 2,
                        width: controlSize,
                        height: controlSize,
                    }, // Top-right
                    {
                        x: x - controlSize / 2,
                        y: y + height - controlSize / 2,
                        width: controlSize,
                        height: controlSize,
                    }, // Bottom-left
                ];
                setResizeControls(() => controls);

                // Draw controls
                ctx.fillStyle = "#50C4FF";
                controls.forEach((control) => {
                    ctx.fillRect(
                        control.x,
                        control.y,
                        control.width,
                        control.height
                    );
                });
            }
        });

        // ctx.fillStyle = "red";
        // ctx.fillRect(0, 0, 100, 100);
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

    // SAMPLE ADD ELEMENT
    useEffect(() => {
        const newElement = new ImageElement(
            "https://i.pinimg.com/564x/6d/be/cd/6dbecdc197af6b2a9278550bb31d4f8f.jpg",
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
