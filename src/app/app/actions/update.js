"use server";

import Files from "@/models/Files";
import Images from "@/models/Images";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

export async function updateFile(fileId, prevState, formData) {
    try {
        const data = {
            name: formData.get("file-name"),
            description: formData.get("description"),
        };
        await Files.findOneAndUpdate(
            { _id: fileId },
            {
                $set: data,
            },
            { new: true }
        );
    } catch (error) {
        return { message: error.message };
    }
    revalidatePath("/app/files");
}

export async function updateFileImage(file) {
    revalidatePath("/app/file", "layout");

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
            const { id, action, transform, referenceId } = update;
            if (action === "delete") {
                try {
                    // Find the image by ID to get the key
                    const image = await Images.findById(id).select("key");
                    const key = image.key;
                    const images = await Images.find({ key });

                    // Delete the object from S3 IF only one Image is using the same image
                    if (images.length === 1) {
                        const command = new DeleteObjectCommand({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: key,
                        });
                        await s3Client.send(command);
                    }

                    // Delete the image from MongoDB
                    await Images.findByIdAndDelete(id);
                } catch (error) {
                    console.error("Error deleting image:", error);
                }
            } else if (action === "copy") {
                const image = await Images.findById(referenceId);
                const copyExists = await Images.findById(id);
                if (copyExists) {
                    await Images.findByIdAndUpdate(id, {
                        transform,
                    });
                } else {
                    const newCopy = new Images({
                        _id: id,
                        transform,
                        file_id: image.file_id,
                        key: image.key,
                    });
                    await newCopy.save();
                }
            } else {
                await Images.findByIdAndUpdate(id, {
                    transform,
                });
            }
        });
        // Execute all promises in parallel
        await Promise.all(promises);
    } catch (error) {
        return { message: error.message };
    }
}
