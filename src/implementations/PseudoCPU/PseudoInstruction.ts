// == PseudoCPU Instructions
// LDA x: MDR <- M[MAR], AC <- MDR
// STA x: MDR <- AC, M[MAR] <- MDR
// ADD x: MDR <- M[MAR], AC <- AC + MDR
// SUB x: MDR <- M[MAR], AC <- AC - MDR
// NAND x: MDR <- M[MAR], AC <- ~(AC & MDR)
// SHFT x: AC <- AC << 1
// J x: PC <- MDR(address)
// BNE x: if (z != 1) then PC <- MAR(address)

import { Instruction } from "@/Instruction";

import { PseudoCPU } from "./PseudoCPU";


export enum PseudoOpCode {
    LDA  = 0b000,
    STA  = 0b001,
    ADD  = 0b010,
    SUB  = 0b011,
    NAND = 0b100,
    SHFT = 0b101,
    J    = 0b110,
    BNE  = 0b111
}

export class PseudoInstruction implements Instruction {
    public readonly opcode: PseudoOpCode;
    public readonly operand: number;

    constructor(opcode: PseudoOpCode, operand: number) {
        this.opcode = opcode;
        this.operand = operand;
    }

    // Instruction memory format:
    //      [Instruction: WORD_SIZE] = [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]
    // Operand usage is defined by the opcode.
    // Operand address is loaded into MAR after the fetch and decode cycle.
    public get VALUE(): number {
        return (this.opcode << PseudoCPU.ADDRESS_SIZE) + this.operand;
    }
}

export const LDA    = (operand: number) => new PseudoInstruction(PseudoOpCode.LDA, operand);
export const STA    = (operand: number) => new PseudoInstruction(PseudoOpCode.STA, operand);
export const ADD    = (operand: number) => new PseudoInstruction(PseudoOpCode.ADD, operand);
export const SUB    = (operand: number) => new PseudoInstruction(PseudoOpCode.SUB, operand);
export const NAND   = (operand: number) => new PseudoInstruction(PseudoOpCode.NAND, operand);
export const SHFT   = ()                => new PseudoInstruction(PseudoOpCode.SHFT, 0);
export const J      = (operand: number) => new PseudoInstruction(PseudoOpCode.J,   operand);
export const BNE    = (operand: number) => new PseudoInstruction(PseudoOpCode.BNE, operand);
