"use server";

import { createClient } from "@/utils/supabase/server";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

export async function deleteFile(file) {
    const supabase = createClient();
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    try {
        const { data } = await supabase
            .from("Images")
            .select("key")
            .eq("file", file.id);
        const { error } = await supabase
            .from("Files")
            .delete()
            .eq("id", file.id);
        for (const item in data) {
            const key = data[item].key;
            const command = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
            });
            await s3Client.send(command);
        }
        revalidatePath("/files");
    } catch (error) {
        console.log(error);
        return { message: error.message };
    }
}
