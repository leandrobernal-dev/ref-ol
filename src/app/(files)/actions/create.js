"use server";

import { createClient } from "@/utils/supabase/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

export async function createImageFile(data) {
    const { newElements, fileId } = JSON.parse(data);
    const supabase = createClient();
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    const savedElements = await Promise.all(
        newElements.map(async (element) => {
            const { data, error } = await supabase
                .from("Images")
                .insert([
                    {
                        file: fileId,
                        key: `${element.id}${element.key}`,
                        transform: {
                            x: element.x,
                            y: element.y,
                            width: element.width,
                            height: element.height,
                            rotationAngle: element.rotationAngle,
                        },
                    },
                ])
                .select("*");
            if (error) {
                console.log(error);
            }

            data.forEach(async (image) => {
                const response = await fetch(element.src);
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
            return data;
        })
    ).then((data) => data.flatMap((el) => el));
    return savedElements;
}
