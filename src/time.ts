export class Time {
    time = performance.now();
    delta = 0;
    elapsed = 0;
    scale = 1;

    reset() {
        this.time = performance.now();
        this.elapsed = 0;
        this.delta = 0;
        this.scale = 1;
    }

    update() {
        const now = performance.now();

        this.delta = (now - this.time) * this.scale * 0.001;
        this.elapsed += this.delta;
        this.time = now;
    }
}