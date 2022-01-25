
// == PseudoCPU Micro-operations
// -- Store/Load memory
//      M[MAR] <- MDR
//      MDR <- M[MAR]
// -- Store register
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
// [MDR Register]
// Transfer to/from memory via Data Line.
//
// [MAR Register]
// Access memory via Address Line
//
// [PC Register]
// Increment via PC <- PC + 1
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

/// <reference path="./pseudocpu/Memory.ts"/>
/// <reference path="./pseudocpu/Register.ts"/>
/// <reference path="./pseudocpu/ArithmeticLogicUnit.ts"/>
/// <reference path="./pseudocpu/OpCode.ts"/>
/// <reference path="./pseudocpu/ControlUnit.ts"/>

namespace PseudoCPU {
    export const WORD_SIZE = 16; // word size in bits..
    export const ADDRESS_SIZE = 8; // address size in bits.
    export const OPCODE_SIZE = 8; // opcode size in bits.
    export const PROGRAM_MEMORY_SIZE = 8; // addressable words of program memory.
    export const DATA_MEMORY_SIZE = 8; // addressable words of data memory.

    export function main() {
        let PC = new Register("PC", ADDRESS_SIZE);
        let IR = new Register("IR", OPCODE_SIZE);
        let AC = new Register("AC", WORD_SIZE);
        let MDR = new Register("MDR", WORD_SIZE);
        let MAR = new Register("MAR", ADDRESS_SIZE);
        let ALU = new ArithmeticLogicUnit(AC, MDR);
        let PROG = new Memory(PROGRAM_MEMORY_SIZE, READ, MAR, MDR);
        // LDA  0x07; AC <- M[0x07]
        PROG._set(0, 0x0007);
        // STA  0x01; M[0x01] <- AC
        PROG._set(1, 0x0101)
        // ADD  0x01; AC <- AC + MDR
        PROG._set(2, 0x0201);
        // STA  0x00; M[0x00] <- AC
        PROG._set(3, 0x0100);

        let DATA = new Memory(DATA_MEMORY_SIZE, READ_WRITE, MAR, MDR);
        // M[0x07] = 0xbe
        DATA._set(0x07, 0xbe);

        let CU = new ControlUnit(IR, PC, AC, MAR, MDR, ALU, PROG, DATA);

        function printState() {
            let print = (...args: Array<{toString(): String}>) => console.log(...args.map(value => value.toString()));
            print("==========");
            print("== Registers");
            print(PC);
            print(IR, "=>", OpCode[IR.read()]);
            print(AC);
            print(MDR);
            print(MAR);
            print("== Program Memory")
            print(PROG);
            print("== Data Memory");
            print(DATA);
            print("\n");
        }

        console.log("== Initial State");
        printState();
        CU.step();
        printState();
        CU.step();
        printState();
        CU.step();
        printState();
        CU.step();
        printState();
    }
}

PseudoCPU.main();
