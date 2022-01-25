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
            let sum = this._ac.read() + this._mdr.read();
            this._ac.write(sum);
            this.Z = sum == 0 ? 1 : 0;
        }
    }
}