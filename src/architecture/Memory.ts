import { MemoryMapping } from "./MemoryMap";

export class Memory implements MemoryMapping {
    public readonly NAME: string;
    public readonly SIZE: number;
    private _data: Array<number>;

    constructor(name: string, size: number) {
        this.NAME = name;
        this.SIZE = size;
        this._data = new Array<number>(this.SIZE);
        this._data.fill(0);
    }

    public write(address: number, data: number) {
        console.log(`${this.NAME}.write(${address}, ${data})`);
        this._data[address] = data;
    }

    public read(address: number): number {
        console.log(`${this.NAME}.read(${address})`);
        return this._data[address];
    }

    public toString(withOffset?: number) {
        let lines = [];
        for (let i = 0; i < this.SIZE; i++) {
            let address = withOffset ? i + withOffset : i;
            lines.push(`0x${address.toString(16)}: 0x${this._data[i].toString(16)}`);
        }
        return lines.join("\n");
    }
}