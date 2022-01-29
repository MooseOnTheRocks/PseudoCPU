import { Register } from "@/Register";
import { Memory } from "@/Memory";
import { MemoryAccess, MemoryMap } from "@/MemoryMap";
import { ControlUnit } from "@/ControlUnit";
import { CentralProcessingUnit } from "@/CentralProcessingUnit";

import { PseudoCU } from "../Basic/PseudoCU";
import { PseudoALU } from "../PseudoALU";
import { PseudoCPUArchitecture } from "../PseudoCPUArchitecture";

export class PseudoCPUBasic implements PseudoCPUArchitecture, CentralProcessingUnit {
    public readonly WORD_SIZE = 8; // word size in bits.
    public readonly ADDRESS_SIZE = 16; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
    public readonly OPCODE_SIZE = 16; // opcode size in bits, 2**3 = 8 unique opcodes.
    public readonly PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
    public readonly DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.

    public readonly PROGRAM_MEMORY_BEGIN = 0x00; // address of first word of program memory.
    public readonly DATA_MEMORY_BEGIN = this.PROGRAM_MEMORY_SIZE; // address of first word of data memory.

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

    public readonly SP: Register;
    public readonly TEMP: Register;

    constructor() {
        this.SP = new Register("SP", this.ADDRESS_SIZE);
        this.TEMP = new Register("TEMP", this.ADDRESS_SIZE);
        this.PC = new Register("PC", this.ADDRESS_SIZE)
        this.IR = new Register("IR", this.ADDRESS_SIZE);
        this.MAR = new Register("MAR", this.ADDRESS_SIZE);
        this.MDR = new Register("MDR", this.WORD_SIZE);
        this.AC = new Register("AC", this.WORD_SIZE);

        this.ALU = new PseudoALU(this.AC, this.MDR, this.WORD_SIZE);
        this.PROG = new Memory("PROG", this.PROGRAM_MEMORY_SIZE);
        this.DATA = new Memory("DATA", this.DATA_MEMORY_SIZE);
        this.M = new MemoryMap();
        this.M.mapMemoryRange(this.PROGRAM_MEMORY_BEGIN, this.PROGRAM_MEMORY_SIZE, MemoryAccess.READ, this.PROG);
        this.M.mapMemoryRange(this.DATA_MEMORY_BEGIN, this.DATA_MEMORY_SIZE, MemoryAccess.READ_WRITE, this.DATA);
        this.CU = new PseudoCU(this, this.IR, this.PC, this.AC, this.MAR, this.MDR, this.ALU, this.M);
    }

    public stepInstruction() {
        this.CU.fetchAndDecodeNextInstruction();
        this.CU.executeInstruction();
    }
    
    public writeProgram(start: number, ...program: Array<number>) {
        program.forEach((instruction, address) => {
            this.PROG.write(start + address - this.PROGRAM_MEMORY_BEGIN, instruction);
        });
    }

    public writeData(start: number, ...data: Array<number>) {
        data.forEach((value, address) => {
            this.DATA.write(start + address - this.DATA_MEMORY_BEGIN, value);
        })
    }
}