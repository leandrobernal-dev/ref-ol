const { minZoom, maxZoom } = require("@/app/(files)/file/config/config");

export function ZoomHandler(
    event,
    boundingRect,
    scale,
    setScale,
    setPanOffset
) {
    event.preventDefault();
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1; // Zoom in or out

    // Calculate mouse position relative to canvas
    const mouseX = event.clientX - boundingRect.left;
    const mouseY = event.clientY - boundingRect.top;

    // Calculate new scale based on zoom origin
    const newScale = scale * scaleFactor;

    // Check if new scale is within limits
    if (newScale >= minZoom && newScale <= maxZoom) {
        // Update scale and pan offset
        setScale(newScale);
        setPanOffset((prevPosition) => ({
            x: prevPosition.x - (mouseX - prevPosition.x) * (scaleFactor - 1),
            y: prevPosition.y - (mouseY - prevPosition.y) * (scaleFactor - 1),
        }));
    }
}
