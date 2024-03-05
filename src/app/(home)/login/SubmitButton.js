"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText, ...props }) {
    const { pending, action } = useFormStatus();

    const isPending = pending && action === props.formAction;

    return (
        <button {...props} type="submit" aria-disabled={pending}>
            {isPending ? pendingText : children}
        </button>
    );
}
