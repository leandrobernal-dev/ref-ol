import { useContext, useEffect } from "react";
import hotkeys from "hotkeys-js";
import {
    DeleteCommand,
    SelectCommand,
} from "@/app/(files)/file/hooks/useHistory";
import { FileContext } from "@/app/(files)/file/context/FileContext";

function KeyboardShortcuts({
    elements,
    setElements,
    executeCommand,
    undo,
    redo,
}) {
    const { handleSave } = useContext(FileContext);
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
                if (elements.every((el) => el.selected)) return;

                const newSelectCommand = new SelectCommand(
                    [],
                    elements.map((el) => el.id),
                    setElements
                );
                executeCommand(newSelectCommand);
            }

            // Check for Delete key
            if (key === "Delete") {
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
        };

        hotkeys(
            "ctrl+z, ctrl+y, ctrl+a, delete, escape, ctrl+s",
            handleKeyPress
        ); // Register hotkeys

        return () => {
            hotkeys.unbind("ctrl+z, ctrl+y, ctrl+a, delete, escape, ctrl+s"); // Unbind hotkeys on component unmount
        };
    }, [elements, executeCommand, setElements, undo, redo]);

    return null; // This component doesn't render anything
}

export default KeyboardShortcuts;
