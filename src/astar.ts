import { Vector2Array } from './const';

interface Cell {
    id: number;
    parent: number;
    G: number;
    H: number;
    F: number;
}

export const getCellId = (p: Vector2Array, w: number) => p[1] * w + p[0];

export const getCellCoords = (p: number, w: number): Vector2Array => {
    const y = Math.floor(p / w);
    const x = p - y * w;
    return [x, y];
};

export const calcH = (p0: number, p1: number, w: number): number => {
    const y0 = Math.floor(p0 / w);
    const y1 = Math.floor(p1 / w);
    const x0 = p0 - y0 * w;
    const x1 = p1 - y1 * w;

    // TODO: ability to move outside of borders
    return Math.abs(x1 - x0) + Math.abs(y1 - y0);
}

export const getNeighborId = (p: number, idx: number, w: number, h: number): number => {
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

// This function supports only 4 degrees of freedom
export function aStar(src: Vector2Array, dst: Vector2Array, w: number, h: number, obstacles: Set<number>): Vector2Array[] {

    const all = new Map<number, Cell>();
    const opened = new Map<number, Cell>();
    const closed = new Map<number, Cell>();

    let srsId = getCellId(src, w);
    let dstId = getCellId(dst, w);
    const sdtH = calcH(srsId, dstId, w);
    const startCell = {
        id: srsId,
        parent: -1,
        G: 0,
        H: sdtH,
        F: sdtH
    }

    opened.set(srsId, startCell);
    all.set(srsId, startCell);

    let cur: Cell = startCell;
    let req = 0;
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
        // Recursion insurance
        if (req++ > w * h) { break; }
    }

    const path: Vector2Array[] = [];

    let cell = all.get(dstId);
    while (cell !== undefined) {
        if (cell === startCell) { break; }
        path.push(getCellCoords(cell.id, w));
        cell = all.get(cell.parent);
    }

    return path;
}