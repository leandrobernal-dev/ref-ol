import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/theme/ThemeProvider";
import FileDataContextProvider from "@/app/app/context/FilesContext";

import "../globals.css";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import AuthProvider from "@/context/AuthProvider";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import Files from "@/models/Files";
import Images from "@/models/Images";
import dbConnect from "@/db/database";
import getCurrentUser from "@/app/app/helpers/getCurrentUser";
import { siteConfig } from "@/config/config";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
export const metadata = {
    title: "My Files - " + siteConfig.site.title,
    description: siteConfig.site.description,
};
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
export default async function RootLayout({ children, session }) {
    await dbConnect();
    const currentUser = await getCurrentUser();
    let files = await Files.find({ created_by: currentUser }).populate({
        path: "thumbnails",
        model: Images,
        select: "key",
    });
    for (const file of files) {
        const keys = file.thumbnails.map((thumbnail) => thumbnail.key);
        const signedUrls = await Promise.all(keys.map(getSignedUrlForKey));
        file.thumbnails = signedUrls.map((url, index) => ({
            key: keys[index],
            url,
        }));
    }

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${poppins.className}`} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider session={session}>
                        <FileDataContextProvider
                            files={JSON.stringify(files)}
                            user={currentUser.id}
                        >
                            {children}
                        </FileDataContextProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
