import { PseudoCPU } from "@/PseudoCPU/PseudoCPU";
import { PseudoOpCode, LDA, STA, ADD, SHFT } from "@/PseudoCPU/PseudoInstruction";

function main() {
    // Construct a ECE375 Pseudo CPU, factory new!
    const CPU = new PseudoCPU();

    // Define labels in DATA memory.
    let A = CPU.DATA_MEMORY_BEGIN;
    let B = CPU.DATA_MEMORY_BEGIN + 1;
    let C = CPU.DATA_MEMORY_BEGIN + 2;
    // Program, computes C = 4*A + B
    const program = [
        LDA(A),
        SHFT(),
        SHFT(),
        ADD(B),
        STA(C)
    ];
    // Write program to memory.
    CPU.writeProgram(0, ...program);
    // Initial values: A = 20, B = 20, C = 0.
    CPU.writeData(A, 20);
    CPU.writeData(B, 21);

    function printCPU() {
        const print = (...args: Array<{ toString(): string }>) => console.log(...args.map(value => value.toString()));
        const { PC, IR, AC, MDR, MAR, ALU, PROG, DATA, M, CU } = CPU;
        print(PC);
        print(IR, "=>", PseudoOpCode[IR.read()]);
        print(AC, "=>", AC.read());
        print(`Z=${ALU.Z}`);
        print(MDR, "=>", MDR.read());
        print(MAR);
        print(`== ${PROG.NAME} memory`)
        print(PROG);
        print(`== ${DATA.NAME} memory`)
        print(DATA);
        console.log();
    }

    const STEP_COUNT = program.length;
    console.log("== Initial State");
    printCPU();
    for (let i = 0; i < STEP_COUNT; i++) {
        CPU.stepInstruction();
        printCPU();
    }
}

main();