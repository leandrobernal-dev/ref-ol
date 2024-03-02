"use client";
import { createContext, useState } from "react";

export const FileDataContext = createContext();
export default function FileDataContextProvider({ children }) {
    const [elements, setElements] = useState([]);
    return (
        <FileDataContext.Provider value={{ elements, setElements }}>
            {children}
        </FileDataContext.Provider>
    );
}
