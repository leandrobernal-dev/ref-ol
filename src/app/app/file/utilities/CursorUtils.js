export const cursorType = (controller) => {
    switch (controller) {
        case 0:
        case 1:
            return "cursor-nwse-resize";
        case 2:
        case 3:
            return "cursor-nesw-resize";
        case 4:
            return "cursor-crosshair";
            return "cursor-rotate";
        default:
            return "cursor-auto";
    }
};
