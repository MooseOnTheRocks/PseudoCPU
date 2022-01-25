namespace PseudoCPU {
    export class ArithmeticLogicUnit {
        private readonly _ac: Register;
        private readonly _mdr: Register;

        constructor(ac: Register, mdr: Register) {
            this._ac = ac;
            this._mdr = mdr;
        }

        public add() {
            this._ac.write(this._ac.read() + this._mdr.read());
        }
    }
}