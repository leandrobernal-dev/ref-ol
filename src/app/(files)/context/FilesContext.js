"use client";
import { createContext, useState } from "react";

export const FileDataContext = createContext();

export default function FileDataContextProvider({ children, files: myFiles }) {
    const [files, setFiles] = useState(myFiles);
    return (
        <FileDataContext.Provider value={{ files, setFiles }}>
            {children}
        </FileDataContext.Provider>
    );
}
