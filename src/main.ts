
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
/// <reference path="./pseudocpu/MemoryMap.ts"/>
/// <reference path="./pseudocpu/Register.ts"/>
/// <reference path="./pseudocpu/ArithmeticLogicUnit.ts"/>
/// <reference path="./pseudocpu/Instruction.ts"/>
/// <reference path="./pseudocpu/ControlUnit.ts"/>

namespace PseudoCPU {
    export const WORD_SIZE = 16; // word size in bits..
    export const ADDRESS_SIZE = 8; // address size in bits.
    export const OPCODE_SIZE = 8; // opcode size in bits.
    export const OPERAND_SIZE = 8; // operand size in bits.
    export const PROGRAM_MEMORY_SIZE = 16; // addressable words of program memory.
    export const DATA_MEMORY_SIZE = 8; // addressable words of data memory.

    export function main() {
        const PC = new Register("PC", ADDRESS_SIZE);
        const IR = new Register("IR", OPCODE_SIZE);
        const AC = new Register("AC", WORD_SIZE);
        const MDR = new Register("MDR", WORD_SIZE);
        const MAR = new Register("MAR", ADDRESS_SIZE);
        const ALU = new ArithmeticLogicUnit(AC, MDR);
        const PROG = new Memory(PROGRAM_MEMORY_SIZE);
        const DATA = new Memory(DATA_MEMORY_SIZE);
        const M = new MemoryMap(MDR, MAR);
        const CU = new ControlUnit(IR, PC, AC, MAR, MDR, ALU, M);

        const DATA_BEGIN = 0x0000;
        const PROG_BEGIN = 0x0100;
        M.mapExternalMemory(DATA_BEGIN, DATA.SIZE, DATA);
        M.mapExternalMemory(PROG_BEGIN, PROG.SIZE, PROG);
        // Place PC on first program instruction.
        PC.write(PROG_BEGIN);

        // Program to compute the first 6 fibonacci numbers.
        const program: Array<Instruction> = [
            LDA(0x00),  // Load initial number from memory (1)
            ADD(0x00),  // Add with itself (1 + 1 = 2)
            STA(0x01),  // Store in memory
            ADD(0x00),  // Add with previous number (2 + 1 = 3)
            STA(0x02),  // Store in memory
            ADD(0x01),  // Repeat...
            STA(0x03),
            ADD(0x02),
            STA(0x04),
            ADD(0x03),
            STA(0x05),
            LDA(0x07),  // Load 0 into MDR and AC
            ADD(0x07),  // 0 + 0 = 0, Z flag on ALU should be set
        ];
        // Write the program into memory.
        program.forEach((instruction, address) => {
            PROG.write(address, instruction.value);
        });

        // Place initial fibonacci number (1) in data.
        DATA.write(0x00, 0x0001);    // M[0x00] = 0x0001

        function printState() {
            const print = (...args: Array<{toString(): String}>) => console.log(...args.map(value => value.toString()));
            print("==========");
            print("== Registers");
            print(PC);
            print(IR, "=>", OpCode[IR.read()]);
            print(AC, "|", `Z=${ALU.Z}`);
            print(MDR);
            print(MAR);
            print("== Program Memory")
            print(PROG.toString(PROG_BEGIN));
            print("== Data Memory");
            print(DATA.toString(DATA_BEGIN));
            print("\n");
        }

        console.log("== Initial State");
        printState();
        const NUM_INSTRUCTIONS = program.length;
        for (let i = 0; i < NUM_INSTRUCTIONS; i++) {
            CU.step();
            printState();
        }
    }
}

PseudoCPU.main();
