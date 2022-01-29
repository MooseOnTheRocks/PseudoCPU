import { PseudoCPUArchitecture } from "../PseudoCPUArchitecture";
import { instructionBuilder } from "../PseudoInstruction";

export default function programBuilder(CPU: PseudoCPUArchitecture) {
    // Create instruction bit representation based on CPU opcode and address size.
    const { LDA, STA, ADD, SHFT } = instructionBuilder(CPU);
    // Define labels in DATA memory.
    const A = CPU.DATA_MEMORY_BEGIN;
    const B = CPU.DATA_MEMORY_BEGIN + 1;
    const C = CPU.DATA_MEMORY_BEGIN + 2;
    const labels = { A, B, C };
    // Program, computes C = 4*A + B
    let program = [
        LDA(A),
        SHFT(),
        SHFT(),
        ADD(B),
        STA(C)
    ];
    // Return labels and program.
    return { labels, program: program.map(instruction => instruction.VALUE) };
}