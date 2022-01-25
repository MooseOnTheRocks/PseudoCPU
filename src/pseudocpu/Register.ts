namespace PseudoCPU {
    export class Register {
        public readonly name: string;
        public readonly SIZE: number;
        private _data: number;

        constructor(name: string, size: number) {
            this.name = name;
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
            return `${this.name}<0x${this._data.toString(16)}>`;
        }
    }
}