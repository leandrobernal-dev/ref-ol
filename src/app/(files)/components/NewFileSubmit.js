"use client";

import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useFormStatus } from "react-dom";

export function NewFileSubmit() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" aria-disabled={pending} disabled={pending}>
            {pending ? (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {pending ? "Creating new File..." : "Save changes"}
        </Button>
    );
}
