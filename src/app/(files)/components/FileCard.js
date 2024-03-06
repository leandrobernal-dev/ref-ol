import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FileCard({ file }) {
    return (
        <Card className="w-[300px] rounded-none cursor-pointer">
            <CardHeader className="p-0">
                <img
                    src="https://i.pinimg.com/564x/b5/2e/a9/b52ea99845a34aded25e4ae18d9f1e08.jpg"
                    alt=""
                />
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle>{file.name}</CardTitle>
            </CardContent>
        </Card>
    );
}
