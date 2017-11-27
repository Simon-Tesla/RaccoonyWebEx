declare module 'debounce' {
    export default function debounce<A extends Function>(f: A, interval?: number, immediate?: boolean): A & { clear(): void; };
}