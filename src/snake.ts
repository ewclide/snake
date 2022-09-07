import { Direction, Vector2Array } from './const';
import { Game } from './game';
import { Segment } from './segment';
import { toGreyScale } from './utils';

type onSnakeEat = (cookie: Segment) => void;
type onSnakeDie = () => void;

export class Snake {
    static readonly LEFT = [-1, 0];
    static readonly RIGHT = [1, 0];
    static readonly TOP = [0, -1];
    static readonly BOTTOM = [0, 1];

    onEat: onSnakeEat = () => undefined;
    onDie: onSnakeDie = () => undefined;
    direction: number[] = Snake.LEFT;
    alive: boolean = true;
    speed: number = 0.15;
    segments: Segment[];

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
        this.speed = 0.15;
        this.direction = Snake.LEFT;
        this.segments = [];

        const pos: Vector2Array = [...position];
        for (let i = 0; i < length; i++) {
            const segment = new Segment(this._game, ...pos);
            segment.owner = this;
            segment.setColor(Math.random(), Math.random(), Math.random());
            this.segments.push(segment)
            pos[0] += 1;
        }
    }

    draw(): void {
        for (const segment of this.segments) {
            segment.draw();
        }
    }

    fail(): void {
        this.onDie();
        this.alive = false;
        for (const segment of this.segments) {
            segment.setColor(...toGreyScale(segment.color));
        }
    }

    consume(cookie: Segment): void {
        cookie.owner = this
        this.segments.unshift(cookie);
        this.onEat(cookie);
    }

    eat(cookie: Segment): void {
        const [head] = this.segments;
        if (head == cookie) { return; }

        const [dx, dy] = this.direction;
        const [hx, hy] = head.position;
        const [cx, cy] = cookie.position;

        if (hx + dx == cx && hy + dy == cy) {
            if (cookie.owner === this) {
                this.fail();
            } else {
                this.consume(cookie);
            }
        }
    }

    update(dt: number): void {
        if (!this.alive) { return; }

        this._time += dt;

        if (this._time >= this.speed) {
            this._time = 0;
        } else {
            return;
        }

        const [first] = this.segments;
        const [x, y] = first.position;
        const [dx, dy] = this.direction;

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
    }

    reverse(): void {
        const idx = this.segments.length - 1;
        const last0 = this.segments[idx - 0];
        const last1 = this.segments[idx - 1];
        this.segments.reverse();
        this.direction = [
            last0.position[0] - last1.position[0],
            last0.position[1] - last1.position[1]
        ];
    }

    setDirection(direction: Direction): void {
        let dir;
        if (direction === Direction.LEFT) {
            dir = Snake.LEFT;
        } else if (direction === Direction.RIGHT) {
            dir = Snake.RIGHT;
        } else if (direction === Direction.TOP) {
            dir = Snake.TOP;
        } else if (direction === Direction.BOTTOM) {
            dir = Snake.BOTTOM;
        } else {
            throw new Error();
        }

        this.direction = dir;

        if ((this.direction[0] + dir[0]) === 0 && (this.direction[1] + dir[1]) === 0) {
            this.reverse();
        }
    }
}
