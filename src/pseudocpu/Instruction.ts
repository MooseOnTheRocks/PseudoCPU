namespace PseudoCPU {
    // == PseudoCPU Instructions
    // LDA x: MDR <- M[MAR], AC <- MDR
    // STA x: MDR <- AC, M[MAR] <- MDR
    // ADD x: MDR <- M[MAR], AC <- AC + MDR
    // J x: PC <- MDR(address)
    // BNE x: if (z != 1) then PC <- MAR(address)

    export enum OpCode {
        LDA,
        STA,
        ADD,
        J,
        BNE
    }

    export class Instruction {
        public readonly opcode: OpCode;
        public readonly operand: number;

        constructor(opcode: OpCode, operand: number) {
            this.opcode = opcode;
            this.operand = operand;
        }

        public get value(): number {
            return (this.opcode << (WORD_SIZE - OPERAND_SIZE)) + this.operand
        }
    }

    export const LDA = (operand: number) => new Instruction(OpCode.LDA, operand);
    export const STA = (operand: number) => new Instruction(OpCode.STA, operand);
    export const ADD = (operand: number) => new Instruction(OpCode.ADD, operand);
    export const J   = (operand: number) => new Instruction(OpCode.J,   operand);
}