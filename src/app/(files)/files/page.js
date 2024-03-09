"use client";
import { FileCard } from "@/app/(files)/components/FileCard";
import { FileActionModal } from "@/app/(files)/components/FileActionModal";
import { FileDataContext } from "@/app/(files)/context/FilesContext";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { ExitIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/theme/ThemeToggler";
import Link from "next/link";

export default function FilesPage() {
    const { optimisticFiles: files } = useContext(FileDataContext);
    return (
        <main className="p-8">
            <section className="flex justify-between">
                <section>
                    <span>My Files</span> |{" "}
                    <span>
                        <FileActionModal
                            action={"create"}
                            children={<Button variant="">Create new</Button>}
                        />
                    </span>
                </section>
                <section className="flex items-center gap-2">
                    <ThemeToggle />
                    <Link href="/auth/logout">
                        <Button variant="outline">
                            <ExitIcon className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </Link>
                </section>
            </section>
            {files.length === 0 ? (
                <section className="text-center flex flex-col gap-4 justify-center h-full">
                    <p>You don't have any files yet.</p>
                    <p>
                        <FileActionModal
                            action={"create"}
                            children={<Button variant="">Create new</Button>}
                        />
                    </p>
                </section>
            ) : (
                <section className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 grid-cols-1 sm:grid-cols-2 py-4 gap-2">
                    {files
                        .sort((a, b) => {
                            return (
                                new Date(a.created_at) - new Date(b.created_at)
                            );
                        })
                        .map((file) => (
                            <FileCard key={file.id} file={file} />
                        ))}
                </section>
            )}
        </main>
    );
}
