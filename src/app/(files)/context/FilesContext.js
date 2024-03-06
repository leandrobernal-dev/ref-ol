"use client";
import { createContext, useState, useOptimistic } from "react";

export const FileDataContext = createContext();

export default function FileDataContextProvider({
    children,
    files: myFiles,
    user: currentUser,
}) {
    const [optimisticFiles, addOptimisticFile] = useOptimistic(
        myFiles,
        (state, newFile) => [...state, newFile]
    );
    const [user, setUser] = useState(currentUser);
    return (
        <FileDataContext.Provider
            value={{
                user,
                optimisticFiles,
                addOptimisticFile,
            }}
        >
            {children}
        </FileDataContext.Provider>
    );
}
