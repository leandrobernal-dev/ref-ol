import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteFileModal } from "@/app/(files)/components/DeleteFileModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil2Icon } from "@radix-ui/react-icons";
import { FileActionModal } from "@/app/(files)/components/FileActionModal";

export function FileCard({ file }) {
    return (
        <Card className="w-full rounded-none">
            <CardHeader className="p-0 relative aspect-square">
                {file.thumbnail ? (
                    <Link href={"/file/" + file.id}>
                        <img src={file.thumbnail} alt="" />
                    </Link>
                ) : (
                    <Link
                        className="w-full h-full grid grid-cols-2 gap-1 p-4"
                        href={"/file/" + file.id}
                    >
                        <div className="w-full h-full outline outline-1"></div>
                        <div className="grid grid-rows-2 gap-1">
                            <div className="w-full h-full outline outline-1"></div>
                            <div className="w-full h-full outline outline-1"></div>
                        </div>
                    </Link>
                )}
                <div className="absolute top-0 right-2 flex flex-col gap-1">
                    <DeleteFileModal file={file} />

                    <FileActionModal
                        action="update"
                        file={file}
                        children={
                            <Button variant="outline" size="icon">
                                <Pencil2Icon />
                            </Button>
                        }
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle>{file.name}</CardTitle>
            </CardContent>
        </Card>
    );
}
