namespace PseudoCPU {
    // == PseudoCPU Instructions
    // LDA x: MDR <- M[MAR], AC <- MDR
    // STA x: MDR <- AC, M[MAR] <- MDR
    // ADD x: MDR <- M[MAR], AC <- AC + MDR
    // SUB x: MDR <- M[MAR], AC <- AC - MDR
    // NAND x: MDR <- M[MAR], AC <- ~(AC & MDR)
    // SHFT x: AC <- AC << 1
    // J x: PC <- MDR(address)
    // BNE x: if (z != 1) then PC <- MAR(address)

    export enum OpCode {
        LDA  = 0b000,
        STA  = 0b001,
        ADD  = 0b010,
        SUB  = 0b011,
        NAND = 0b100,
        SHFT = 0b101,
        J    = 0b110,
        BNE  = 0b111
    }

    export class Instruction {
        public readonly opcode: OpCode;
        public readonly operand: number;

        constructor(opcode: OpCode, operand: number) {
            this.opcode = opcode;
            this.operand = operand;
        }

        public get value(): number {
            return (this.opcode << OPERAND_SIZE) + this.operand;
        }
    }

    export const LDA    = (operand: number) => new Instruction(OpCode.LDA, operand);
    export const STA    = (operand: number) => new Instruction(OpCode.STA, operand);
    export const ADD    = (operand: number) => new Instruction(OpCode.ADD, operand);
    export const SUB    = (operand: number) => new Instruction(OpCode.SUB, operand);
    export const NAND   = (operand: number) => new Instruction(OpCode.NAND, operand);
    export const SHFT   = ()                => new Instruction(OpCode.SHFT, 0);
    export const J      = (operand: number) => new Instruction(OpCode.J,   operand);
    export const BNE    = (operand: number) => new Instruction(OpCode.BNE, operand);
}
