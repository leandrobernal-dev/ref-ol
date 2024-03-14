import { FileContext } from "@/app/app/file/context/FileContext";
import handleUpload from "@/app/app/file/handlers/HandleUpload";
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
    const { handleSave, executeCommand, setElements } = useContext(FileContext);
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
                <ContextMenuItem inset>Auto Arrange</ContextMenuItem>
                <ContextMenuItem inset>
                    Undo
                    <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset>
                    Redo
                    <ContextMenuShortcut>Ctrl+Y</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset onClick={handleSave}>
                    Save
                    <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
