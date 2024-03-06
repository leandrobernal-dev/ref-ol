import { useFormState } from "react-dom";
import { createFile } from "@/app/(files)/actions/create";
import { NewFileSubmit } from "@/app/(files)/components/NewFileSubmit";
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
import { useContext } from "react";
import { FileDataContext } from "@/app/(files)/context/FilesContext";

const initialState = {
    message: "",
};
export function NewFileModal() {
    const { user, addOptimisticFile } = useContext(FileDataContext);
    const [formState, formAction] = useFormState(
        createFile.bind(null, user),
        initialState
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="">Create new</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <form
                    action={async (formData) => {
                        const data = {
                            id: Math.random().toString(36).substring(7),
                            user: user.id,
                            name: formData.get("file-name"),
                            description: formData.get("description"),
                        };
                        addOptimisticFile(data);
                        await formAction(formData);
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>New File</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                File name
                            </Label>
                            <Input
                                id="file-name"
                                name="file-name"
                                defaultValue=""
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
                                defaultValue=""
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <p>{formState?.message}</p>
                        <NewFileSubmit />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
