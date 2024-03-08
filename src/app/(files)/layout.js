import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import FileDataContextProvider from "@/app/(files)/context/FilesContext";

import "../globals.css";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
export const metadata = {
    title: "My Files - refOnline",
    description: "Generated by create next app",
};

export default async function RootLayout({ children }) {
    const supabase = createClient();
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    let { data: files } = await supabase
        .from("Files")
        .select("*")
        .eq("user_id", user.id);

    files = await Promise.all(
        files.map(async (image) => {
            return {
                ...image,
                thumbnail: await supabase
                    .from("Images")
                    .select("key")
                    .limit(3)
                    .eq("file", image.id),
            };
        })
    );
    const images = await Promise.all(
        files.map(async (image) => {
            const imageDataWithUrl = await Promise.all(
                image.thumbnail.data.map(async (img) => {
                    return {
                        ...img,
                        url: await getSignedUrl(
                            s3Client,
                            new GetObjectCommand({
                                Bucket: "refol",
                                Key: img.key,
                            }),
                            { expiresIn: 60 }
                        ),
                    };
                })
            );
            return {
                ...image,
                thumbnail: { ...image.thumbnail, data: imageDataWithUrl },
            };
        })
    );

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${poppins.className}`} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <FileDataContextProvider files={images} user={user}>
                        {children}
                    </FileDataContextProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
