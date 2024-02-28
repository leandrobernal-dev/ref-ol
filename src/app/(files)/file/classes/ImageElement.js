class ImageElement {
    constructor(src, x, y) {
        this.src = src;
        this.x = x;
        this.y = y;
        this.width = null;
        this.height = null;
        this.isHovered = false;
        this.image = null;
        this.rotationAngle = 0;
        this.id = null;
        this.selected = false;
    }

    create() {
        this.image = new Image();
        this.image.src = this.src;
        this.width = this.image.naturalWidth;
        this.height = this.image.naturalHeight;
        this.id = Math.random().toString(36).substring(2, 9);
    }
    resize(w, h) {
        this.width = w;
        this.height = h;
    }
}

export default ImageElement;