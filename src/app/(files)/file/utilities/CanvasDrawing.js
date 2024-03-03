import {
    getRotatedBoundingBox,
    rotate,
} from "@/app/(files)/file/utilities/CanvasUtils";

// All drawing functions for the canvas are defined here
export function updateCanvas(
    canvas,
    elements,
    action,
    initialTransform,
    multipleElementSelected,
    scale,
    setTransformControls,
    panOffset
) {
    /** @type {CanvasRenderingContext2D} */
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw background
    ctx.fillStyle = "#101010";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw rectangle background around all elements
    if (elements.length !== 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // Iterate through each image to find the minimum and maximum coordinates
        for (let i = 0; i < elements.length; i++) {
            let image = elements[i];
            let bbox = getRotatedBoundingBox(image);
            minX = Math.min(minX, bbox.minX);
            minY = Math.min(minY, bbox.minY);
            maxX = Math.max(maxX, bbox.minX + bbox.width);
            maxY = Math.max(maxY, bbox.minY + bbox.height);
        }

        // Adjusting for panOffset and scale
        let adjustedX = minX * scale + panOffset.x;
        let adjustedY = minY * scale + panOffset.y;
        let adjustedWidth = (maxX - minX) * scale;
        let adjustedHeight = (maxY - minY) * scale;

        // Now you can draw the rectangle with adjusted values
        ctx.fillStyle = "#171717"; // for example, semi-transparent black
        ctx.fillRect(adjustedX, adjustedY, adjustedWidth, adjustedHeight);
    }

    ctx.save();
    // Apply transformations
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);

    // Draw elements
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
        // Draw outline and transform controls for single selected element
        if (element.selected && !multipleElementSelected) {
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

    // Draw outline and transform for multiple selected elements
    if (multipleElementSelected) {
        const selectedEls = elements.filter((element, index) =>
            element.selected ? element : null
        );
        if (selectedEls.length !== 0) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            // Iterate through each image to find the minimum and maximum coordinates
            for (let i = 0; i < selectedEls.length; i++) {
                let image = selectedEls[i];
                let bbox = getRotatedBoundingBox(image);
                minX = Math.min(minX, bbox.minX);
                minY = Math.min(minY, bbox.minY);
                maxX = Math.max(maxX, bbox.minX + bbox.width);
                maxY = Math.max(maxY, bbox.minY + bbox.height);
            }

            // Adjusting for panOffset and scale
            let adjustedX = minX;
            let adjustedY = minY;
            let adjustedWidth = maxX - minX;
            let adjustedHeight = maxY - minY;

            // Draw outline
            ctx.strokeStyle = "#50C4FF";
            ctx.lineWidth = 1 / scale;
            ctx.strokeRect(adjustedX, adjustedY, adjustedWidth, adjustedHeight);

            let x = adjustedX,
                y = adjustedY,
                width = adjustedWidth,
                height = adjustedHeight;
            const controlSize = 10 / scale;

            const controllers = [
                {
                    x: x,
                    y: y,
                    width: controlSize,
                    height: controlSize,
                }, // Top-left
                {
                    x: x + width,
                    y: y + height,
                    width: controlSize,
                    height: controlSize,
                }, // Bottom-right
                {
                    x: x + width,
                    y: y,
                    width: controlSize,
                    height: controlSize,
                }, // Top-right
                {
                    x: x,
                    y: y + height,
                    width: controlSize,
                    height: controlSize,
                }, // Bottom-left
                {
                    x: x + width / 2,
                    y: y - 20 / scale,
                    width: controlSize,
                    height: controlSize,
                }, // Rotate control
            ];
            setTransformControls(() => controllers);

            // Draw line for rotate control
            ctx.strokeStyle = "#50C4FF";
            ctx.lineWidth = 1 / scale;
            ctx.beginPath();
            ctx.moveTo((x + (x + width)) / 2, y);
            ctx.lineTo((x + (x + width)) / 2, y - 20 / scale);
            ctx.stroke();
            // Draw controls
            ctx.fillStyle = "#50C4FF";
            controllers.forEach(({ x, y }) => {
                // Draw circle with origin point in center and diameter of 10 / scale
                ctx.beginPath();
                ctx.arc(x, y, 10 / scale / 2, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.fill(); // Add fill to the circle
            });
        }
    }

    // Draw dragselect highlight rect
    if (action === "dragselect" && elements.length > 0) {
        ctx.strokeStyle = "#50C4FF";
        ctx.lineWidth = 0.5 / scale;

        // Draw translucent rect with less translucent outline
        ctx.fillStyle = "rgba(80, 196, 255, 0.15)";
        ctx.strokeStyle = "rgba(0, 169, 255, 1)";
        ctx.fillRect(
            initialTransform.x,
            initialTransform.y,
            initialTransform.width,
            initialTransform.height
        );
        ctx.strokeRect(
            initialTransform.x,
            initialTransform.y,
            initialTransform.width,
            initialTransform.height
        );
    }

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

    ctx.restore();
}
