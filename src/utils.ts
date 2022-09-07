import { Vector3Array } from "./const";

export function randi(min: number, max: number) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export function toGreyScale(color: Vector3Array): Vector3Array {
    const [r, g, b] = color;
    const avg = (r + g + b) / 3;
    return [avg, avg, avg]
}
