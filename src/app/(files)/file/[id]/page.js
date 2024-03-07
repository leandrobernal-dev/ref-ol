"use client";

import AddLoader from "@/app/(files)/file/components/AddLoader";
import Canvas from "@/app/(files)/file/components/Canvas";
import ContextMenuProvider from "@/app/(files)/file/components/ContextMenu";
import Loader from "@/app/(files)/file/components/Loader";
import { FileContext } from "@/app/(files)/file/context/FileContext";
import { Button } from "@/components/ui/button";
import { Cross1Icon } from "@radix-ui/react-icons";
import Link from "next/link";
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
                        <div className="relative">
                            <Canvas
                                setAddLoaderOpen={setIsAdding}
                                setAddLoaderProgress={setAddingProgress}
                            />
                            <Link href={"/files"}>
                                <Button
                                    variant="outline"
                                    className="z-20 absolute right-2 top-2"
                                    size="icon"
                                >
                                    <Cross1Icon className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </ContextMenuProvider>
                    <AddLoader open={isAdding} progress={addingProgress} />
                </>
            ) : (
                <Loader progress={progress} />
            )}
        </>
    );
}
