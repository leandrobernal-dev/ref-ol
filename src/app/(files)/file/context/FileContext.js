"use client";
import { updateFileImage } from "@/app/(files)/actions/update";
import ImageElement from "@/app/(files)/file/classes/ImageElement";
import useHistory, {
    AddCommand,
    SelectCommand,
} from "@/app/(files)/file/hooks/useHistory";
import { createContext, useEffect, useState } from "react";

export const FileContext = createContext();

export default function FileContextProvider({ children, images, fileId }) {
    const [updatedElements, setUpdatedelements] = useState([]);
    const [isSaving, setIssaving] = useState(false);
    const [elements, setElements] = useState([]);
    const [progress, setProgress] = useState({
        total: images.length,
        finished: 0,
    });
    const { executeCommand, undo, redo, history, currentIndex } = useHistory();

    useEffect(() => {
        // Use current history and remove select commands as it is not needed in the update, also remove add commands as it is already saved in the server
        const historyWithoutSelect = [...history]
            .slice(0, currentIndex + 1)
            .filter(
                (command) =>
                    !(command instanceof SelectCommand) &&
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

    async function handleSave() {
        if (updatedElements.length === 0) return;
        setIssaving(true);
        const elementsToUpdate = elements
            .filter((el) => updatedElements.includes(el.id))
            .map((el) => {
                return {
                    id: el.id,
                    transform: {
                        x: el.x,
                        y: el.y,
                        width: el.width,
                        height: el.height,
                        rotationAngle: el.rotationAngle,
                    },
                };
            });
        await updateFileImage(JSON.stringify(elementsToUpdate));
        setIssaving(false);
        setUpdatedelements([]);
    }

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
                handleSave,
                isSaving,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}
