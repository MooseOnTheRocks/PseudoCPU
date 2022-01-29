export type BitValue = 0 | 1;

export class Bit {
    private _value: BitValue;

    constructor(value?: BitValue) {
        this._value = value ?? 0;
    }

    public set() {
        this._value = 1;
    }

    public clear() {
        this._value = 0;
    }

    public read() {
        return this._value;
    }
}

export class BitField {
    public readonly SIZE: number;
    private _bits: Array<Bit>;

    constructor(size: number) {
        this.SIZE= size;
        this._bits = new Array<Bit>();
        for (let i = 0; i < size; i++) {
            this._bits.push(new Bit());
        }
    }

    public get VALUE(): number {
        return this._bits.reduce((prev, bit, index) => prev + (bit.read() << index), 0);
        // let total = 0;
        // for (let i = 0; i < this.SIZE; i++) {
        //     let bit_value = this._bits[i].read();
        //     total += bit_value << i;
        // }
        // return total;
    }

    public set(index: number) {
        if (index < 0 || index >= this.SIZE) {
            throw "BitField.set out of bounds";
        }
        this._bits[index].set();
    }

    public clear(index: number) {
        if (index < 0 || index >= this.SIZE) {
            throw "BitField.clear out of bounds";
        }
        this._bits[index].clear();
    }

    public read(index: number) {
        if (index < 0 || index >= this.SIZE) {
            throw "BitField.read out of bounds";
        }
        return this._bits[index].read();
    }
}