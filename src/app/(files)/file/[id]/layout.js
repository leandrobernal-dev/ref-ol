import FileContextProvider from "@/app/(files)/file/context/FileContext";
import Files from "@/models/Files";
import Images from "@/models/Images";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function generateMetadata({ params }) {
    const file = await Files.findOne({ _id: params.id });
    return {
        title: file.name + " - refOnline",
    };
}
async function getSignedUrlForKey(key) {
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
            Bucket: "refol",
            Key: key,
        }),
        { expiresIn: 60 }
    );
    return url;
}
export default async function FileLayout({ children, params }) {
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
