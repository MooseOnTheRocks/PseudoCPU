
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
//      [BNE]
//          BNE x; Jump to instruction in memory location x if content of AC is not zero
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

/// <reference path="./pseudocpu/Memory.ts"/>
/// <reference path="./pseudocpu/MemoryMap.ts"/>
/// <reference path="./pseudocpu/Register.ts"/>
/// <reference path="./pseudocpu/ArithmeticLogicUnit.ts"/>
/// <reference path="./pseudocpu/Instruction.ts"/>
/// <reference path="./pseudocpu/ControlUnit.ts"/>

namespace PseudoCPU {
    export const WORD_SIZE = 16; // word size in bits.
    export const ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
    export const OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
    export const OPERAND_SIZE = ADDRESS_SIZE; // operand size in bits.

    export const PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
    export const DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.

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
        const PROG_BEGIN = DATA.SIZE;
        M.mapExternalMemory(DATA_BEGIN, DATA.SIZE, MemoryAccess.READ_WRITE, DATA);
        M.mapExternalMemory(PROG_BEGIN, PROG.SIZE, MemoryAccess.READ, PROG);
        // Place PC on first program instruction.
        PC.write(PROG_BEGIN);

        // Program to compute the code C = 4*A + B.
        let A = 0;
        let B = 1;
        let C = 2;
        const program: Array<Instruction> = [
            LDA(A),
            SHFT(),
            SHFT(),
            ADD(B),
            STA(C)
        ];

        // Write the program into memory.
        program.forEach((instruction, address) => {
            PROG.write(address, instruction.value);
        });

        DATA.write(A, 80);
        DATA.write(B, 20);    // M[0x00] = 0x0001

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
