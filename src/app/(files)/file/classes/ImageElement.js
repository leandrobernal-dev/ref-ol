class ImageElement {
    constructor(
        src,
        x,
        y,
        selected = false,
        id = Math.random().toString(36).substring(2, 9)
    ) {
        this.src = src;
        this.x = x;
        this.y = y;
        this.width = null;
        this.height = null;
        this.image = null;
        this.rotationAngle = 0;
        this.id = id;
        this.selected = selected;
    }

    async create() {
        this.image = await this.loadImage(this.src);
        this.width = this.image.width;
        this.height = this.image.height;
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
