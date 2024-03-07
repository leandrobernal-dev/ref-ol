"use client";
import ImageElement from "@/app/(files)/file/classes/ImageElement";
import useHistory, {
    AddCommand,
    SelectCommand,
} from "@/app/(files)/file/hooks/useHistory";
import { createContext, useEffect, useState } from "react";

export const FileContext = createContext();

export default function FileContextProvider({ children, images, fileId }) {
    const [updatedElements, setUpdatedelements] = useState([]);
    const [elements, setElements] = useState([]);
    const [progress, setProgress] = useState({
        total: images.length,
        finished: 0,
    });
    const { executeCommand, undo, redo, history, currentIndex } = useHistory();

    useEffect(() => {
        const historyWithoutSelect = history.filter(
            (command) =>
                !(command instanceof SelectCommand) ||
                !(command instanceof AddCommand)
        );

        if (historyWithoutSelect.length > 0) {
            const changedElementsIds = historyWithoutSelect
                .flatMap((command) => command.elementIds)
                .filter((value, index, self) => self.indexOf(value) === index);
            setUpdatedelements(changedElementsIds);
        } else {
            setUpdatedelements([]);
        }
    }, [history, currentIndex]);

    useEffect(() => {
        async function createImageElements() {
            const imageElements = [];
            for (const imageData of images) {
                const imageElement = new ImageElement({
                    src: imageData.url,
                    x: imageData.transform.x,
                    y: imageData.transform.y,
                    id: imageData.id,
                    width: imageData.transform.width,
                    height: imageData.transform.height,
                    rotationAngle: imageData.transform.rotationAngle,
                    selected: false,
                    key: imageData.key,
                });
                await imageElement.create();
                imageElements.push(imageElement);
                setProgress((prev) => {
                    return {
                        ...prev,
                        finished: imageElements.length,
                    };
                });
            }
            return imageElements;
        }
        createImageElements().then((imageElements) =>
            setElements(imageElements)
        );
    }, []);

    return (
        <FileContext.Provider
            value={{
                elements,
                setElements,
                progress,
                executeCommand,
                undo,
                redo,
                updatedElements,
                setUpdatedelements,
                fileId,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}
