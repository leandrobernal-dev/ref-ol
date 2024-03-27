import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: siteConfig.site.title,
    description: siteConfig.site.description,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${inter.className} dark`}
                suppressHydrationWarning
            >
                {children}
            </body>
        </html>
    );
}
