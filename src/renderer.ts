export class Renderer {
    readonly canvas: HTMLCanvasElement;
    readonly clearColor: number[];
    private _ctx: CanvasRenderingContext2D;
    private _img: HTMLImageElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.clearColor = [0, 0, 0];

        this._img = new Image();
        this._ctx = canvas.getContext('2d')!;
    }

    clear(): void {
        const { width, height } = this.canvas;
        this._ctx.clearRect(0, 0, width, height);
    }

    drawRectangle(
        x: number,
        y: number,
        w: number,
        h: number,
        color: number[],
        border: boolean = false,
        bsize: number = 0
    ): void {
        const [r, g, b] = color;

        if (border) {
            this._ctx.fillStyle = 'white';
            this._ctx.fillRect(x - bsize, y - bsize, w + bsize * 2, h + bsize * 2);
        }

        this._ctx.fillStyle = `rgb(${r * 256},${g * 256},${b * 256})`;
        this._ctx.fillRect(x, y, w, h);
    }
}