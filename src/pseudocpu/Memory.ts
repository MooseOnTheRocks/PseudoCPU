namespace PseudoCPU {
    export class Memory {
        public readonly SIZE: number;
        private _data: Array<number>;

        constructor(size: number) {
            this.SIZE = size;
            this._data = new Array<number>(this.SIZE);
            this._data.fill(0);
        }

        public write(address: number, value: number) {
            this._data[address] = value;
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
}