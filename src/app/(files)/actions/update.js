"use server";

import { createClient } from "@/utils/supabase/server";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    try {
        const updates = JSON.parse(file);

        const promises = updates.map(async (update) => {
            const { id, action, transform } = update;
            if (action === "delete") {
                const { data, error } = await supabase
                    .from("Images")
                    .select("key")
                    .eq("id", id)
                    .single();
                const key = data.key;
                console.log(key);
                const command = new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                });
                await s3Client.send(command);
                await supabase.from("Images").delete().match({ id });
            } else {
                return supabase
                    .from("Images")
                    .update({ transform }) // Update the 'transform' field
                    .match({ id }); // Match the ID for the update
            }
        });
        // Execute all promises in parallel
        await Promise.all(promises);
    } catch (error) {
        return { message: error.message };
    }
}
