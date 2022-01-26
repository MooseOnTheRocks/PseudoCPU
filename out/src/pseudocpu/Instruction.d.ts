export declare enum OpCode {
    LDA = 0,
    STA = 1,
    ADD = 2,
    SUB = 3,
    NAND = 4,
    SHFT = 5,
    J = 6,
    BNE = 7
}
export declare class Instruction {
    readonly opcode: OpCode;
    readonly operand: number;
    constructor(opcode: OpCode, operand: number);
    get value(): number;
}
export declare const LDA: (operand: number) => Instruction;
export declare const STA: (operand: number) => Instruction;
export declare const ADD: (operand: number) => Instruction;
export declare const SUB: (operand: number) => Instruction;
export declare const NAND: (operand: number) => Instruction;
export declare const SHFT: () => Instruction;
export declare const J: (operand: number) => Instruction;
export declare const BNE: (operand: number) => Instruction;
