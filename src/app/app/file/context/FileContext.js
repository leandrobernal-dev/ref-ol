"use client";
import { updateFileImage } from "@/app/app/actions/update";
import ImageElement from "@/app/app/file/classes/ImageElement";
import handleUpload from "@/app/app/file/handlers/HandleUpload";
import useHistory, {
    AddCommand,
    CopyCommand,
    DeleteCommand,
    SelectCommand,
} from "@/app/app/file/hooks/useHistory";
import mongoose from "mongoose";
import { createContext, useEffect, useState } from "react";

export const FileContext = createContext();

export default function FileContextProvider({ children, images, fileId }) {
    images = JSON.parse(images);
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
    const [copiedElements, setCopiedElements] = useState([]);
    const [updatedElements, setUpdatedElements] = useState([]);
    const [lastUpdateIndex, setLastUpdateIndex] = useState(currentIndex);

    useEffect(() => {
        // Use current history and remove select commands as it is not needed in the update, also remove add commands as it is already saved in the server
        const historyWithoutSelect = [...history]
            .slice(Math.min(lastUpdateIndex, currentIndex)) // Use currentIndex if undo operation is made | if lastUpdateIndex is larger than currentIndex, use currentIndex
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
                        } else if (command instanceof CopyCommand) {
                            acc.push({
                                id,
                                action: "copy",
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
            setUpdatedElements(updatedElements);
        } else {
            setUpdatedElements([]);
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
                } else if (updatedEl.action === "copy") {
                    return {
                        id: updatedEl.id,
                        referenceId: correspondingElement.referenceId,
                        action: updatedEl.action,
                        fileId: fileId,
                        transform: {
                            x: correspondingElement.x,
                            y: correspondingElement.y,
                            width: correspondingElement.width,
                            height: correspondingElement.height,
                            rotationAngle: correspondingElement.rotationAngle,
                        },
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
        setLastUpdateIndex(currentIndex);
        setUpdatedElements([]);
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

    const handleCopy = () => {
        const selectedElements = elements.filter((element) => element.selected);
        setCopiedElements(selectedElements);
    };
    const handlePaste = () => {
        const newElements = JSON.parse(JSON.stringify(copiedElements)).map(
            (element, index) => {
                element.referenceId = element.id;
                element.id = new mongoose.Types.ObjectId();
                element.image = copiedElements[index].image;
                element.x += element.width / 2;
                element.y += element.height / 2;
                return element;
            }
        );
        const copiedElementIds = newElements.map((element) => element.id);
        const newCopyCommand = new CopyCommand(
            copiedElementIds,
            newElements,
            setElements
        );
        executeCommand(newCopyCommand);
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
                setUpdatedElements,
                fileId,
                handleSave,
                isSaving,
                isAdding,
                setIsAdding,
                addingProgress,
                setAddingProgress,
                handleFileUpload,
                handleCopy,
                handlePaste,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}
