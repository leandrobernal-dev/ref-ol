import FileContextProvider from "@/app/(files)/file/context/FileContext";
import { createClient } from "@/utils/supabase/server";
import {
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
    paginateListObjectsV2,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function generateMetadata({ params }) {
    const supabase = createClient();
    const { data: file } = await supabase
        .from("Files")
        .select("*")
        .eq("id", params.id)
        .single();

    return {
        title: file.name + " - refOnline",
    };
}

export default async function FileLayout({ children, params }) {
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
    const supabase = createClient();
    const { data } = await supabase
        .from("Images")
        .select("*")
        .eq("file", params.id);
    const images = await Promise.all(
        data.map(async (image) => {
            return {
                ...image,
                url: await getSignedUrl(
                    s3Client,
                    new GetObjectCommand({
                        Bucket: "refol",
                        Key: image.key,
                    }),
                    { expiresIn: 60 }
                ),
            };
        })
    );

    return (
        <FileContextProvider images={images}>{children}</FileContextProvider>
    );
}
