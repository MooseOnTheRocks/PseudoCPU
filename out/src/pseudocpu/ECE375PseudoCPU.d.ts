import { Register } from "./Register";
import { ArithmeticLogicUnit } from "./ArithmeticLogicUnit";
import { Memory } from "./Memory";
import { MemoryMap } from "./MemoryMap";
import { ControlUnit } from "./ControlUnit";
import { Instruction } from "./Instruction";
export declare type ECE375PseudoCPUArchitecture = {
    PC: Register;
    IR: Register;
    AC: Register;
    MDR: Register;
    MAR: Register;
    ALU: ArithmeticLogicUnit;
    PROG: Memory;
    DATA: Memory;
    M: MemoryMap;
    CU: ControlUnit;
};
export declare class ECE375PseudoCPU implements ECE375PseudoCPUArchitecture {
    readonly WORD_SIZE = 16;
    readonly ADDRESS_SIZE = 13;
    readonly OPCODE_SIZE = 3;
    readonly OPERAND_SIZE = 13;
    readonly PROGRAM_MEMORY_SIZE: number;
    readonly DATA_MEMORY_SIZE: number;
    readonly PC: Register;
    readonly IR: Register;
    readonly AC: Register;
    readonly MDR: Register;
    readonly MAR: Register;
    readonly ALU: ArithmeticLogicUnit;
    readonly PROG: Memory;
    readonly DATA: Memory;
    readonly M: MemoryMap;
    readonly CU: ControlUnit;
    constructor(components: ECE375PseudoCPUArchitecture);
    step(): void;
    loadProgram(program: Array<Instruction>, start?: number): void;
}
