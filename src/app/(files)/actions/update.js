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
