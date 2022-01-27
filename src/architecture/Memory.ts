export class Memory {
    public readonly NAME: string;
    public readonly SIZE: number;
    private _data: Array<number>;
    private _dataLine: number;
    private _addressLine: number;
    private _enable: boolean;

    constructor(name: string, size: number) {
        this.NAME = name;
        this.SIZE = size;
        this._data = new Array<number>(this.SIZE);
        this._data.fill(0);
        this._dataLine = 0;
        this._addressLine = 0;
        this._enable = false;
    }

    public clock() {
        if (this._enable) {
            this._data[this._addressLine] = this._dataLine;
        }
    }

    public readData(): number {
        return this._dataLine;
    }

    public writeAddress(address: number) {
        this._addressLine = address;
    }

    public writeData(data: number) {
        this._dataLine = data;
    }

    public setEnable() {
        this._enable = true;
    }

    public clearEnable() {
        this._enable = false;
    }

    public write(address: number, data: number) {
        this._data[address] = data;
    }

    public read(address: number): number {
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