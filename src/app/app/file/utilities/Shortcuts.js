import { useContext, useEffect } from "react";
import hotkeys from "hotkeys-js";
import { DeleteCommand, SelectCommand } from "@/app/app/file/hooks/useHistory";
import { FileContext } from "@/app/app/file/context/FileContext";

function KeyboardShortcuts({
    elements,
    setElements,
    executeCommand,
    undo,
    redo,
}) {
    const { handleSave, handleFileUpload, handleCopy, handlePaste } =
        useContext(FileContext);
    useEffect(() => {
        const handleKeyPress = (event) => {
            const { key, ctrlKey } = event;

            // Check for Ctrl + Z (undo)
            if (ctrlKey && (key === "z" || key === "Z")) {
                undo();
            }

            // Check for Ctrl + Y (redo)
            if (ctrlKey && (key === "y" || key === "Y")) {
                redo();
            }

            if (ctrlKey && (key === "s" || key === "S")) {
                event.preventDefault();
                handleSave();
            }

            // Check for Ctrl + A (select all)
            if (ctrlKey && (key === "a" || key === "A")) {
                // Check if all elements are already selected
                event.preventDefault();
                if (elements.every((el) => el.selected)) return;

                const newSelectCommand = new SelectCommand(
                    [],
                    elements.map((el) => el.id),
                    setElements
                );
                executeCommand(newSelectCommand);
            }

            // Check for Delete key
            if (key === "Delete" || key === "Backspace") {
                const idsToDelete = elements
                    .filter((element) => element.selected)
                    .map((element) => element.id);
                if (idsToDelete.length > 0) {
                    const deleteCommand = new DeleteCommand(
                        idsToDelete,
                        elements,
                        setElements
                    );
                    executeCommand(deleteCommand);
                }
            }

            // Check for Escape key
            if (key === "Escape") {
                const newSelectCommand = new SelectCommand(
                    elements
                        .filter((element) => element.selected)
                        .map((element) => element.id),
                    [],
                    setElements
                );
                executeCommand(newSelectCommand);
            }

            // Check for Shift + A (add image)
            if (event.shiftKey && (key === "a" || key === "A")) {
                // Open add image modal
                handleFileUpload();
            }

            // Check for Ctrl + C (copy)
            if (ctrlKey && (key === "c" || key === "C")) {
                // Copy the selected elements
                handleCopy();
            }
            // Check for Ctrl + V (paste)
            if (ctrlKey && (key === "v" || key === "V")) {
                // Paste the copied elements
                handlePaste();
            }
        };
        const keys =
            "ctrl+z, ctrl+y, ctrl+a, delete, escape, ctrl+s, backspace, shift+a, ctrl+c, ctrl+v";
        hotkeys(keys, handleKeyPress); // Register hotkeys

        return () => {
            hotkeys.unbind(keys); // Unbind hotkeys on component unmount
        };
    }, [elements, executeCommand, setElements, undo, redo]);

    return null; // This component doesn't render anything
}

export default KeyboardShortcuts;
