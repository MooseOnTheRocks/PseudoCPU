export class Register {
    public readonly NAME: string;
    public readonly SIZE: number;
    private _data: number;

    constructor(name: string, size: number) {
        this.NAME = name;
        this.SIZE = size;
        this._data = 0;
    }

    public write(value: number) {
        this._data = value;
    }

    public read(): number {
        return this._data;
    }

    public toString() {
        return `${this.NAME}<0x${this._data.toString(16)}>`;
    }
}