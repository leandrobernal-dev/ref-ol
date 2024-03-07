"use client";

import AddLoader from "@/app/(files)/file/components/AddLoader";
import Canvas from "@/app/(files)/file/components/Canvas";
import ContextMenuProvider from "@/app/(files)/file/components/ContextMenu";
import Loader from "@/app/(files)/file/components/Loader";
import { FileContext } from "@/app/(files)/file/context/FileContext";
import { useContext, useState } from "react";

export default function FilePageLayout() {
    const [isAdding, setIsAdding] = useState(false);
    const [addingProgress, setAddingProgress] = useState({
        finished: 0,
        total: 0,
    });
    const { progress } = useContext(FileContext);
    return (
        <>
            {progress.finished === progress.total ? (
                <>
                    <ContextMenuProvider>
                        <Canvas
                            setAddLoaderOpen={setIsAdding}
                            setAddLoaderProgress={setAddingProgress}
                        />
                    </ContextMenuProvider>
                    <AddLoader open={isAdding} progress={addingProgress} />
                </>
            ) : (
                <Loader progress={progress} />
            )}
        </>
    );
}
