import { FileContext } from "@/app/app/file/context/FileContext";
import { fitRectanglesIntoGrid } from "@/app/app/file/handlers/HandleUpload";
import { DeleteCommand, MoveCommand } from "@/app/app/file/hooks/useHistory";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useContext } from "react";

export default function ContextMenuProvider({ children }) {
    const {
        handleSave,
        executeCommand,
        setElements,
        undo,
        redo,
        updatedElements,
        elements,
        handleFileUpload,
    } = useContext(FileContext);

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

    const handleDelete = () => {
        const idsToDelete = elements
            .filter((element) => element.selected)
            .map((element) => element.id);
        const deleteCommand = new DeleteCommand(
            idsToDelete,
            elements,
            setElements
        );
        executeCommand(deleteCommand);
        const updatedItems = elements.filter((element) => !element.selected);
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
                <ContextMenuItem
                    inset
                    disabled={
                        elements.filter((element) => element.selected).length >
                        0
                            ? false
                            : true
                    }
                    onClick={handleDelete}
                >
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
