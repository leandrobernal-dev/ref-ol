"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFile(user, prevState, formData) {
    const supabase = createClient();

    try {
        const data = {
            user: user.id,
            name: formData.get("file-name"),
            description: formData.get("description"),
        };
        revalidatePath("/files");

        const { data: files, error } = await supabase
            .from("Files")
            .insert([data])
            .select();
        return files;
    } catch (error) {
        return { message: error.message };
    }
}
