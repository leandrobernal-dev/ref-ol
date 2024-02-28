export function PanHandler(event, setPanOffset) {
    setPanOffset((prevPanOffset) => ({
        x: prevPanOffset.x + event.movementX,
        y: prevPanOffset.y + event.movementY,
    }));
}
