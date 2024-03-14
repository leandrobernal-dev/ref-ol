import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteFileModal } from "@/app/app/components/DeleteFileModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil2Icon } from "@radix-ui/react-icons";
import { FileActionModal } from "@/app/app/components/FileActionModal";

const Thumbnail = ({ url }) => {
    const placeholder =
        "https://i.pinimg.com/564x/da/7a/95/da7a95574393fb01db48d081f9a0b81b.jpg";
    return (
        <img
            src={url || placeholder}
            alt=""
            className="object-cover outline outline-1 outline-zinc-400 w-full h-full"
        />
    );
};

export function FileCard({ file }) {
    return (
        <Card className="w-full rounded-none">
            <CardHeader className="p-0 relative aspect-square">
                <Link
                    href={"/app/file/" + file.id}
                    className="aspect-square overflow-hidden grid grid-cols-2 gap-1 p-4"
                >
                    <div className="relative  h-full">
                        <Thumbnail url={file.thumbnails[0]?.url} />
                    </div>
                    <div className="grid grid-rows-2 gap-1 relative aspect-square  w-full h-full">
                        <Thumbnail url={file.thumbnails[1]?.url} />
                        <Thumbnail url={file.thumbnails[2]?.url} />
                    </div>
                </Link>

                <div className="absolute top-0 right-2 flex flex-col gap-1">
                    <DeleteFileModal file={file} />

                    <FileActionModal
                        action="update"
                        file={file}
                        children={
                            <Button
                                variant="outline"
                                size="icon"
                                className="shadow-lg shadow-black"
                            >
                                <Pencil2Icon />
                            </Button>
                        }
                    />
                </div>
            </CardHeader>
            <CardContent className="py-2 px-4">
                <CardTitle className="truncate text-sm">
                    <Link href={"/app/file/" + file.id}>{file.name}</Link>
                </CardTitle>
            </CardContent>
        </Card>
    );
}
