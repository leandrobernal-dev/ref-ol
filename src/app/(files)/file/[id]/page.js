"use client";

import AddLoader from "@/app/(files)/file/components/AddLoader";
import Canvas from "@/app/(files)/file/components/Canvas";
import ContextMenuProvider from "@/app/(files)/file/components/ContextMenu";
import { useState } from "react";

export default function FilePageLayout() {
    const [isAdding, setIsAdding] = useState(false);
    const [addingProgress, setAddingProgress] = useState({
        finished: 0,
        total: 0,
    });
    return (
        <>
            <ContextMenuProvider>
                <Canvas
                    setAddLoaderOpen={setIsAdding}
                    setAddLoaderProgress={setAddingProgress}
                />
            </ContextMenuProvider>
            <AddLoader open={isAdding} progress={addingProgress} />
        </>
    );
}
