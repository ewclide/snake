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

interface Cell {
    id: number;
    parent: number;
    G: number;
    H: number;
    F: number;
}

const getCellId = (p: Vector2Array, w: number) => p[1] * w + p[0];
const getCellCoords = (p: number, w: number): Vector2Array => {
    const y = Math.floor(p / w);
    const x = p - y * w;
    return [x, y];
};

const calcH = (p0: number, p1: number, w: number): number => {
    const y0 = Math.floor(p0 / w);
    const y1 = Math.floor(p1 / w);
    const x0 = p0 - y0 * w;
    const x1 = p1 - y1 * w;

    const res = Math.abs(x1 - x0) + Math.abs(y1 - y0)
    // console.log(
    //     'H:', res,
    //     'id0', p0, getCellCoords(p0, w),
    //     'id1', p1, getCellCoords(p1, w)
    // )

    // TODO: ability to move outside of borders
    return res;
}

const getNeighborId = (p: number, idx: number, w: number, h: number): number => {
    if (p < 0) { return -1; }

    const y = Math.floor(p / w);
    const x = p - y * w;

    if (x < 0 || x >= w) { return -1; }
    if (y < 0 || y >= h) { return -1; }

    switch (idx) {
        case 0: return y * w + (x - 1);
        case 1: return (y - 1) * w + x;
        case 2: return y * w + (x + 1);
        case 3: return (y + 1) * w + x;
        default: throw new Error();
    }
}

function aStar(src: Vector2Array, dst: Vector2Array, w: number, h: number, obstacles: Set<number>): Vector2Array[] {
    const all = new Map<number, Cell>();
    const opened = new Map<number, Cell>();
    const closed = new Map<number, Cell>();

// 1) Добавить стартовую клетку в открытый список (при этом её значения G, H и F равны 0).
// 2) Повторять следующие шаги:
//     - Ищем в открытом списке клетку с наименьшим значением величины F, делаем её текущей.
//     - Удаляем текущую клетку из открытого списка и помещаем в закрытый список.
//     - Для каждой из соседних, к текущей клетке, клеток:
//         - Если клетка непроходима или находится в закрытом списке, игнорируем её.
//         - Если клетка не в открытом списке, то добавляем её в открытый список, при этом рассчитываем для неё значения G, H и F,
//           и также устанавливаем ссылку родителя на текущую клетку.
//         - Если клетка находится в открытом списке, то сравниваем её значение G со значением G таким,
//           что если бы к ней пришли через текущую клетку. Если сохранённое в проверяемой клетке значение G больше нового,
//           то меняем её значение G на новое, пересчитываем её значение F и изменяем указатель на родителя так, чтобы она указывала на текущую клетку.
//     Останавливаемся, если:
//         - В открытый список добавили целевую клетку (в этом случае путь найден).
//         - Открытый список пуст (в этом случае к целевой клетке пути не существует).
// 3) Сохраняем путь, двигаясь назад от целевой точки, проходя по указателям на родителей до тех пор, пока не дойдём до стартовой клетки.

    let srsId = getCellId(src, w);
    let dstId = getCellId(dst, w);
    const startCell = {
        id: srsId,
        parent: -1,
        G: 0,
        H: calcH(srsId, dstId, w),
        F: calcH(srsId, dstId, w)
    }

    opened.set(srsId, startCell);
    all.set(srsId, startCell);

    let cur: Cell = startCell;
    let vv = 0;
    while (true) {
        let len = Infinity;
        for (const cell of opened.values()) {
            if (cell.F < len) {
                len = cell.F;
                cur = cell;
            }
        }

        opened.delete(cur.id);
        closed.set(cur.id, cur);

        for (let i = 0; i < 4; i++) {
            const id = getNeighborId(cur.id, i, w, h);

            if (id < 0) { continue; }
            if (obstacles.has(id)) { continue; }
            if (closed.has(id)) { continue; }

            const cell = opened.get(id);
            if (cell !== undefined) {
                // TODO: G alwayls equal 10 in that case
                cell.parent = cur.id;
            } else {
                const G = 0;
                const H = calcH(id, dstId, w);
                const F = G + H;
                const neighbor = {
                    id,
                    parent: cur.id,
                    G, H, F
                };

                opened.set(id, neighbor);
                all.set(id, neighbor)
            }
        }

        if (opened.size === 0) { break; }
        if (opened.has(dstId)) { break; }
        if (vv++ > w * h) { break; }
    }

    const path: Vector2Array[] = [];
    let cid = dstId;
    while (cid !== -1) {
        const pc = all.get(cid);
        if (pc === undefined) { break; }
        path.push(getCellCoords(cid, w));
        cid = pc.parent;
    }

    return path;
}

export class Game {
    private _cookies: Set<Segment>;
    private _snake!: Snake;
    private _time: Time;
    private _timeout: number = 0;
    private _stopped: boolean = false;
    private _path: Vector2Array[] = [];
    readonly renderer: Renderer;

    cookiesCount: number = 25;
    startLength: number = 3;
    fieldWidth: number = 0;
    fieldHeight: number = 0;
    gridSize: number;
    segmentsPerWidth: number;

    constructor() {
        const canvas = this._createCanvas();

        this._cookies = new Set();
        this._timeout = 0;
        this._time = new Time();

        this.renderer = new Renderer(canvas);
        this.gridSize = Math.round(canvas.width / SEGMENTS_PER_WIDTH);
        this.segmentsPerWidth = SEGMENTS_PER_WIDTH;
        this.fieldWidth = Math.floor(canvas.width / this.gridSize);
        this.fieldHeight = Math.floor(canvas.height / this.gridSize);

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
        this._cookies.add(segment);
    }

    spawnSnake(): void {
        const startPotision: Vector2Array = [
            Math.round(this.fieldWidth / 2),
            Math.round(this.fieldHeight / 2)
        ];
        this._snake = new Snake(this, startPotision, this.startLength);
        this._snake.onDie = this._onSnakeDie;
        this._snake.onEat = this._onSnakeEat;
        this._snake.onMove = this._onSnakeMove;
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
        this._cookies.delete(cookie);
        this.spawnCookie()
    }

    private _onSnakeMove = (): void => {
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
            console.log(ps, p, Direction[dir])

            this._snake.setDirection(dir);
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

    private _onClick = (e: PointerEvent): void => {
        const { clientX, clientY } = e;
        const x = Math.floor(clientX / this.gridSize);
        const y = Math.floor(clientY / this.gridSize);

        const [head] = this._snake.segments;
        const path = aStar(head.position, [x, y], this.fieldWidth, this.fieldHeight, new Set());
        path.pop();
        this._path = path;
        console.log(path)

        // this._renderPath(path);
    }

    private _renderPath(path: Vector2Array[]): void {
        for (const p of path) {
            this.renderer.drawRectangle(
                p[0] * this.gridSize,
                p[1] * this.gridSize,
                this.gridSize,
                this.gridSize,
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

        if (this._stopped) {
            this._timeout += this._time.delta;
        }

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
