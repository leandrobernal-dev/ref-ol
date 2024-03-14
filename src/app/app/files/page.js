"use client";
import { FileCard } from "@/app/app/components/FileCard";
import { FileActionModal } from "@/app/app/components/FileActionModal";
import { FileDataContext } from "@/app/app/context/FilesContext";
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { ExitIcon, FilePlusIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/theme/ThemeToggler";
import { signOut } from "next-auth/react";

export default function FilesPage() {
    const { optimisticFiles: files } = useContext(FileDataContext);
    return (
        <main className="p-8">
            <section className="flex justify-between">
                <section className="flex items-center gap-1">
                    <h3>
                        <strong>My Files</strong>
                    </h3>{" "}
                    |
                    <span>
                        <FileActionModal
                            action={"create"}
                            children={
                                <Button variant="ghost">
                                    <FilePlusIcon className="mr-2 h-4 w-4" />
                                    Create new
                                </Button>
                            }
                        />
                    </span>
                </section>
                <section className="flex items-center gap-2">
                    <Button onClick={() => signOut()} variant="outline">
                        <ExitIcon className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </section>
            </section>
            {files.length === 0 ? (
                <section className="text-center flex flex-col gap-4 justify-center h-full">
                    <p>You don't have any files yet.</p>
                    <p>
                        <FileActionModal
                            action={"create"}
                            children={
                                <Button variant="">
                                    <FilePlusIcon className="mr-2 h-4 w-4" />
                                    Create new
                                </Button>
                            }
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
