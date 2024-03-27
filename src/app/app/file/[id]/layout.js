import FileContextProvider from "@/app/app/file/context/FileContext";
import getCurrentUser from "@/app/app/helpers/getCurrentUser";
import { siteConfig } from "@/config/config";
import Files from "@/models/Files";
import Images from "@/models/Images";
import User from "@/models/User";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
    const currentUser = await getCurrentUser();
    const file = await Files.findOne({ _id: params.id });

    if (file.created_by.toString() != currentUser._id.toString()) {
        notFound(); // If the file is not created by the current user, return 404
    }
    return {
        title: file.name + " - " + siteConfig.site.title,
    };
}

export default async function FileLayout({ children, params }) {
    const currentUser = await getCurrentUser();
    const file = await Files.findOne({ _id: params.id });

    if (file.created_by.toString() != currentUser._id.toString()) {
        notFound(); // If the file is not created by the current user, return 404
    }

    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    const data = await Images.find({ file_id: params.id });
    const dataWithSignedUrls = await Promise.all(
        data.map(async (image) => {
            const signedUrl = await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                    Bucket: "refol",
                    Key: image.key,
                }),
                { expiresIn: 60 }
            );

            // Return an object with the image data and signed URL
            return {
                ...image.toObject(), // Convert Mongoose document to plain JavaScript object
                url: signedUrl,
            };
        })
    );

    return (
        <FileContextProvider
            images={JSON.stringify(dataWithSignedUrls)}
            fileId={params.id}
        >
            {children}
        </FileContextProvider>
    );
}
