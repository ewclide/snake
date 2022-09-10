import { Direction, Vector2Array } from './const';
import { Game } from './game';
import { Segment } from './segment';
import { toGreyScale } from './utils';

type onSnakeEat = (cookie: Segment) => void;
type onSnakeDie = () => void;
type onSnakeMove = () => void;

export class Snake {
    static readonly LEFT: Vector2Array = [-1, 0];
    static readonly RIGHT: Vector2Array = [1, 0];
    static readonly TOP: Vector2Array = [0, -1];
    static readonly BOTTOM: Vector2Array = [0, 1];

    onEat: onSnakeEat = () => undefined;
    onDie: onSnakeDie = () => undefined;
    onMoveStart: onSnakeMove = () => undefined;
    onMoveEnd: onSnakeMove = () => undefined;

    alive: boolean = true;
    speed: number = 0;
    segments: Segment[];
    direction: Direction = Direction.LEFT;
    movement: Vector2Array = Snake.LEFT;

    private _game: Game;
    private _time: number;

    constructor(game: Game, position: Vector2Array, length: number = 3) {
        this._game = game;
        this._time = 0;
        this.segments = [];
        this.reset(position, length);
    }

    get length(): number {
        return this.segments.length;
    }

    reset(position: Vector2Array, length: number): void {
        this._time = 0
        this.speed = 0.08;
        this.movement = Snake.LEFT;
        this.direction = Direction.LEFT;
        this.segments = [];

        const pos: Vector2Array = [...position];
        for (let i = 0; i < length; i++) {
            const segment = new Segment(this._game, ...pos);
            segment.owner = this;
            segment.setColor(0, Math.random(), 0);
            this.segments.push(segment)
            pos[0] += 1;
        }
    }

    draw(): void {
        for (const segment of this.segments) {
            segment.draw();
        }
    }

    eat(cookie: Segment): void {
        if (!this.alive) { return; }

        const [head] = this.segments;
        if (head == cookie) { return; }

        const [hx, hy] = head.position;
        const [cx, cy] = cookie.position;

        if (hx == cx && hy == cy) {
            if (cookie.owner === this) {
                this._fail();
            } else {
                this._consume(cookie);
            }
        }
    }

    private _fail(): void {
        this.onDie();
        this.alive = false;
        for (const segment of this.segments) {
            segment.setColor(...toGreyScale(segment.color));
        }
    }

    private _consume(cookie: Segment): void {
        cookie.owner = this
        cookie.color = [0, toGreyScale(cookie.color)[0], 0];
        this.segments.unshift(cookie);
        this.onEat(cookie);
    }

    update(dt: number): void {
        if (!this.alive) { return; }

        this._time += dt;

        if (this._time >= this.speed) {
            this._time = 0;
        } else {
            return;
        }

        this.onMoveStart();

        const [first] = this.segments;
        const [x, y] = first.position;
        const [dx, dy] = this.movement;

        let px = x + dx;
        if (px > this._game.fieldWidth) {
            px = 0;;
        } else if (px < 0) {
            px = this._game.fieldWidth;
        }

        let py = y + dy;
        if (py > this._game.fieldHeight){
            py = 0;
        } else if (py < 0) {
            py = this._game.fieldHeight;
        }

        const last = this.segments.pop()!;
        this.segments.unshift(last);
        last.setPosition(px, py);

        for (const segment of this.segments) {
            segment.updateSpatialIndex();
        }

        this.onMoveEnd();
    }

    reverse(): void {
        let direction = this.direction;
        if (this.direction === Direction.TOP) {
            direction = Direction.BOTTOM;
        } else if (this.direction === Direction.BOTTOM) {
            direction = Direction.TOP;
        } else if (this.direction === Direction.LEFT) {
            direction = Direction.RIGHT;
        } else if (this.direction === Direction.RIGHT) {
            direction = Direction.LEFT;
        }

        this.direction = direction;
        this.movement = this._getMovement(direction);
        this.segments.reverse();
    }

    setDirection(direction: Direction): void {
        const movement = this._getMovement(direction);
        if (this._isReverseMovement(movement)) {
            this.segments.reverse();
        }

        this.direction = direction;
        this.movement = movement;
    }

    private _isReverseMovement(movement: Vector2Array): boolean {
        const [x1, y1] = this.movement;
        const [x2, y2] = movement;
        return x1 * x2 + y1 * y2 === -1;
    }

    private _getMovement(direction: Direction): Vector2Array {
        let movement;
        if (direction === Direction.LEFT) {
            movement = Snake.LEFT;
        } else if (direction === Direction.RIGHT) {
            movement = Snake.RIGHT;
        } else if (direction === Direction.TOP) {
            movement = Snake.TOP;
        } else if (direction === Direction.BOTTOM) {
            movement = Snake.BOTTOM;
        } else {
            throw new Error();
        }

        return movement;
    }
}
