import { Direction, GRID_SIZE, Vector2Array } from './const';
import { Cookie } from './cookie';
import { Renderer } from './renderer';
import { Segment } from './segment';
import { Snake } from './snake';
import { Time } from './time';
import { randi } from './utils';

export class Game {
    private _cookies: Set<Segment>;
    private _snake!: Snake;
    private _time: Time;
    private _timeout: number = 0;
    readonly renderer: Renderer;

    fieldWidth: number = 0;
    fieldHeight: number = 0;
    gridSize: number;

    constructor() {
        const canvas = this._createCanvas();

        this._cookies = new Set();
        this._timeout = 0;
        this._time = new Time();

        this.renderer = new Renderer(canvas);
        this.fieldWidth = Math.floor(canvas.width / GRID_SIZE);
        this.fieldHeight = Math.floor(canvas.height / GRID_SIZE);
        this.gridSize = GRID_SIZE;

        document.body.addEventListener('keyup', this._onPressKey);
        window.addEventListener('resize', this._onWindowResize);
    }

    start(): void {
        console.log('The game has been started!');
        this.respawn();
        this._loop();
    }

    respawn(): void {
        this.spawnSnake();
        this._cookies.clear();
        for (let i = 0; i < 15; i++) {
            this.spawnCookie();
        }
    }

    spawnCookie(): void {
        const x = randi(0, this.fieldWidth);
        const y = randi(0, this.fieldHeight);
        const segment = new Cookie(this, x, y);
        segment.setColor(Math.random(), Math.random(), Math.random());
        this._cookies.add(segment);
    }

    spawnSnake(): void {
        const startLength = 3;
        const startPotision: Vector2Array = [
            Math.round(this.fieldWidth / 2),
            Math.round(this.fieldHeight / 2)
        ];
        this._snake = new Snake(this, startPotision, startLength)
        this._snake.onDie = this._onSnakeDie;
        this._snake.onEat = this._onSnakeEat;
    }

    private _createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        document.body.appendChild(canvas);

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    private _onSnakeDie = (): void => {
        this._timeout += this._time.delta;
    }

    private _onSnakeEat = (cookie: Segment): void => {
        this._cookies.delete(cookie);
        this.spawnCookie()
    }

    private _onWindowResize = (): void => {
        const { canvas } = this.renderer;
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        this.fieldWidth = Math.floor(width / this.gridSize);
        this.fieldHeight = Math.floor(height / this.gridSize);
    }

    private _onPressKey = (e: KeyboardEvent): void => {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this._snake.setDirection(Direction.LEFT); break;
            case 'KeyD':
            case 'ArrowRight':
                this._snake.setDirection(Direction.RIGHT); break;
            case 'KeyW':
            case 'ArrowUp':
                this._snake.setDirection(Direction.TOP); break;
            case 'KeyS':
            case 'ArrowDown':
                this._snake.setDirection(Direction.BOTTOM); break;
            default: break;
        }
    }

    private _loop = () => {
        this._update();
        requestAnimationFrame(this._loop);
    }

    private _update = (): void => {
        this.renderer.clear();
        this._time.update();

        if (this._timeout >= 1) {
            this._timeout = 0;
            this.respawn();
        }

        this._snake.update(this._time.delta);

        for (const segment of this._snake.segments) {
            this._snake.eat(segment);
        }

        for (const cookie of this._cookies) {
            this._snake.eat(cookie);
        }

        this._snake.draw();
        for (const cookie of this._cookies) {
            cookie.draw();
        }
    }
}
