"use client";

import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export function NewFileSubmit({ setOpen }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (!pending && isSubmitting) {
            setOpen(false);
        }
    }, [pending]);
    return (
        <Button
            type="submit"
            aria-disabled={pending}
            onClick={() => setIsSubmitting(true)}
            disabled={pending}
        >
            {pending ? (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {pending ? "Creating new File..." : "Save changes"}
        </Button>
    );
}
