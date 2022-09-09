import { Segment } from './segment';

export class Cookie extends Segment {
    energy: number = 0;
    selected: boolean = false;

    draw(): void {
        const { gridSize } = this._game;
        this._game.renderer.drawRectangle(
            this.position[0] * gridSize,
            this.position[1] * gridSize,
            gridSize,
            gridSize,
            this.color,
            this.selected,
            this._game.wayPointSize
        );
    }
}