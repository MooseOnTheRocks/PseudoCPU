export class Register {
    public readonly NAME: string;
    public readonly SIZE: number;
    private _data: number;
    private _dataLine: number;
    private _enable: boolean;

    constructor(name: string, size: number) {
        this.NAME = name;
        this.SIZE = size;
        this._data = 0;
        this._dataLine = 0;
        this._enable = false;
    }

    public clearEnable() {
        this._enable = false;
    }

    public setEnable() {
        this._enable = true;
    }

    public clock() {
        if (this._enable) {
            this._data = this._dataLine;
        }
    }

    public writeData(data: number) {
        this._dataLine = data;
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