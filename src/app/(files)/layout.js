import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import FileDataContextProvider from "@/app/(files)/context/FilesContext";

import "../globals.css";

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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    let { data: files, status } = await supabase
        .from("Files")
        .select("*")
        .eq("user", user.id);

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${poppins.className}`} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <FileDataContextProvider files={files}>
                        {children}
                    </FileDataContextProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
