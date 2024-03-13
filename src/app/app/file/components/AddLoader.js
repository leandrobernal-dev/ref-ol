"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

export default function AddLoader({ open, progress }) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Adding Images ({progress.finished} out of{" "}
                        {progress.total})
                    </AlertDialogTitle>
                    <Progress
                        value={(progress.finished / progress.total) * 100}
                    />
                </AlertDialogHeader>
            </AlertDialogContent>
        </AlertDialog>
    );
}
