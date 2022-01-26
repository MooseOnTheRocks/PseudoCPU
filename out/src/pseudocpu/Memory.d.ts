export declare class Memory {
    readonly SIZE: number;
    private _data;
    constructor(size: number);
    write(address: number, value: number): void;
    read(address: number): number;
    toString(withOffset?: number): string;
}
