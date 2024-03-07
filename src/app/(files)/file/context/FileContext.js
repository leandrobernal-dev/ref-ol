"use client";
import ImageElement from "@/app/(files)/file/classes/ImageElement";
import { createContext, useEffect, useState } from "react";

export const FileContext = createContext();

export default function FileContextProvider({ children, images }) {
    const [elements, setElements] = useState([]);
    const [progress, setProgress] = useState({
        total: images.length,
        finished: 0,
    });

    useEffect(() => {
        async function createImageElements() {
            const imageElements = [];
            for (const imageData of images) {
                const imageElement = new ImageElement(
                    imageData.url,
                    imageData.transform.x,
                    imageData.transform.y,
                    false,
                    imageData.id
                );
                await imageElement.create();
                imageElements.push(imageElement);
                setProgress((prev) => {
                    return {
                        ...prev,
                        finished: imageElements.length,
                    };
                });
            }
            setElements(imageElements);
        }
        createImageElements();
    }, []);

    return (
        <FileContext.Provider
            value={{
                elements,
                setElements,
                progress,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}
