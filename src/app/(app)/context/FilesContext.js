"use client";
import { createContext, useState, useOptimistic } from "react";

export const FileDataContext = createContext();

export default function FileDataContextProvider({
    children,
    files: myFiles,
    user: currentUser,
}) {
    const [optimisticFiles, setOptimisticFile] = useOptimistic(
        JSON.parse(myFiles),
        (state, { file, action }) => {
            switch (action) {
                case "add":
                    return [...state, file];
                case "delete":
                    return state.filter(({ id }) => id !== file.id);
                case "update":
                    return state.map((f) => (f.id === file.id ? file : f));
                default:
                    return state;
            }
        }
    );
    const [user, setUser] = useState(currentUser);
    return (
        <FileDataContext.Provider
            value={{
                user,
                optimisticFiles,
                setOptimisticFile,
            }}
        >
            {children}
        </FileDataContext.Provider>
    );
}
