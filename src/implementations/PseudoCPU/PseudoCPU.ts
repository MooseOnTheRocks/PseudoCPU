// == PseudoISA
// -- Data Transfer Instructions
//      [Load Accumulator]
//          LDA x; x is a memory location
//          Loads a memory word to the AC.
//      [Store Accumulator]
//          STA x; x is a memory location
//          Stores the content of the AC to memory.
// -- Arithmetic and Logical Instructions
//      [Add to Accumulator]
//          ADD x; x points to a memory location.
//          Adds the content of the memory word specified by
//          the effective address to the content in the AC.
//      [Subtract from Accumulator]
//          SUB x; x points to a memory location.
//          Subtracts the content of the memory word specified
//          by the effective address from the content in the AC.
//      [Logical NAND with Accumulator]
//          NAND x; x points to a memory location.
//          Performs logical NAND between the contents of the memory
//          word specified by the effective address and the AC.
//      [Shift]
//          SHFT
//          The content of AC is shifted left by one bit.
//          The bit shifted in is 0.
// -- Control Transfer
//      [Jump]
//          J x; Jump to instruction in memory location x.
//          Transfers the program control to the instruction
//          specified by the target address.
//      [BNE]
//          BNE x; Jump to instruction in memory location x if content of AC is not zero.
//          Transfers the program control to the instruction
//          specified by the target address if Z != 0.
// 
// == PseudoCPU Micro-operations
// -- Store/Load memory
//      M[MAR] <- MDR
//      MDR <- M[MAR]
// -- Copy register
//      Ra <- Rb
// -- Register increment/decrement
//      Ra <- Ra + 1
//      Ra <- Ra - 1
//      Ra <- Ra + Rb
//      Ra <- Ra - Rb
//
// == Minimal Components
// [Memory]
// Addressable by Address Line via M[MAR]
// Writable by Address Line & Data Line via M[MAR] <- MDR
// Readable by Address Line & Data Line via MDR <- M[MAR]
// Need two memories: program memory (read only) and data memory (read & write).
//
// [ALU]
// Performs arithmetic operations, often involving the AC register.
// AC <- AC + 1
// AC <- AC + RA
// AC <- AC - 1
// AC <- AC - RA
//
// [Control Unit]
// Executes instructions and sequences microoperations.
//
// [MDR Register]
// Transfer to/from memory via Data Line.
//
// [MAR Register]
// Access memory via Address Line
//
// [PC Register]
// Increment via PC <- PC + 1
//
// [IR Register]
// Holds the opcode of the current instruction.
//
// [AC Register]
// Increment via AC <- AC + 1 or AC <- AC + Ra
// Decrement via AC <- AC - 1 or AC <- AC - Ra
//
// == PseudoCPU Instructions
// LDA x: MDR <- M[MAR], AC <- MDR
// STA x: MDR <- AC, M[MAR] <- MDR
// ADD x: MDR <- M[MAR], AC <- AC + MDR
// J x: PC <- MDR(address)
// BNE x: if (z != 1) then PC <- MAR(address)

import { Register } from "@/Register";
import { Memory } from "@/Memory";
import { MemoryAccess, MemoryMap } from "@/MemoryMap";
import { ControlUnit } from "@/ControlUnit";
import { Instruction } from "@/Instruction";
import { CentralProcessingUnit } from "@/CentralProcessingUnit";

import { PseudoCU } from "./PseudoCU";
import { PseudoALU } from "./PseudoALU";

export type PseudoCPUArchitecture = {
    PC: Register,
    IR: Register,
    AC: Register,
    MDR: Register,
    MAR: Register,
    ALU: PseudoALU,
    PROG: Memory,
    DATA: Memory,
    M: MemoryMap,
    CU: ControlUnit
}

export class PseudoCPU implements PseudoCPUArchitecture, CentralProcessingUnit {
    public static WORD_SIZE = 16; // word size in bits.
    public static ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
    public static OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
    public static PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
    public static DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.

    public readonly PROGRAM_MEMORY_BEGIN = 0x00; // address of first word of program memory.
    public readonly DATA_MEMORY_BEGIN = PseudoCPU.PROGRAM_MEMORY_SIZE; // address of first word of data memory.

    public readonly PC: Register;
    public readonly IR: Register;
    public readonly AC: Register;
    public readonly MDR: Register;
    public readonly MAR: Register;
    public readonly ALU: PseudoALU;
    public readonly PROG: Memory;
    public readonly DATA: Memory;
    public readonly M: MemoryMap;
    public readonly CU: ControlUnit;

    constructor() {
        this.PC = new Register("PC", PseudoCPU.ADDRESS_SIZE)
        this.IR = new Register("IR", PseudoCPU.OPCODE_SIZE);
        this.AC = new Register("AC", PseudoCPU.WORD_SIZE);
        this.MDR = new Register("MDR", PseudoCPU.WORD_SIZE);
        this.MAR = new Register("MAR", PseudoCPU.ADDRESS_SIZE);
        this.ALU = new PseudoALU(this.AC, this.MDR, PseudoCPU.WORD_SIZE);
        this.PROG = new Memory("PROG", PseudoCPU.PROGRAM_MEMORY_SIZE)
        this.DATA = new Memory("DATA", PseudoCPU.DATA_MEMORY_SIZE);
        this.M = new MemoryMap(this.MDR, this.MAR);
        this.M.mapExternalMemory(this.PROGRAM_MEMORY_BEGIN, PseudoCPU.PROGRAM_MEMORY_SIZE, MemoryAccess.READ, this.PROG);
        this.M.mapExternalMemory(this.DATA_MEMORY_BEGIN, PseudoCPU.DATA_MEMORY_SIZE, MemoryAccess.READ_WRITE, this.DATA);
        this.CU = new PseudoCU(this.IR, this.PC, this.AC, this.MAR, this.MDR, this.ALU, this.M);
    }

    public stepInstruction() {
        // == Fetch Cycle
        this.CU.fetchAndDecodeNextInstruction();
        // == Execute Cycle
        this.CU.executeInstruction();
    }
    
    public writeProgram(start: number, ...program: Array<Instruction>) {
        program.forEach((instruction, address) => {
            this.PROG.write(start + address - this.PROGRAM_MEMORY_BEGIN, instruction.VALUE);
        });
    }

    public writeData(start: number, ...data: Array<number>) {
        data.forEach((value, address) => {
            this.DATA.write(start + address - this.DATA_MEMORY_BEGIN, value);
        })
    }
}