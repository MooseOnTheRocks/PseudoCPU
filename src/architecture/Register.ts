import { Bit, BitField } from "@/Bit";

export class Register {
    public readonly NAME: string;
    public readonly SIZE: number;
    // private _data: number;
    private _bits: BitField;

    constructor(name: string, size: number) {
        this.NAME = name;
        this.SIZE = size;
        // this._data = 0;
        // this._data = new Array<Bit>();
        // for (let i = 0; i < size; i++) {
        //     this._data.push(new Bit());
        // }
        this._bits = new BitField(size);
    }

    public write(value: number) {
        // this._data = value;
        // for (let i = 0; i < this.SIZE; i++) {
        //     let bit_value = (value >> i) & 1;
        //     if (bit_value === 1) {
        //         this._data[i].set();
        //     }
        //     else {
        //         this._data[i].clear();
        //     }
        // }
        for (let i = 0; i < this.SIZE; i++) {
            let bit_value = (value >> i) & 1;
            if (bit_value === 1) {
                this._bits.set(i);
            }
            else {
                this._bits.clear(i);
            }
        }
    }

    public read(): number {
        // return this._data;
        // let total = 0;
        // for (let i = 0; i < this.SIZE; i++) {
        //     let bit_value = this._data[i].read();
        //     total += bit_value << i;
        // }
        // return total;
        return this._bits.VALUE;
    }

    public toString() {
        // let bit_str = this._bits.map(bit => bit.read() === 1 ? "1" : "0").reverse().join("");
        let hex_str = "0x" + this._bits.VALUE.toString(16);
        return `${this.NAME}<${hex_str}>`;
    }
}