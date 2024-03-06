"use client";
import { createContext, useState } from "react";

export const FileDataContext = createContext();

export default function FileDataContextProvider({
    children,
    files: myFiles,
    user: currentUser,
}) {
    const [user, setUser] = useState(currentUser);
    return (
        <FileDataContext.Provider
            value={{
                user,
            }}
        >
            {children}
        </FileDataContext.Provider>
    );
}
