export declare class Register {
    readonly name: string;
    readonly SIZE: number;
    private _data;
    constructor(name: string, size: number);
    write(value: number): void;
    read(): number;
    toString(): string;
}
