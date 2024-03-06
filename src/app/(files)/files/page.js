"use client";
import { FileCard } from "@/app/(files)/components/FileCard";
import { FileActionModal } from "@/app/(files)/components/FileActionModal";
import { FileDataContext } from "@/app/(files)/context/FilesContext";
import { useContext } from "react";
import { Button } from "@/components/ui/button";

export default function FilesPage() {
    const { optimisticFiles: files } = useContext(FileDataContext);
    return (
        <main className="p-8">
            <section>
                <span>My Files</span> |{" "}
                <span>
                    <FileActionModal
                        action={"create"}
                        children={<Button variant="">Create new</Button>}
                    />
                </span>
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
                <section className="grid md:grid-cols-4 lg:grid-cols-5 grid-cols-2 sm:grid-cols-3 py-4 gap-2">
                    {files.map((file) => (
                        <FileCard key={file.id} file={file} />
                    ))}
                </section>
            )}
        </main>
    );
}
