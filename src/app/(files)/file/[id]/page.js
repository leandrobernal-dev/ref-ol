"use client";
import Canvas from "@/app/(files)/file/components/Canvas";
import FileDataContextProvider from "@/app/(files)/file/context/FileContext";

export default function FilePageLayout() {
    return (
        <FileDataContextProvider>
            <Canvas />
        </FileDataContextProvider>
    );
}
