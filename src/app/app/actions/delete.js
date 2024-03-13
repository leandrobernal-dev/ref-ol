"use server";

import Files from "@/models/Files";
import Images from "@/models/Images";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

export async function deleteFile(file) {
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    try {
        const images = await Images.find({ file_id: file.id });
        images.forEach(async (image) => {
            const key = image.key;
            const command = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
            });
            await s3Client.send(command);
        });
        await Images.deleteMany({ file_id: file.id });
        await Files.findByIdAndDelete({ _id: file.id });
        revalidatePath("/app/files");
    } catch (error) {
        return { message: error.message };
    }
}
