"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFile(fileId, prevState, formData) {
    const supabase = createClient();

    try {
        const data = {
            name: formData.get("file-name"),
            description: formData.get("description"),
        };

        const { data: file, error } = await supabase
            .from("Files")
            .update(data)
            .eq("id", fileId)
            .select();
        revalidatePath("/files");
        return file;
    } catch (error) {
        return { message: error.message };
    }
}

export async function updateFileImage(file) {
    const supabase = createClient();

    try {
        const updates = JSON.parse(file);

        const promises = updates.map((update) => {
            const { id, transform } = update;
            return supabase
                .from("Images")
                .update({ transform: transform }) // Update only the 'transform' field
                .match({ id }); // Match the ID for the update
        });
        // Execute all update promises in parallel
        Promise.all(promises).catch((error) => {
            return error;
        });
    } catch (error) {
        return { message: error.message };
    }
}
