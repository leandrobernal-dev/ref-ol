"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFile(user, prevState, formData) {
    const supabase = createClient();

    try {
        const data = {
            user_id: user.id,
            name: formData.get("file-name"),
            description: formData.get("description"),
        };

        const { data: files, error } = await supabase
            .from("Files")
            .insert([data])
            .select();
        revalidatePath("/files");

        return files;
    } catch (error) {
        return { message: error.message };
    }
}
