import { useFormState } from "react-dom";
import { createFile } from "@/app/app/actions/create";
import { NewFileSubmit } from "@/app/app/components/NewFileSubmit";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContext, useState } from "react";
import { FileDataContext } from "@/app/app/context/FilesContext";
import { updateFile } from "@/app/app/actions/update";

const initialState = {
    message: "",
};
export function FileActionModal({ children, action, file }) {
    const { user, setOptimisticFile } = useContext(FileDataContext);
    const [formState, formAction] = useFormState(
        action === "create" ? createFile : updateFile.bind(null, file.id),
        initialState
    );
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <form
                    action={async (formData) => {
                        const data = {
                            id: Math.random().toString(36).substring(7),
                            user_id: user.id,
                            name: formData.get("file-name"),
                            description: formData.get("description"),
                        };
                        setOptimisticFile({ file: data, action });
                        await formAction(formData);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {action === "create" ? "New File" : "Edit File"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                File name
                            </Label>
                            <Input
                                id="file-name"
                                name="file-name"
                                defaultValue={
                                    action === "create" ? "" : file.name
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                Description <small>(optional)</small>
                            </Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={
                                    action === "create" ? "" : file.description
                                }
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <p>{formState?.message}</p>
                        <NewFileSubmit setOpen={setOpen} action={action} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
