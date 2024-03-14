import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

export default function ContextMenuProvider({ children }) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-64">
                <ContextMenuItem inset>
                    Add Images
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
                <ContextMenuItem inset>
                    Save
                    <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
