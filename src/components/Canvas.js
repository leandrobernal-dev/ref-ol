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
        case 4:
            return "cursor-nesw-resize";
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
    const [selectedElement, setSelectedElement] = useState(null); // Selected Element index
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cursor, setCursor] = useState("cursor-auto");
    const [transformControls, setTransformControls] = useState([]);
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
                let selectedControl = getTransformControl(mouseCoords);
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
                setTransformControls((pre) =>
                    selectedControl !== -1 ? pre : []
                );

                if (selectedControl !== -1) {
                    if (selectedControl === 4) {
                        setAction("rotating");
                        return;
                    }

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
                // MAINTAIN ASPECT RATIO WHILE RESIZING REFERENCE:  https://www.sitepoint.com/community/t/maintain-aspect-ratio-while-resizing/406455/7
                if (selectedResizeControl === 0) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        const { x, y, width, height } =
                            preCopy[selectedElement];

                        const aspectRatio = width / height;
                        const useHeight = mouseCoords.y > y;
                        let newWidth, newHeight, newX, newY;

                        if (useHeight) {
                            newWidth = width - (mouseCoords.x - x);
                            newHeight = newWidth / aspectRatio;
                            newX = mouseCoords.x;
                            newY = y + height - newHeight;
                        } else {
                            newHeight = height - (mouseCoords.y - y);
                            newWidth = newHeight * aspectRatio;
                            newX = x + width - newWidth;
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
                        const { x, y, width, height } =
                            preCopy[selectedElement];

                        const aspectRatio = width / height;
                        const useWidth = mouseCoords.x < x + width;
                        const newHeight = useWidth
                            ? mouseCoords.y - y
                            : (mouseCoords.x - x) / aspectRatio;
                        const newWidth = useWidth
                            ? (mouseCoords.y - y) * aspectRatio
                            : mouseCoords.x - x;
                        preCopy[selectedElement].width = newWidth;
                        preCopy[selectedElement].height = newHeight;
                        return preCopy;
                    });
                } else if (selectedResizeControl === 2) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        const { x, y, width, height } =
                            preCopy[selectedElement];

                        const aspectRatio = width / height;
                        const useWidth = mouseCoords.x < x + width;
                        let newHeight, newWidth;
                        if (useWidth) {
                            newHeight = height - (mouseCoords.y - y);
                            newWidth = newHeight * aspectRatio;
                        } else {
                            newWidth = mouseCoords.x - x;
                            newHeight = newWidth / aspectRatio;
                        }
                        const newY = y + (height - newHeight);

                        preCopy[selectedElement].y = newY;
                        preCopy[selectedElement].width = newWidth;
                        preCopy[selectedElement].height = newHeight;
                        return preCopy;
                    });
                } else if (selectedResizeControl === 3) {
                    setElements((pre) => {
                        const preCopy = [...pre];
                        const { x, y, width, height } =
                            preCopy[selectedElement];
                        const aspectRatio = width / height;

                        const useWidth = mouseCoords.y < y + height;
                        let newHeight, newWidth;

                        if (useWidth) {
                            newWidth = width - (mouseCoords.x - x);
                            newHeight = newWidth / aspectRatio;
                        } else {
                            newHeight = mouseCoords.y - y;
                            newWidth = newHeight * aspectRatio;
                        }
                        const newX = x + (width - newWidth);
                        preCopy[selectedElement].x = newX;
                        preCopy[selectedElement].width = newWidth;
                        preCopy[selectedElement].height = newHeight;
                        return preCopy;
                    });
                }
            }
            if (action === "rotating") {
                // setElements((pre) => {
                //     const preCopy = [...pre];
                //     const { x, y, width, height, rotationAngle } = preCopy[0];
                //     const bottomRightX = x + width * scale;
                //     const bottomRightY = y + height * scale;

                //     const cx = x + (width * scale) / 2;
                //     const cy = y + (height * scale) / 2;
                //     console.log(bottomRightX, bottomRightY);

                //     const rotatedA = rotate(x, y, cx, cy);
                //     const newCenter = [
                //         (rotatedA[0] + bottomRightX) / 2,
                //         (rotatedA[1] + bottomRightY) / 2,
                //     ];
                //     const newTopLeft = rotate(
                //         rotatedA[0],
                //         rotatedA[1],
                //         newCenter[0],
                //         newCenter[1],
                //         -rotationAngle
                //     );
                //     const newBottomRight = rotate(
                //         bottomRightX,
                //         bottomRightY,
                //         newCenter[0],
                //         newCenter[1],
                //         -rotationAngle
                //     );

                //     preCopy[0].x = newTopLeft[0];
                //     preCopy[0].y = newTopLeft[1];
                //     preCopy[0].width = newBottomRight[0] - newTopLeft[0];
                //     preCopy[0].height = newBottomRight[1] - newTopLeft[1];

                //     return preCopy;
                // });
                setElements((pre) => {
                    const preCopy = [...pre];
                    const { x, y, width, height, rotationAngle } =
                        preCopy[selectedElement];
                    const cx = x + width / 2;
                    const cy = y + height / 2;

                    const a1 = Math.atan2(
                        y - cy - 20 / scale,
                        x - cx + width / 2
                    );
                    const angle = Math.atan2(
                        mouseCoords.y - cy,
                        mouseCoords.x - cx
                    );
                    preCopy[selectedElement].rotationAngle = angle - a1;
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
        transformControls,
        selectedResizeControl,
    ]);

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

            // Draw outline and transform controls
            if (index === selectedElement) {
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

    //
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
