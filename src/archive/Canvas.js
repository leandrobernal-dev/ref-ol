"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs/bundled/rough.esm";
import getStroke from "perfect-freehand";

const generator = rough.generator();

const createElement = (id, x1, y1, x2, y2, type) => {
    switch (type) {
        case "line":
        case "rectangle":
            const roughElement =
                type === "line"
                    ? generator.line(x1, y1, x2, y2)
                    : generator.rectangle(x1, y1, x2 - x1, y2 - y1);
            return { id, x1, y1, x2, y2, type, roughElement };
        case "pencil":
            return { id, type, points: [{ x: x1, y: y1 }] };
        case "text":
            return { id, type, x1, y1, x2, y2, text: "" };
        default:
            throw new Error(`Type not recognised: ${type}`);
    }
};

const nearPoint = (x, y, x1, y1, name) => {
    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};

const onLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    return Math.abs(offset) < maxDistance ? "inside" : null;
};

const positionWithinElement = (x, y, element) => {
    const { type, x1, x2, y1, y2 } = element;
    switch (type) {
        case "line":
            const on = onLine(x1, y1, x2, y2, x, y);
            const start = nearPoint(x, y, x1, y1, "start");
            const end = nearPoint(x, y, x2, y2, "end");
            return start || end || on;
        case "rectangle":
            const topLeft = nearPoint(x, y, x1, y1, "tl");
            const topRight = nearPoint(x, y, x2, y1, "tr");
            const bottomLeft = nearPoint(x, y, x1, y2, "bl");
            const bottomRight = nearPoint(x, y, x2, y2, "br");
            const inside =
                x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
            return topLeft || topRight || bottomLeft || bottomRight || inside;
        case "pencil":
            const betweenAnyPoint = element.points.some((point, index) => {
                const nextPoint = element.points[index + 1];
                if (!nextPoint) return false;
                return (
                    onLine(
                        point.x,
                        point.y,
                        nextPoint.x,
                        nextPoint.y,
                        x,
                        y,
                        5
                    ) != null
                );
            });
            return betweenAnyPoint ? "inside" : null;
        case "text":
            return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
        default:
            throw new Error(`Type not recognised: ${type}`);
    }
};

const distance = (a, b) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const getElementAtPosition = (x, y, elements) => {
    return elements
        .map((element) => ({
            ...element,
            position: positionWithinElement(x, y, element),
        }))
        .find((element) => element.position !== null);
};

const adjustElementCoordinates = (element) => {
    const { type, x1, y1, x2, y2 } = element;
    if (type === "rectangle") {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    } else {
        if (x1 < x2 || (x1 === x2 && y1 < y2)) {
            return { x1, y1, x2, y2 };
        } else {
            return { x1: x2, y1: y2, x2: x1, y2: y1 };
        }
    }
};

const cursorForPosition = (position) => {
    switch (position) {
        case "tl":
        case "br":
        case "start":
        case "end":
            return "nwse-resize";
        case "tr":
        case "bl":
            return "nesw-resize";
        default:
            return "move";
    }
};

const resizedCoordinates = (clientX, clientY, position, coordinates) => {
    const { x1, y1, x2, y2 } = coordinates;
    switch (position) {
        case "tl":
        case "start":
            return { x1: clientX, y1: clientY, x2, y2 };
        case "tr":
            return { x1, y1: clientY, x2: clientX, y2 };
        case "bl":
            return { x1: clientX, y1, x2, y2: clientY };
        case "br":
        case "end":
            return { x1, y1, x2: clientX, y2: clientY };
        default:
            return null; //should not really get here...
    }
};

const useHistory = (initialState) => {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([initialState]);

    const setState = (action, overwrite = false) => {
        const newState =
            typeof action === "function" ? action(history[index]) : action;
        if (overwrite) {
            const historyCopy = [...history];
            historyCopy[index] = newState;
            setHistory(historyCopy);
        } else {
            const updatedState = [...history].slice(0, index + 1);
            setHistory([...updatedState, newState]);
            setIndex((prevState) => prevState + 1);
        }
    };

    const undo = () => index > 0 && setIndex((prevState) => prevState - 1);
    const redo = () =>
        index < history.length - 1 && setIndex((prevState) => prevState + 1);

    return [history[index], setState, undo, redo];
};

const getSvgPathFromStroke = (stroke) => {
    if (!stroke.length) return "";

    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
};

const drawElement = (roughCanvas, context, element) => {
    switch (element.type) {
        case "line":
        case "rectangle":
            roughCanvas.draw(element.roughElement);
            break;
        case "pencil":
            const stroke = getSvgPathFromStroke(getStroke(element.points));
            context.fill(new Path2D(stroke));
            break;
        case "text":
            context.textBaseline = "top";
            context.font = "24px sans-serif";
            context.fillText(element.text, element.x1, element.y1);
            break;
        default:
            throw new Error(`Type not recognised: ${element.type}`);
    }
};

const adjustmentRequired = (type) => ["line", "rectangle"].includes(type);

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

const Canvas = () => {
    const [elements, setElements, undo, redo] = useHistory([]);
    const [action, setAction] = useState("none");
    const [tool, setTool] = useState("rectangle");
    const [selectedElement, setSelectedElement] = useState(null);
    const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
    const [startPanMousePosition, setStartPanMousePosition] = React.useState({
        x: 0,
        y: 0,
    });
    const [scale, setScale] = useState(1);
    const [prevScale, setPrevScale] = useState(1);
    const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const textAreaRef = useRef();
    const pressedKeys = usePressedKeys();

    const [windowSize, setWindowSize] = useState(null);
    useLayoutEffect(() => {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");

        context.clearRect(0, 0, canvas.width, canvas.height);

        // const scaledWidth = canvas.width * scale;
        // const scaledHeight = canvas.height * scale;

        // const scaledOffsetX = (scaledWidth - canvas.width) / 2;
        // const scaledOffsetY = (scaledHeight - canvas.height) / 2;
        // const scaledOffsetX = mousePos.x * (1 - scale) - canvas.width / 2;
        // const scaledOffsetY = mousePos.y * (1 - scale) - canvas.height / 2;
        // const scaledOffsetX = (mousePos.x * (scale - 1)) / 2;
        // const scaledOffsetY = (mousePos.y * (scale - 1)) / 2;
        // const scaledOffsetX =
        //     (scaledWidth - canvas.width) / (canvas.width / mousePos.x);
        // const scaledOffsetY =
        //     (scaledHeight - canvas.height) / (canvas.height / mousePos.y);

        const scaleFactor = scale / prevScale;
        const scaledWidth = canvas.width * scaleFactor;
        const scaledHeight = canvas.height * scaleFactor;

        const scaledOffsetX =
            (scaledWidth - canvas.width) * (mousePos.x / canvas.width);
        const scaledOffsetY =
            (scaledHeight - canvas.height) * (mousePos.y / canvas.height);

        setScaleOffset({ x: scaledOffsetX, y: scaledOffsetY });

        context.save();
        context.scale(scaleFactor, scaleFactor);
        context.translate(
            -(panOffset.x * scale - scaledOffsetX),
            -(panOffset.y * scale - scaledOffsetY)
        );

        const image = new Image();
        image.src =
            "https://i.pinimg.com/564x/6d/be/cd/6dbecdc197af6b2a9278550bb31d4f8f.jpg";
        context.drawImage(image, 0, 0);

        // Draw the black square.
        context.fillStyle = "black";
        context.fillRect(0, 0, 100, 100);

        context.restore();
    }, [elements, action, selectedElement, panOffset, scale, windowSize]);

    useEffect(() => {
        window.addEventListener("resize", () =>
            setWindowSize({ x: window.innerWidth, y: window.innerHeight })
        );
    }, []);

    useEffect(() => {
        const undoRedoFunction = (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "z") {
                if (event.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        document.addEventListener("keydown", undoRedoFunction);
        return () => {
            document.removeEventListener("keydown", undoRedoFunction);
        };
    }, [undo, redo]);

    useEffect(() => {
        const handleWheel = (event) => {
            // Check if Ctrl key is pressed
            if (event.ctrlKey) {
                event.preventDefault(); // Prevent default zoom behavior
            }
        };

        // Add event listener for mouse wheel
        window.addEventListener("wheel", handleWheel, { passive: false });

        // Cleanup function to remove event listener
        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);

    useEffect(() => {
        const panOrZoomFunction = (event) => {
            const rect = document
                .getElementById("canvas")
                .getBoundingClientRect();
            setMousePos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            });
            if (pressedKeys.has("Meta") || pressedKeys.has("Control")) {
                onZoom(event.deltaY * -0.001);
            } else {
                if (pressedKeys.has("Shift")) {
                    // TODO: X axis scrolling
                } else
                    setPanOffset((prevState) => ({
                        x: prevState.x - event.deltaX,
                        y: prevState.y - event.deltaY,
                    }));
            }
        };

        document.addEventListener("wheel", panOrZoomFunction);
        return () => {
            document.removeEventListener("wheel", panOrZoomFunction);
        };
    }, [pressedKeys]);

    useEffect(() => {
        const textArea = textAreaRef.current;
        if (action === "writing") {
            setTimeout(() => {
                textArea.focus();
                textArea.value = selectedElement.text;
            }, 0);
        }
    }, [action, selectedElement]);

    const updateElement = (id, x1, y1, x2, y2, type, options) => {
        const elementsCopy = [...elements];

        switch (type) {
            case "line":
            case "rectangle":
                elementsCopy[id] = createElement(id, x1, y1, x2, y2, type);
                break;
            case "pencil":
                elementsCopy[id].points = [
                    ...elementsCopy[id].points,
                    { x: x2, y: y2 },
                ];
                break;
            case "text":
                const textWidth = document
                    .getElementById("canvas")
                    .getContext("2d")
                    .measureText(options.text).width;
                const textHeight = 24;
                elementsCopy[id] = {
                    ...createElement(
                        id,
                        x1,
                        y1,
                        x1 + textWidth,
                        y1 + textHeight,
                        type
                    ),
                    text: options.text,
                };
                break;
            default:
                throw new Error(`Type not recognised: ${type}`);
        }

        setElements(elementsCopy, true);
    };

    const getMouseCoordinates = (event) => {
        const clientX =
            (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
        const clientY =
            (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;
        return { clientX, clientY };
    };

    const handleMouseDown = (event) => {
        if (action === "writing") return;

        const { clientX, clientY } = getMouseCoordinates(event);

        if (event.button === 1 || pressedKeys.has(" ")) {
            setAction("panning");
            setStartPanMousePosition({ x: clientX, y: clientY });
            return;
        }

        if (tool === "selection") {
            const element = getElementAtPosition(clientX, clientY, elements);
            if (element) {
                if (element.type === "pencil") {
                    const xOffsets = element.points.map(
                        (point) => clientX - point.x
                    );
                    const yOffsets = element.points.map(
                        (point) => clientY - point.y
                    );
                    setSelectedElement({ ...element, xOffsets, yOffsets });
                } else {
                    const offsetX = clientX - element.x1;
                    const offsetY = clientY - element.y1;
                    setSelectedElement({ ...element, offsetX, offsetY });
                }
                setElements((prevState) => prevState);

                if (element.position === "inside") {
                    setAction("moving");
                } else {
                    setAction("resizing");
                }
            }
        } else {
            const id = elements.length;
            const element = createElement(
                id,
                clientX,
                clientY,
                clientX,
                clientY,
                tool
            );
            setElements((prevState) => [...prevState, element]);
            setSelectedElement(element);

            setAction(tool === "text" ? "writing" : "drawing");
        }
    };

    const handleMouseMove = (event) => {
        const { clientX, clientY } = getMouseCoordinates(event);

        if (action === "panning") {
            const deltaX = clientX - startPanMousePosition.x;
            const deltaY = clientY - startPanMousePosition.y;
            setPanOffset({
                x: panOffset.x + deltaX,
                y: panOffset.y + deltaY,
            });
            return;
        }

        if (tool === "selection") {
            const element = getElementAtPosition(clientX, clientY, elements);
            event.target.style.cursor = element
                ? cursorForPosition(element.position)
                : "default";
        }

        if (action === "drawing") {
            const index = elements.length - 1;
            const { x1, y1 } = elements[index];
            updateElement(index, x1, y1, clientX, clientY, tool);
        } else if (action === "moving") {
            if (selectedElement.type === "pencil") {
                const newPoints = selectedElement.points.map((_, index) => ({
                    x: clientX - selectedElement.xOffsets[index],
                    y: clientY - selectedElement.yOffsets[index],
                }));
                const elementsCopy = [...elements];
                elementsCopy[selectedElement.id] = {
                    ...elementsCopy[selectedElement.id],
                    points: newPoints,
                };
                setElements(elementsCopy, true);
            } else {
                const { id, x1, x2, y1, y2, type, offsetX, offsetY } =
                    selectedElement;
                const width = x2 - x1;
                const height = y2 - y1;
                const newX1 = clientX - offsetX;
                const newY1 = clientY - offsetY;
                const options =
                    type === "text" ? { text: selectedElement.text } : {};
                updateElement(
                    id,
                    newX1,
                    newY1,
                    newX1 + width,
                    newY1 + height,
                    type,
                    options
                );
            }
        } else if (action === "resizing") {
            const { id, type, position, ...coordinates } = selectedElement;
            const { x1, y1, x2, y2 } = resizedCoordinates(
                clientX,
                clientY,
                position,
                coordinates
            );
            updateElement(id, x1, y1, x2, y2, type);
        }
    };

    const handleMouseUp = (event) => {
        const { clientX, clientY } = getMouseCoordinates(event);
        if (selectedElement) {
            if (
                selectedElement.type === "text" &&
                clientX - selectedElement.offsetX === selectedElement.x1 &&
                clientY - selectedElement.offsetY === selectedElement.y1
            ) {
                setAction("writing");
                return;
            }

            const index = selectedElement.id;
            const { id, type } = elements[index];
            if (
                (action === "drawing" || action === "resizing") &&
                adjustmentRequired(type)
            ) {
                const { x1, y1, x2, y2 } = adjustElementCoordinates(
                    elements[index]
                );
                updateElement(id, x1, y1, x2, y2, type);
            }
        }

        if (action === "writing") return;

        setAction("none");
        setSelectedElement(null);
    };

    const onZoom = (delta) => {
        setPrevScale(scale);
        setScale((prevState) => Math.min(Math.max(prevState + delta, 0.1), 20));
    };

    return (
        <canvas
            id="canvas"
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ position: "absolute", zIndex: 1 }}
        >
            Canvas
        </canvas>
    );
};

export default Canvas;
