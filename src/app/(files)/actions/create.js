"use server";

import Files from "@/models/Files";
import Images from "@/models/Images";
import User from "@/models/User";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFile(prevState, formData) {
    const session = await getServerSession();
    const currentUser = await User.findOne({ email: session.user.email });
    let id;
    try {
        const newFile = new Files({
            created_by: currentUser,
            name: formData.get("file-name"),
            description: formData.get("description"),
        });
        await newFile.save();

        id = newFile.id;
    } catch (error) {
        return { message: error.message };
    }
    revalidatePath("/files");
    redirect("/file/" + id);
}

export async function createImageFile(newFile) {
    const { newElement, fileId } = JSON.parse(newFile);
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    const newImage = await Images.create({
        file_id: fileId,
        key: `${newElement.id}${newElement.key}`,
        transform: {
            x: newElement.x,
            y: newElement.y,
            width: newElement.width,
            height: newElement.height,
            rotationAngle: newElement.rotationAngle,
        },
    });

    const response = await fetch(newElement.src);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const arrayBuffer = new Uint8Array(buffer);
    const key = newImage.key;
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: arrayBuffer,
    });
    await s3Client.send(command);
    revalidatePath("/file", "layout");
    return JSON.stringify(newImage);
}
