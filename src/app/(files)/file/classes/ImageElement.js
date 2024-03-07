class ImageElement {
    constructor({
        id = Math.random().toString(36).substring(2, 9),
        key = null,
        src,
        x,
        y,
        width = null,
        height = null,
        rotationAngle = 0,
        selected = false,
    }) {
        this.id = id;
        this.key = key;
        this.src = src;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotationAngle = rotationAngle;
        this.image = null;
        this.selected = selected;
    }

    async create() {
        this.image = await this.loadImage(this.src);
        this.width = this.width ? this.width : this.image.width;
        this.height = this.height ? this.height : this.image.height;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (error) => reject(error);
            img.src = src;
        });
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }
}

export default ImageElement;
