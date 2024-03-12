"use server";

import { createClient } from "@/utils/supabase/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFile(user, prevState, formData) {
    const supabase = createClient();
    let id;
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
        id = files[0].id;
    } catch (error) {
        return { message: error.message };
    }
    redirect("/file/" + id);
}

export async function createImageFile(newFile) {
    const { newElement, fileId } = JSON.parse(newFile);
    const supabase = createClient();
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    const { data, error } = await supabase
        .from("Images")
        .insert([
            {
                file: fileId,
                key: `${newElement.id}${newElement.key}`,
                transform: {
                    x: newElement.x,
                    y: newElement.y,
                    width: newElement.width,
                    height: newElement.height,
                    rotationAngle: newElement.rotationAngle,
                },
            },
        ])
        .select("*");

    data.forEach(async (image) => {
        const response = await fetch(newElement.src);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const arrayBuffer = new Uint8Array(buffer);
        const key = image.key;
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: arrayBuffer,
        });
        await s3Client.send(command);
    });
    revalidatePath("/file", "layout");
    return data;
}
