"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";

function Canvas5() {
    const canvasRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const boundingRect = canvas.getBoundingClientRect(); // Get canvas position

        // Event listener for mouse wheel (zoom)
        function handleWheel(event) {
            const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1; // Zoom in or out

            // Calculate mouse position relative to canvas
            const mouseX = event.clientX - boundingRect.left;
            const mouseY = event.clientY - boundingRect.top;

            // Calculate new position based on zoom origin
            setPosition((prevPosition) => ({
                x:
                    prevPosition.x -
                    (mouseX - prevPosition.x) * (scaleFactor - 1),
                y:
                    prevPosition.y -
                    (mouseY - prevPosition.y) * (scaleFactor - 1),
            }));

            // Update scale
            setScale((prevScale) => prevScale * scaleFactor);
        }

        // Event listener for mouse move (pan)
        function handleMouseMove(event) {
            if (event.buttons === 1) {
                // Left mouse button is down
                setPosition((prevPosition) => ({
                    x: prevPosition.x + event.movementX,
                    y: prevPosition.y + event.movementY,
                }));
            }
        }

        // Attach event listeners
        canvas.addEventListener("wheel", handleWheel);
        canvas.addEventListener("mousemove", handleMouseMove);

        // Clean up event listeners on component unmount
        return () => {
            canvas.removeEventListener("wheel", handleWheel);
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, []); // Empty dependency array means this effect runs only once

    // Apply transformations to canvas context
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reset transformation matrix before applying new transformations
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Apply transformations
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        redraw();
    }, [scale, position]);

    // Function to redraw canvas content with current state
    function redraw() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Draw the black square.
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 100, 100);
    }

    return (
        <canvas
            ref={canvasRef}
            id="canvas"
            width={window.innerWidth}
            height={window.innerHeight}
            className="fixed top-0 left-0 overflow-hidden"
        ></canvas>
    );
}

export default Canvas5;
