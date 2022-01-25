namespace PseudoCPU {
    export class ArithmeticLogicUnit {
        private readonly _ac: Register;
        private readonly _mdr: Register;
        private readonly _z: Register;

        constructor(ac: Register, mdr: Register) {
            this._ac = ac;
            this._mdr = mdr;
            this._z = new Register("Z", 1);
        }

        public get Z(): number {
            return this._z.read();
        }

        public set Z(value: number) {
            this._z.write(value);
        }

        public add() {
            let WORD_MASK = (1 << WORD_SIZE) - 1;
            let sum = (this._ac.read() + this._mdr.read()) & WORD_MASK;
            this._ac.write(sum);
            this.Z = sum === 0 ? 1 : 0;
        }

        public sub() {
            let WORD_MASK = (1 << WORD_SIZE) - 1;
            let difference = (this._ac.read() - this._mdr.read()) & WORD_MASK;
            this._ac.write(difference);
            this.Z = difference === 0 ? 1 : 0;
        }

        public nand() {
            let WORD_MASK = (1 << WORD_SIZE) - 1;
            let result = ~(this._ac.read() & this._mdr.read()) & WORD_MASK;
            this._ac.write(result);
            this.Z = result === 0 ? 1 : 0;
        }

        public shft() {
            let WORD_MASK = (1 << WORD_SIZE) - 1;
            let result = (this._ac.read() << 1) & WORD_MASK;
            this._ac.write(result);
            this.Z = result === 0 ? 1 : 0;
        }
    }
}