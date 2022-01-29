import { PseudoCPUBasic } from "@/PseudoCPU/Basic/PseudoCPUBasic";
import { PseudoOpCode } from "@/PseudoCPU/PseudoInstruction";

import programBuilder from "@/PseudoCPU/programs/mul_4_A__add_B";

function main() {
    // Construct a ECE375 Pseudo CPU, factory new!
    const CPU = new PseudoCPUBasic();
    let { labels, program }  = programBuilder(CPU);
    const { A, B } = labels;
    // Write program to memory.
    CPU.writeProgram(0, ...program);
    // Write initial values to data memory: A = 20, B = 20.
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