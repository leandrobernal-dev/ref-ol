import ImageElement from "@/app/app/file/classes/ImageElement";
import { createImageFile } from "@/app/app/actions/create";
import { AddCommand } from "@/app/app/file/hooks/useHistory";

export default function handleUpload(
    files,
    mouseX,
    mouseY,
    setAddLoaderOpen,
    setAddLoaderProgress,
    fileId,
    setElements,
    executeCommand
) {
    // return if at least one of the files exceeds over 500kb file size
    if (Array.from(files).some((file) => file.size > 500000)) {
        alert(
            "At least one of the file exceeds 500kb in size. Please upload a smaller file."
        );
        return;
    }
    if (Array.from(files).some((file) => !file.type.startsWith("image/"))) {
        alert(
            "At least one of the files is not an image type. Please upload only image files."
        );
        return;
    }

    setAddLoaderOpen(true);
    setAddLoaderProgress({ total: files.length, finished: 0 });

    const newElements = []; // Array to store new elements
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            const image = new Image();
            image.src = imageData;
            image.onload = async () => {
                const newElement = new ImageElement({
                    src: image.src,
                    x: mouseX - image.width / 2,
                    y: mouseY - image.height / 2,
                    selected: true,
                    key: file.name,
                });
                await newElement.create();
                newElements.push(newElement); // Add new element to the array

                // Check if all files have been processed
                if (newElements.length === files.length) {
                    const newAddedFiles = [];
                    // Create new file one by one
                    const packedElements = fitRectanglesIntoGrid(
                        newElements,
                        mouseX,
                        mouseY
                    ); // Pack elements into grid
                    for (const newElement of newElements) {
                        const newFile = await createImageFile(
                            JSON.stringify({ newElement, fileId })
                        );
                        newAddedFiles.push(JSON.parse(newFile));
                    }

                    const addCommand = new AddCommand(
                        packedElements.map((el, index) => ({
                            ...el,
                            id: newAddedFiles[index].id,
                        })),
                        setElements
                    );
                    executeCommand(addCommand);

                    setAddLoaderOpen(false);
                }
            };
        };
        reader.onloadend = () => {
            // Update loader progress
            setAddLoaderProgress((prev) => ({
                ...prev,
                finished: prev.finished + 1,
            }));
        };
        reader.readAsDataURL(file);
    }
}

function fitRectanglesIntoGrid(rectangles, mouseX, mouseY, gap = 10) {
    // Find the maximum dimensions of the rectangles
    let maxWidth = 0;
    let maxHeight = 0;
    for (const rectangle of rectangles) {
        if (rectangle.width > maxWidth) {
            maxWidth = rectangle.width;
        }
        if (rectangle.height > maxHeight) {
            maxHeight = rectangle.height;
        }
    }

    // Calculate the grid dimensions based on the maximum dimensions of the rectangles
    const gridWidth = Math.max(maxWidth, mouseX) + maxWidth + gap; // Add gap
    const gridHeight = Math.max(maxHeight, mouseY) + maxHeight + gap; // Add gap

    // Sort rectangles by decreasing height
    rectangles.sort((a, b) => b.height - a.height);

    let currentX = mouseX;
    let currentY = mouseY;
    let maxHeightInRow = 0;

    for (const rectangle of rectangles) {
        // Check if the current rectangle can fit in the remaining space of the row
        if (currentX + rectangle.width > gridWidth) {
            // Move to the next row
            currentX = mouseX;
            currentY += maxHeightInRow + gap; // Add gap
            maxHeightInRow = 0;
        }

        // Update the starting position of the rectangle
        rectangle.x = currentX;
        rectangle.y = currentY;

        // Update the max height in the row if necessary
        if (rectangle.height > maxHeightInRow) {
            maxHeightInRow = rectangle.height;
        }

        // Move to the next position in the row
        currentX += rectangle.width + gap; // Add gap
    }

    return rectangles;
}
