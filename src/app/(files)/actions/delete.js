"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteFile(file) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from("Files")
            .delete()
            .eq("id", file.id);
        revalidatePath("/files");
    } catch (error) {
        console.log(error);
        return { message: error.message };
    }
}
