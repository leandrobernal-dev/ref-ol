"use client";
import { updateFileImage } from "@/app/app/actions/update";
import ImageElement from "@/app/app/file/classes/ImageElement";
import handleUpload from "@/app/app/file/handlers/HandleUpload";
import useHistory, {
    AddCommand,
    DeleteCommand,
    SelectCommand,
} from "@/app/app/file/hooks/useHistory";
import { createContext, useEffect, useState } from "react";

export const FileContext = createContext();

export default function FileContextProvider({ children, images, fileId }) {
    images = JSON.parse(images);
    const [updatedElements, setUpdatedelements] = useState([]);
    const [isSaving, setIssaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addingProgress, setAddingProgress] = useState({
        finished: 0,
        total: 0,
    });
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

        // Save updated element ids and actions
        if (historyWithoutSelect.length > 0) {
            const updatedElements = historyWithoutSelect.reduce(
                (acc, command) => {
                    command.elementIds.forEach((id) => {
                        const existingIndex = acc.findIndex(
                            (item) => item.id === id
                        );
                        if (command instanceof DeleteCommand) {
                            if (existingIndex !== -1) {
                                // Image is already deleted, remove other update actions
                                acc = acc.filter((item) => item.id !== id);
                            }
                            acc.push({
                                id,
                                action: "delete",
                            });
                        } else {
                            if (existingIndex === -1) {
                                acc.push({ id, action: "update" });
                            }
                        }
                    });
                    return acc;
                },
                []
            );
            setUpdatedelements(updatedElements);
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
        const elementsToUpdate = updatedElements
            .filter(
                (updatedEl) =>
                    elements.some((el) => el.id === updatedEl.id) ||
                    updatedEl.action === "delete"
            )
            .map((updatedEl) => {
                const correspondingElement = elements.find(
                    (el) => el.id === updatedEl.id
                );
                if (updatedEl.action === "delete") {
                    return {
                        id: updatedEl.id,
                        action: updatedEl.action,
                    };
                } else {
                    return {
                        id: updatedEl.id,
                        action: updatedEl.action,
                        transform: {
                            x: correspondingElement.x,
                            y: correspondingElement.y,
                            width: correspondingElement.width,
                            height: correspondingElement.height,
                            rotationAngle: correspondingElement.rotationAngle,
                        },
                    };
                }
            });
        await updateFileImage(JSON.stringify(elementsToUpdate));
        setIssaving(false);
        setUpdatedelements([]);
    }

    const handleFileUpload = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.multiple = true;
        fileInput.accept = "image/*";
        fileInput.style.display = "none";

        document.body.appendChild(fileInput);
        fileInput.click();

        // Handle file selection
        fileInput.addEventListener("change", (event) => {
            const files = event.target.files;
            handleUpload(
                files,
                0,
                0,
                setIsAdding,
                setAddingProgress,
                fileId,
                setElements,
                executeCommand
            );
            document.body.removeChild(fileInput);
        });
    };

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
                isAdding,
                setIsAdding,
                addingProgress,
                setAddingProgress,
                handleFileUpload,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}
