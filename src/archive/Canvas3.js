"use client";
import React, {
    useEffect,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

const Canvas3 = () => {
    const canvasRef = useRef(null);

    // const [scale, setScale] = useState(1);
    const [windowSize, setWindowSize] = useState(null);
    const [scale, setScale] = useState(1);
    const [origin, setOrigin] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [mouse, setMouse] = useState({ mousex: 0, mousey: 0 });
    const zoomIntensity = 0.2;

    useEffect(() => {
        window.addEventListener("resize", () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        });
    }, []);

    useLayoutEffect(() => {
        const canvas = document.getElementById("canvas");
        let context = canvas.getContext("2d");

        // Clear screen to white.
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the black square.
        context.fillStyle = "black";
        context.fillRect(0, 0, 100, 100);
    }, [scale]);

    useEffect(() => {
        let context = canvasRef.current.getContext("2d");

        // Translate so the visible origin is at the context's origin.
        context.translate(origin.x, origin.y);

        // Compute the new visible origin. Originally the mouse is at a
        // distance mouse/scale from the corner, we want the point under
        // the mouse to remain in the same place after the zoom, but this
        // is at mouse/new_scale away from the corner. Therefore we need to
        // shift the origin (coordinates of the corner) to account for this.
        setOrigin((pre) => {
            const newOrigin = {
                x: pre - mouse.mousex / (scale * zoom) - mouse.mousex / scale,
                y: pre - mouse.mousey / (scale * zoom) - mouse.mousey / scale,
            };
            console.log(scale * zoom);
            return newOrigin;
        });
    }, [zoom]);
    useEffect(() => {
        // console.log(origin);
        const canvas = document.getElementById("canvas");
        let context = canvas.getContext("2d");

        // Scale it (centered around the origin due to the translate above).
        context.scale(zoom, zoom);
        // Offset the visible origin to it's proper position.
        context.translate(-origin.x, -origin.y);

        // Update scale and others.
        // scale *= zoom;
        setScale((pre) => pre * zoom);
    }, [origin]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const handleWheel = (event) => {
            event.preventDefault();
            // Get mouse offset.
            const mousex = event.clientX - canvas.offsetLeft;
            const mousey = event.clientY - canvas.offsetTop;
            setMouse({ mousex, mousey });
            // Normalize mouse wheel movement to +1 or -1 to avoid unusual jumps.
            const wheel = event.deltaY < 0 ? 1 : -1;

            // Compute zoom factor.
            const delta = wheel * -0.001;
            setZoom((prevState) =>
                Math.min(Math.max(prevState + wheel, 0.1), 20)
            );
        };
        document.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            document.removeEventListener("wheel", handleWheel);
        };
    }, []);

    return (
        <canvas
            id="canvas"
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
        ></canvas>
    );
};

export default Canvas3;
