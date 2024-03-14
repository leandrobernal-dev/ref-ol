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

// Modified potpack package: https://github.com/mapbox/potpack/tree/main
export function fitRectanglesIntoGrid(boxes, mouseX, mouseY) {
    // calculate total box area and maximum box width
    let area = 0;
    let maxWidth = 0;

    for (const box of boxes) {
        area += box.width * box.height;
        maxWidth = Math.max(maxWidth, box.width);
    }

    // sort the boxes for insertion by height, descending
    boxes.sort((a, b) => b.height - a.height);

    // aim for a squarish resulting container,
    // slightly adjusted for sub-100% space utilization
    const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

    // start with a single empty space, unbounded at the bottom
    const spaces = [{ x: mouseX, y: mouseY, w: startWidth, h: Infinity }];

    let width = 0;
    let height = 0;

    for (const box of boxes) {
        // look through spaces backwards so that we check smaller spaces first
        for (let i = spaces.length - 1; i >= 0; i--) {
            const space = spaces[i];

            // look for empty spaces that can accommodate the current box
            if (box.width > space.w || box.height > space.h) continue;

            // found the space; add the box to its top-left corner
            // |-------|-------|
            // |  box  |       |
            // |_______|       |
            // |         space |
            // |_______________|
            box.x = space.x;
            box.y = space.y;

            height = Math.max(height, box.y + box.height);
            width = Math.max(width, box.x + box.width);

            if (box.width === space.w && box.height === space.h) {
                // space matches the box exactly; remove it
                const last = spaces.pop();
                if (i < spaces.length) spaces[i] = last;
            } else if (box.height === space.h) {
                // space matches the box height; update it accordingly
                // |-------|---------------|
                // |  box  | updated space |
                // |_______|_______________|
                space.x += box.width;
                space.w -= box.width;
            } else if (box.width === space.w) {
                // space matches the box width; update it accordingly
                // |---------------|
                // |      box      |
                // |_______________|
                // | updated space |
                // |_______________|
                space.y += box.height;
                space.h -= box.height;
            } else {
                // otherwise the box splits the space into two spaces
                // |-------|-----------|
                // |  box  | new space |
                // |_______|___________|
                // | updated space     |
                // |___________________|
                spaces.push({
                    x: space.x + box.width,
                    y: space.y,
                    w: space.w - box.width,
                    h: box.height,
                });
                space.y += box.height;
                space.h -= box.height;
            }
            break;
        }
    }
    return boxes;
}
