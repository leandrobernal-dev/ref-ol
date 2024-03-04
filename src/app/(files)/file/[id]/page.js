import Canvas from "@/app/(files)/file/components/Canvas";
import ContextMenuProvider from "@/app/(files)/file/components/ContextMenu";
import FileDataContextProvider from "@/app/(files)/file/context/FileContext";

export default function FilePageLayout() {
    return (
        <FileDataContextProvider>
            <ContextMenuProvider>
                <Canvas />
            </ContextMenuProvider>
        </FileDataContextProvider>
    );
}
