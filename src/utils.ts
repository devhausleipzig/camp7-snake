export type Coordinate2D = [number, number];

export function coordToId([x, y]: Coordinate2D) {
    return `__${x}_${y}`;
}

export function querySelector(selector: string) {
    return document.querySelector(selector) as HTMLElement;
}

export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

export function randomNumber(range: number) {
    return Math.floor(Math.random() * range);
}

export function randomCoordinate(xRange: number, yRange: number): Coordinate2D {
    return [randomNumber(xRange), randomNumber(yRange)];
}

export function coordToIdToElement(coord: Coordinate2D) {
    const id = coordToId(coord);
    const element = querySelector(`#${id}`);
    return element;
}

export function toggleClass(className: string, elements: Array<HTMLElement>) {
    for (const element of elements) {
        element.classList.toggle(className);
    }
}

export function removeChildren(element: HTMLElement) {
    while (element.lastElementChild) {
        element.removeChild(element.lastElementChild);
    }
}
