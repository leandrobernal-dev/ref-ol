import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteFileModal } from "@/app/(files)/components/DeleteFileModal";
import Link from "next/link";

export function FileCard({ file }) {
    return (
        <Card className="w-full rounded-none">
            <CardHeader className="p-0 relative cursor-pointer">
                <Link href={"/file/" + file.id}>
                    <img
                        src="https://i.pinimg.com/564x/b5/2e/a9/b52ea99845a34aded25e4ae18d9f1e08.jpg"
                        alt=""
                    />
                </Link>
                <div className="absolute top-0 right-2 flex flex-col gap-1">
                    <DeleteFileModal file={file} />
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle>{file.name}</CardTitle>
            </CardContent>
        </Card>
    );
}
