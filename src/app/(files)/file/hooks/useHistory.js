import { useState } from "react";

/**
 * Some execute commands are empty because the operations are done outside the command
 * Exceptions are the AddCommand and DeleteCommand
 */

class MoveCommand {
    constructor(elementIds, initialPositions, newPositions, setElements) {
        this.elementIds = elementIds;
        this.initialPositions = initialPositions;
        this.newPositions = newPositions;
        this.setElements = setElements;
    }
    execute() {}
    redo() {
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

class RotateCommand {
    constructor(elementIds, initialTransforms, newTransforms, setElements) {
        this.elementIds = elementIds;
        this.initialTransforms = initialTransforms;
        this.newTransforms = newTransforms;
        this.setElements = setElements;
    }
    execute() {}
    redo() {
        this.setElements((prevElements) => {
            const newArray = [...prevElements];
            this.newTransforms.forEach((newTransform) => {
                const index = newArray.findIndex(
                    (el) => el.id === newTransform.id
                );
                newArray[index].x = newTransform.x;
                newArray[index].y = newTransform.y;
                newArray[index].rotationAngle = newTransform.rotationAngle;
            });
            return newArray;
        });
    }
    undo() {
        this.setElements((prevElements) => {
            const newArray = [...prevElements];
            this.initialTransforms.forEach((initialTransform) => {
                const index = newArray.findIndex(
                    (el) => el.id === initialTransform.id
                );
                newArray[index].rotationAngle = initialTransform.rotationAngle;
                newArray[index].x = initialTransform.x;
                newArray[index].y = initialTransform.y;
            });
            return newArray;
        });
    }
}

class ResizeCommand {
    constructor(elementIds, initialTransforms, newTransforms, setElements) {
        this.elementIds = elementIds;
        this.initialTransforms = initialTransforms;
        this.newTransforms = newTransforms;
        this.setElements = setElements;
    }

    execute() {}
    redo() {
        this.setElements((prevElements) => {
            const newArray = [...prevElements];
            this.newTransforms.forEach((newTransform) => {
                const index = newArray.findIndex(
                    (el) => el.id === newTransform.id
                );
                newArray[index].x = newTransform.x;
                newArray[index].y = newTransform.y;
                newArray[index].width = newTransform.width;
                newArray[index].height = newTransform.height;
            });
            return newArray;
        });
    }

    undo() {
        this.setElements((prevElements) => {
            const newArray = [...prevElements];
            this.initialTransforms.forEach((initialTransform) => {
                const index = newArray.findIndex(
                    (el) => el.id === initialTransform.id
                );
                newArray[index].x = initialTransform.x;
                newArray[index].y = initialTransform.y;
                newArray[index].width = initialTransform.width;
                newArray[index].height = initialTransform.height;
            });
            return newArray;
        });
    }
}

class SelectCommand {
    constructor(initialSelectionIds, newSelectionIds, setElements) {
        this.initialSelectionIds = initialSelectionIds;
        this.newSelectionIds = newSelectionIds;
        this.setElements = setElements;
    }
    execute() {}
    redo() {
        this.setElements((prevElements) => {
            const newArray = prevElements.map((el, index) => ({
                ...el,
                selected: this.newSelectionIds[index],
            }));
            return newArray;
        });
    }
    undo() {
        this.setElements((prevElements) => {
            const newArray = prevElements.map((el, index) => ({
                ...el,
                selected: this.initialSelectionIds[index],
            }));
            return newArray;
        });
    }
}

class AddCommand {
    constructor(newElement, setElements) {
        this.newElement = newElement;
        this.setElements = setElements;
    }

    redo() {
        this.execute();
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

    redo() {
        this.execute();
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
            nextCommand.redo();
            setCurrentIndex(nextCommandIndex);
        }
    };

    return { executeCommand, undo, redo, history };
};

export default useHistory;
export {
    MoveCommand,
    ResizeCommand,
    AddCommand,
    DeleteCommand,
    RotateCommand,
    SelectCommand,
};
