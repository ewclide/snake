import { getCellId } from './astar';
import { Vector2Array, Vector3Array } from './const';
import { Game } from './game';
import { Snake } from './snake';

export class Segment {
    spatialIndex: number = 0;
    position: Vector2Array;
    color: Vector3Array;
    owner: null | Snake;

    protected _game: Game;

    constructor(game: Game, x: number, y: number) {
        this.position = [x, y];
        this.color = [1, 0, 0];
        this.owner = null;
        this.spatialIndex = getCellId(this.position, game.fieldWidth);

        this._game = game;
    }

    get screenPosition(): Vector2Array {
        const { gridSize } = this._game;

        return [
            this.position[0] * gridSize,
            this.position[1] * gridSize,
        ];
    }

    setColor(r: number, g: number, b: number): this {
        this.color = [r, g, b];
        return this;
    }

    setPosition(x: number, y: number): this {
        this.position[0] = x;
        this.position[1] = y;
        this.spatialIndex = getCellId(this.position, this._game.fieldWidth);
        return this;
    }

    updateSpatialIndex(): void {
        this.spatialIndex = getCellId(this.position, this._game.fieldWidth);
    }

    draw(): void {
        const { gridSize } = this._game;
        this._game.renderer.drawRectangle(
            this.position[0] * gridSize,
            this.position[1] * gridSize,
            gridSize,
            gridSize,
            this.color
        );
    }
}
