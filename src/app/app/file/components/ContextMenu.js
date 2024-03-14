import { FileContext } from "@/app/app/file/context/FileContext";
import handleUpload, {
    fitRectanglesIntoGrid,
} from "@/app/app/file/handlers/HandleUpload";
import { MoveCommand } from "@/app/app/file/hooks/useHistory";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useContext } from "react";

export default function ContextMenuProvider({
    children,
    setAddLoaderOpen,
    setAddLoaderProgress,
    fileId,
}) {
    const {
        handleSave,
        executeCommand,
        setElements,
        undo,
        redo,
        updatedElements,
        elements,
    } = useContext(FileContext);

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
                setAddLoaderOpen,
                setAddLoaderProgress,
                fileId,
                setElements,
                executeCommand
            );
            document.body.removeChild(fileInput);
        });
    };

    const handleArrangeImages = () => {
        const selectedElementsIds = elements
            .map((element, index) =>
                element.selected ? { id: element.id, index } : null
            )
            .filter((id) => id !== null);
        const initialPositions = selectedElementsIds.map((element) => ({
            id: element.id,
            x: elements[element.index].x,
            y: elements[element.index].y,
        }));

        const updatedSelectedItems = fitRectanglesIntoGrid(
            elements.filter((element) => element.selected),
            0,
            0
        );
        const newPositions = selectedElementsIds.map((element) => ({
            id: element.id,
            x: updatedSelectedItems[element.index].x,
            y: updatedSelectedItems[element.index].y,
        }));
        const moveCommand = new MoveCommand(
            selectedElementsIds.map((element) => element.id),
            initialPositions,
            newPositions,
            setElements
        );
        executeCommand(moveCommand);

        const updatedItems = elements.map(
            (element) =>
                updatedSelectedItems.find((item) => item.id === element.id) ||
                element
        );
        setElements(updatedItems);
    };
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-64">
                <ContextMenuItem inset onClick={handleFileUpload}>
                    Upload
                    <ContextMenuShortcut>⇧A</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset disabled>
                    Delete
                    <ContextMenuShortcut>⌫/⌦</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset>
                    Copy
                    <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset>
                    Paste
                    <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset onClick={handleArrangeImages}>
                    Auto Arrange
                </ContextMenuItem>
                <ContextMenuItem inset onClick={undo}>
                    Undo
                    <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset onClick={redo}>
                    Redo
                    <ContextMenuShortcut>Ctrl+Y</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                    inset
                    onClick={handleSave}
                    disabled={updatedElements.length > 0 ? false : true}
                >
                    Save
                    <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
