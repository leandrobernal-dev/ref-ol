import { useState } from "react";

class MoveCommand {
    constructor(elementIds, initialPositions, newPositions, setElements) {
        this.elementIds = elementIds;
        this.initialPositions = initialPositions;
        this.newPositions = newPositions;
        this.setElements = setElements;
    }

    execute() {
        this.setElements((prevElements) => {
            const newArray = [...prevElements];
            this.newPositions.forEach((newPosition) => {
                const index = newArray.findIndex(
                    (el) => el.id === newPosition.id
                );
                newArray[index].x = newPosition.x;
                newArray[index].y = newPosition.y;
            });
            return newArray;
        });
    }

    undo() {
        this.setElements((prevElements) => {
            const newArray = [...prevElements];
            this.initialPositions.forEach((initialPosition) => {
                const index = newArray.findIndex(
                    (el) => el.id === initialPosition.id
                );
                newArray[index].x = initialPosition.x;
                newArray[index].y = initialPosition.y;
            });
            return newArray;
        });
    }
}

class AddCommand {
    constructor(newElement, setElements) {
        this.newElement = newElement;
        this.setElements = setElements;
    }

    execute() {
        this.setElements((prevElements) => [...prevElements, this.newElement]);
    }

    undo() {
        this.setElements((prevElements) =>
            prevElements.filter((el) => el.id !== this.newElement.id)
        );
    }
}

class DeleteCommand {
    constructor(elementIds, elements, setElements) {
        this.elementIds = elementIds;
        this.elements = elements;
        this.setElements = setElements;
        this.deletedElements = [];
    }

    execute() {
        this.deletedElements = [];
        this.elementIds.forEach((id) => {
            const elementToDelete = this.elements.find((el) => el.id === id);
            if (elementToDelete) {
                this.deletedElements.push(elementToDelete);
                this.setElements((prevElements) =>
                    prevElements.filter((el) => el.id !== id)
                );
            }
        });
    }

    undo() {
        this.deletedElements.forEach((deletedElement) => {
            this.setElements((prevElements) => [
                ...prevElements,
                deletedElement,
            ]);
        });
    }
}

const useHistory = () => {
    const [history, setHistory] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const executeCommand = (command) => {
        const newHistory = history.slice(0, currentIndex + 1);
        const newCommandIndex = currentIndex + 1;

        setHistory([...newHistory, command]);
        setCurrentIndex(newCommandIndex);

        command.execute();
    };

    const undo = () => {
        if (currentIndex >= 0) {
            const currentCommand = history[currentIndex];
            currentCommand.undo();
            setCurrentIndex(currentIndex - 1);
        }
    };

    const redo = () => {
        if (currentIndex < history.length - 1) {
            const nextCommandIndex = currentIndex + 1;
            const nextCommand = history[nextCommandIndex];
            nextCommand.execute();
            setCurrentIndex(nextCommandIndex);
        }
    };

    return { executeCommand, undo, redo, history };
};

export default useHistory;
export { AddCommand, DeleteCommand };
