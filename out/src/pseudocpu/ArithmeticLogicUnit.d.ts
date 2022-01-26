import { Register } from "./Register";
export declare class ArithmeticLogicUnit {
    private readonly _ac;
    private readonly _mdr;
    private readonly _z;
    constructor(ac: Register, mdr: Register);
    get Z(): number;
    set Z(value: number);
    add(): void;
    sub(): void;
    nand(): void;
    shft(): void;
}
