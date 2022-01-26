import { Register } from "./Register";
import { ArithmeticLogicUnit } from "./ArithmeticLogicUnit";
import { MemoryMap } from "./MemoryMap";
export declare class ControlUnit {
    private readonly _ir;
    private readonly _pc;
    private readonly _ac;
    private readonly _mar;
    private readonly _mdr;
    private readonly _alu;
    private readonly _memory;
    constructor(ir: Register, pc: Register, ac: Register, mar: Register, mdr: Register, alu: ArithmeticLogicUnit, memory: MemoryMap);
    fetchAndDecodeNextInstruction(): void;
    executeInstruction(): void;
}
