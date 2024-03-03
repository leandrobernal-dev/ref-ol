import { useEffect } from "react";
import hotkeys from "hotkeys-js";
import {
    DeleteCommand,
    SelectCommand,
} from "@/app/(files)/file/hooks/useHistory";

function KeyboardShortcuts({
    elements,
    setElements,
    executeCommand,
    undo,
    redo,
}) {
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

            // Check for Ctrl + A (select all)
            if (ctrlKey && (key === "a" || key === "A")) {
                const newSelectCommand = new SelectCommand(
                    elements
                        .filter((element) => element.selected)
                        .map((element) => element.id),
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

        hotkeys("ctrl+z, ctrl+y, ctrl+a, delete, escape", handleKeyPress); // Register hotkeys

        return () => {
            hotkeys.unbind("ctrl+z, ctrl+y, ctrl+a, delete, escape"); // Unbind hotkeys on component unmount
        };
    }, [elements, executeCommand, setElements, undo, redo]);

    return null; // This component doesn't render anything
}

export default KeyboardShortcuts;
