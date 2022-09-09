import { aStar, getCellId } from './astar';
import { Direction, GRID_SIZE, SEGMENTS_PER_WIDTH, Vector2Array } from './const';
import { Cookie } from './cookie';
import { Renderer } from './renderer';
import { Segment } from './segment';
import { Snake } from './snake';
import { Time } from './time';
import { randi } from './utils';

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

export class Game {
    private _cookies: Map<number, Cookie>;
    private _selectedCookie: Cookie | null = null;
    private _snake!: Snake;
    private _time: Time;
    private _timeout: number = 0;
    private _stopped: boolean = false;
    private _path: Vector2Array[] = [];
    private _obstacles: Set<number> = new Set();

    readonly renderer: Renderer;

    cookiesCount: number = 25;
    startLength: number = 3;
    fieldWidth: number = 0;
    fieldHeight: number = 0;
    gridSize: number;
    segmentsPerWidth: number;
    wayPointSize: number;

    constructor() {
        const canvas = this._createCanvas();

        this._cookies = new Map();
        this._timeout = 0;
        this._time = new Time();

        this.renderer = new Renderer(canvas);
        this.gridSize = Math.round(canvas.width / SEGMENTS_PER_WIDTH);
        this.segmentsPerWidth = SEGMENTS_PER_WIDTH;
        this.fieldWidth = Math.floor(canvas.width / this.gridSize);
        this.fieldHeight = Math.floor(canvas.height / this.gridSize);
        this.wayPointSize = Math.round(this.gridSize / 5);

        document.body.addEventListener('keyup', this._onPressKey);
        canvas.addEventListener('pointerup', this._onClick);
        window.addEventListener('resize', this._onWindowResize);
        // canvas.addEventListener('click', () => {
        //     canvas.requestPointerLock();
        //     // toggleFullScreen();
        // })
    }

    start(): void {
        console.log('The game has been started!');
        this.respawn();
        this._loop();
    }

    respawn(): void {
        this.spawnSnake();
        this._stopped = false;
        this._cookies.clear();

        for (let i = 0; i < this.cookiesCount; i++) {
            this.spawnCookie();
        }
    }

    spawnCookie(): void {
        const x = randi(0, this.fieldWidth);
        const y = randi(0, this.fieldHeight);
        const segment = new Cookie(this, x, y);
        segment.setColor(Math.random(), Math.random(), Math.random());
        this._cookies.set(segment.spatialIndex, segment);
    }

    spawnSnake(): void {
        const startPotision: Vector2Array = [
            Math.round(this.fieldWidth / 2),
            Math.round(this.fieldHeight / 2)
        ];
        this._snake = new Snake(this, startPotision, this.startLength);
        this._snake.onDie = this._onSnakeDie;
        this._snake.onEat = this._onSnakeEat;
        this._snake.onMoveStart = this._onSnakeMoveStart;
        this._snake.onMoveEnd = this._onSnakeMoveEnd;
        this._path = [];
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
        this._stopped = true;
    }

    private _onSnakeEat = (cookie: Segment): void => {
        if (cookie instanceof Cookie) {
            cookie.selected = false;
            this._selectedCookie = null;
        }
        this._cookies.delete(cookie.spatialIndex);
        this.spawnCookie()
    }

    private _onSnakeMoveEnd = (): void => {
        for (const segment of this._snake.segments) {
            this._obstacles.add(segment.spatialIndex);
        }

        for (const segment of this._snake.segments) {
            this._snake.eat(segment);
        }

        for (const cookie of this._cookies.values()) {
            this._snake.eat(cookie);
        }
    }

    private _onSnakeMoveStart = (): void => {
        if (this._selectedCookie !== null) {
            this._findWay(this._selectedCookie.position);
        }

        const p = this._path.pop();
        if (p !== undefined) {
            const ps = this._snake.segments[0].position;
            const x = p[0] - ps[0];
            const y = p[1] - ps[1];

            let dir = this._snake.direction;
            if (x === 1 && y === 0) {
                dir = Direction.RIGHT;
            } else if (x === 0 && y === 1) {
                dir = Direction.BOTTOM;
            } else if (x === -1 && y === 0) {
                dir = Direction.LEFT;
            } else if (x === 0 && y === -1) {
                dir = Direction.TOP;
            }

            this._snake.setDirection(dir);
        }

        for (const segment of this._snake.segments) {
            this._obstacles.delete(segment.spatialIndex);
        }
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
                this._snake.setDirection(Direction.LEFT);
                this._resetSelection();
                break;
            case 'KeyD':
            case 'ArrowRight':
                this._snake.setDirection(Direction.RIGHT);
                this._resetSelection();
                break;
            case 'KeyW':
            case 'ArrowUp':
                this._snake.setDirection(Direction.TOP);
                this._resetSelection();
                break;
            case 'KeyS':
            case 'ArrowDown':
                this._snake.setDirection(Direction.BOTTOM);
                this._resetSelection();
                break;
            default: break;
        }
    }

    private _resetSelection(): void {
        this._path = [];
        if (this._selectedCookie) {
            this._selectedCookie.selected = false;
            this._selectedCookie = null;
        }
    }

    private _selectCookie(pos: Vector2Array): boolean {
        const clickIndex = getCellId(pos, this.fieldWidth);
        const cookie = this._cookies.get(clickIndex);

        this._resetSelection();

        if (cookie) {
            this._selectedCookie = cookie;
            this._selectedCookie.selected = true;
        }

        return cookie !== undefined;
    }

    private _findWay(target: Vector2Array): void {
        const head = this._snake.segments[0];
        const path = aStar(head.position, target, this.fieldWidth, this.fieldHeight, this._obstacles);
        this._path = path;
    }

    private _onClick = (e: PointerEvent): void => {
        const { clientX, clientY } = e;
        const x = Math.floor(clientX / this.gridSize);
        const y = Math.floor(clientY / this.gridSize);

        const clickPosition: Vector2Array = [x, y];
        const cookie = this._selectCookie(clickPosition);

        if (cookie) {
            this._findWay(clickPosition);
        }
    }

    private _renderPath(): void {
        const s1 = this.gridSize / 2;

        for (const p of this._path) {
            this.renderer.drawRectangle(
                p[0] * this.gridSize + s1 - this.wayPointSize / 2,
                p[1] * this.gridSize + s1 - this.wayPointSize / 2,
                this.wayPointSize,
                this.wayPointSize,
                [1, 1, 1]
            );
        }
    }

    private _loop = () => {
        this._update();
        requestAnimationFrame(this._loop);
    }

    private _update = (): void => {
        this.renderer.clear();
        this._time.update();

        this._renderPath();

        if (this._stopped) {
            this._timeout += this._time.delta;
        }

        if (this._timeout >= 1) {
            this._timeout = 0;
            this.respawn();
        }

        this._snake.update(this._time.delta);
        this._snake.draw();

        for (const cookie of this._cookies.values()) {
            cookie.draw();
        }
    }
}
