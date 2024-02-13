"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

const Canvas2 = () => {
    const [windowSize, setWindowSize] = useState(null);

    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const [panning, setPanning] = useState(false);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

    useLayoutEffect(() => {
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();

        const image = new Image();
        image.src =
            "https://i.pinimg.com/564x/6d/be/cd/6dbecdc197af6b2a9278550bb31d4f8f.jpg";
        context.drawImage(image, 0, 0);

        context.restore();
    }, [windowSize]);

    useEffect(() => {
        window.addEventListener("resize", () =>
            setWindowSize({ x: window.innerWidth, y: window.innerHeight })
        );
    }, []);

    useEffect(() => {
        const handleWheel = (event) => {
            event.preventDefault();

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const delta = event.deltaY;

            // Calculate zoom factor
            const scaleFactor = 0.1;
            const zoomFactor = delta > 0 ? 1 - scaleFactor : 1 + scaleFactor;

            // Adjust zoom level
            const newZoom = zoom * zoomFactor;
            setZoom(newZoom);

            // Adjust canvas origin
            ctx.translate(mouseX, mouseY);
            ctx.scale(zoomFactor, zoomFactor);
            ctx.translate(-mouseX, -mouseY);

            // Clear canvas and redraw content
            // (This part depends on your specific canvas content)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const image = new Image();
            image.src =
                "https://i.pinimg.com/564x/6d/be/cd/6dbecdc197af6b2a9278550bb31d4f8f.jpg";
            ctx.drawImage(image, 0, 0);
        };

        // Add event listener for mouse wheel
        window.addEventListener("wheel", handleWheel, { passive: false });

        // Cleanup function to remove event listener
        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, []);

    const handleMouseDown = (event) => {
        setPanning(true);
        setLastMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event) => {
        if (panning) {
            const deltaX = event.clientX - lastMousePosition.x;
            const deltaY = event.clientY - lastMousePosition.y;
            setPanPosition({
                x: panPosition.x + deltaX,
                y: panPosition.y + deltaY,
            });
            setLastMousePosition({ x: event.clientX, y: event.clientY });
        }
    };

    const handleMouseUp = (event) => {
        setPanning(false);
    };

    return (
        <canvas
            id="canvas"
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="fixed top-0 left-0 right-0 bottom-0"
            style={{ position: "fixed", zIndex: 1 }}
        ></canvas>
    );
};

export default Canvas2;
