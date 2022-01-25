namespace PseudoCPU {
    export enum MemoryAccessMode { READ, WRITE, READ_WRITE }
    export const { READ, WRITE, READ_WRITE } = MemoryAccessMode;
    type READ = MemoryAccessMode.READ;
    type WRITE = MemoryAccessMode.WRITE;
    type READ_WRITE = MemoryAccessMode.READ_WRITE;

    export class Memory {
        public readonly MODE: MemoryAccessMode;
        public readonly SIZE: number;
        private _data: Array<number>;
        private _mar: Register;
        private _mdr: Register;

        constructor(size: number, mode: MemoryAccessMode, addressLine: Register, dataLine: Register) {
            this.SIZE = size;
            this.MODE = mode;
            this._data = new Array<number>(this.SIZE);
            this._data.fill(0);
            this._mar = addressLine;
            this._mdr = dataLine;
        }

        public store() {
            if (this.MODE === READ) {
                throw "Attempted store() on READ only memory";
            }
            let address = this._mar.read();
            let data = this._mdr.read();
            this._data[address] = data;
        }

        public load() {
            if (this.MODE === WRITE) {
                throw "Attempted load() on WRITE only memory";
            }
            let address = this._mar.read();
            let data = this._data[address];
            this._mdr.write(data);
        }

        public _set(address: number, value: number) {
            this._data[address] = value;
        }

        public _get(address: number): number {
            return this._data[address];
        }

        public toString() {
            let lines = [];
            for (let i = 0; i < this.SIZE; i++) {
                lines.push(`0x${i.toString(16)}: 0x${this._data[i].toString(16)}`);
            }
            return lines.join("\n");
        }
    }
}