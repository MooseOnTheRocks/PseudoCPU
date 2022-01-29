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
import { PseudoCPUArchitecture } from "./PseudoCPUArchitecture";


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

// Instruction memory format:
//      [Instruction: WORD_SIZE] = [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]
// Operand usage is defined by the opcode.
// Operand address is loaded into MAR after the fetch and decode cycle.
export class PseudoInstruction implements Instruction {
    public readonly opcode: PseudoOpCode;
    public readonly operand: number;
    public readonly VALUE: number;

    constructor(offset: number, opcode: PseudoOpCode, operand: number) {
        this.opcode = opcode;
        this.operand = operand;
        this.VALUE = (this.opcode << offset) + this.operand;
    }
}

export const instructionBuilder = ({ADDRESS_SIZE}: PseudoCPUArchitecture) => ({
    LDA:    (operand: number) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.LDA, operand),
    STA:    (operand: number) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.STA, operand),
    ADD:    (operand: number) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.ADD, operand),
    SUB:    (operand: number) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.SUB, operand),
    NAND:   (operand: number) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.NAND, operand),
    SHFT:   ()                => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.SHFT, 0),
    J:      (operand: number) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.J,   operand),
    BNE:    (operand: number) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.BNE, operand),
});
