"use strict";
var PseudoCPU;
(function (PseudoCPU) {
    class Memory {
        constructor(size) {
            this.SIZE = size;
            this._data = new Array(this.SIZE);
            this._data.fill(0);
        }
        write(address, value) {
            this._data[address] = value;
        }
        read(address) {
            return this._data[address];
        }
        toString(withOffset) {
            let lines = [];
            for (let i = 0; i < this.SIZE; i++) {
                let address = withOffset ? i + withOffset : i;
                lines.push(`0x${address.toString(16)}: 0x${this._data[i].toString(16)}`);
            }
            return lines.join("\n");
        }
    }
    PseudoCPU.Memory = Memory;
})(PseudoCPU || (PseudoCPU = {}));
var PseudoCPU;
(function (PseudoCPU) {
    let MemoryAccess;
    (function (MemoryAccess) {
        MemoryAccess[MemoryAccess["READ"] = 0] = "READ";
        MemoryAccess[MemoryAccess["WRITE"] = 1] = "WRITE";
        MemoryAccess[MemoryAccess["READ_WRITE"] = 2] = "READ_WRITE";
    })(MemoryAccess = PseudoCPU.MemoryAccess || (PseudoCPU.MemoryAccess = {}));
    class MemoryMap {
        constructor(mdr, mar) {
            this._mdr = mdr;
            this._mar = mar;
            this.mappings = new Map();
        }
        findAddressMapping(address) {
            let ranges = [...this.mappings.keys()];
            for (const range of ranges) {
                let [start, end] = range;
                if (address >= start && address <= end) {
                    return this.mappings.get(range);
                }
            }
            return undefined;
        }
        load() {
            let address = this._mar.read();
            let mapping = this.findAddressMapping(address);
            if (mapping === undefined) {
                throw "Attempting to load() from unmapped memory";
            }
            else {
                let data = mapping.read(address);
                this._mdr.write(data);
            }
        }
        store() {
            let address = this._mar.read();
            let mapping = this.findAddressMapping(address);
            if (mapping === undefined) {
                throw "Attempting to store() to unmapped memory";
            }
            else {
                let data = this._mdr.read();
                mapping.write(address, data);
            }
        }
        mapExternalMemory(start, length, mode, M) {
            function read(address) {
                if (mode === MemoryAccess.WRITE) {
                    throw "Attempting to read() from WRITE-only memory";
                }
                return M.read(address - start);
            }
            function write(address, value) {
                if (mode === MemoryAccess.READ) {
                    throw "Attempting to write() to READ-only memory";
                }
                M.write(address - start, value);
            }
            let range = [start, start + length - 1];
            this.mappings.set(range, { read, write });
        }
        mapRegister(a, R) {
            function read(address) {
                return R.read();
            }
            function write(address, value) {
                R.write(value);
            }
            let range = [a, a];
            this.mappings.set(range, { read, write });
        }
    }
    PseudoCPU.MemoryMap = MemoryMap;
})(PseudoCPU || (PseudoCPU = {}));
var PseudoCPU;
(function (PseudoCPU) {
    class Register {
        constructor(name, size) {
            this.name = name;
            this.SIZE = size;
            this._data = 0;
        }
        write(value) {
            this._data = value;
        }
        read() {
            return this._data;
        }
        toString() {
            return `${this.name}<0x${this._data.toString(16)}>`;
        }
    }
    PseudoCPU.Register = Register;
})(PseudoCPU || (PseudoCPU = {}));
var PseudoCPU;
(function (PseudoCPU) {
    class ArithmeticLogicUnit {
        constructor(ac, mdr) {
            this._ac = ac;
            this._mdr = mdr;
            this._z = new PseudoCPU.Register("Z", 1);
        }
        get Z() {
            return this._z.read();
        }
        set Z(value) {
            this._z.write(value);
        }
        add() {
            let WORD_MASK = (1 << PseudoCPU.WORD_SIZE) - 1;
            let sum = (this._ac.read() + this._mdr.read()) & WORD_MASK;
            this._ac.write(sum);
            this.Z = sum === 0 ? 1 : 0;
        }
        sub() {
            let WORD_MASK = (1 << PseudoCPU.WORD_SIZE) - 1;
            let difference = (this._ac.read() - this._mdr.read()) & WORD_MASK;
            this._ac.write(difference);
            this.Z = difference === 0 ? 1 : 0;
        }
        nand() {
            let WORD_MASK = (1 << PseudoCPU.WORD_SIZE) - 1;
            let result = ~(this._ac.read() & this._mdr.read()) & WORD_MASK;
            this._ac.write(result);
            this.Z = result === 0 ? 1 : 0;
        }
        shft() {
            let WORD_MASK = (1 << PseudoCPU.WORD_SIZE) - 1;
            let result = (this._ac.read() << 1) & WORD_MASK;
            this._ac.write(result);
            this.Z = result === 0 ? 1 : 0;
        }
    }
    PseudoCPU.ArithmeticLogicUnit = ArithmeticLogicUnit;
})(PseudoCPU || (PseudoCPU = {}));
var PseudoCPU;
(function (PseudoCPU) {
    // == PseudoCPU Instructions
    // LDA x: MDR <- M[MAR], AC <- MDR
    // STA x: MDR <- AC, M[MAR] <- MDR
    // ADD x: MDR <- M[MAR], AC <- AC + MDR
    // SUB x: MDR <- M[MAR], AC <- AC - MDR
    // NAND x: MDR <- M[MAR], AC <- ~(AC & MDR)
    // SHFT x: AC <- AC << 1
    // J x: PC <- MDR(address)
    // BNE x: if (z != 1) then PC <- MAR(address)
    let OpCode;
    (function (OpCode) {
        OpCode[OpCode["LDA"] = 0] = "LDA";
        OpCode[OpCode["STA"] = 1] = "STA";
        OpCode[OpCode["ADD"] = 2] = "ADD";
        OpCode[OpCode["SUB"] = 3] = "SUB";
        OpCode[OpCode["NAND"] = 4] = "NAND";
        OpCode[OpCode["SHFT"] = 5] = "SHFT";
        OpCode[OpCode["J"] = 6] = "J";
        OpCode[OpCode["BNE"] = 7] = "BNE";
    })(OpCode = PseudoCPU.OpCode || (PseudoCPU.OpCode = {}));
    class Instruction {
        constructor(opcode, operand) {
            this.opcode = opcode;
            this.operand = operand;
        }
        get value() {
            return (this.opcode << PseudoCPU.OPERAND_SIZE) + this.operand;
        }
    }
    PseudoCPU.Instruction = Instruction;
    PseudoCPU.LDA = (operand) => new Instruction(OpCode.LDA, operand);
    PseudoCPU.STA = (operand) => new Instruction(OpCode.STA, operand);
    PseudoCPU.ADD = (operand) => new Instruction(OpCode.ADD, operand);
    PseudoCPU.SUB = (operand) => new Instruction(OpCode.SUB, operand);
    PseudoCPU.NAND = (operand) => new Instruction(OpCode.NAND, operand);
    PseudoCPU.SHFT = () => new Instruction(OpCode.SHFT, 0);
    PseudoCPU.J = (operand) => new Instruction(OpCode.J, operand);
    PseudoCPU.BNE = (operand) => new Instruction(OpCode.BNE, operand);
})(PseudoCPU || (PseudoCPU = {}));
var PseudoCPU;
(function (PseudoCPU) {
    class ControlUnit {
        constructor(ir, pc, ac, mar, mdr, alu, memory) {
            this._ir = ir;
            this._pc = pc;
            this._ac = ac;
            this._mar = mar;
            this._mdr = mdr;
            this._alu = alu;
            this._memory = memory;
        }
        // Performs instruction fetch and decode.
        fetchAndDecodeNextInstruction() {
            // MAR <- PC
            this._mar.write(this._pc.read());
            // PC <- PC + 1
            this._pc.write(this._pc.read() + 1);
            // MDR <- M[MAR]
            this._memory.load();
            // IR <- MDR(opcode)
            let OPCODE_SHIFT = PseudoCPU.WORD_SIZE - PseudoCPU.OPCODE_SIZE;
            let opcode = this._mdr.read() >> OPCODE_SHIFT;
            this._ir.write(opcode);
            // MAR <- MDR(address)
            let ADDRESS_MASK = (1 << PseudoCPU.ADDRESS_SIZE) - 1;
            let address = this._mdr.read() & ADDRESS_MASK;
            this._mar.write(address);
        }
        executeInstruction() {
            // Instruction memory format:
            //      [Instruction: WORD_SIZE] =
            //          [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]
            // Operand usage is defined by the opcode.
            // Operand address is loaded into MAR after the fetch and decode cycle.
            //
            // == PseudoCPU Instructions
            // LDA x: MDR <- M[MAR], AC <- MDR
            // STA x: MDR <- AC, M[MAR] <- MDR
            // ADD x: MDR <- M[MAR], AC <- AC + MDR
            // SUB x: MDR <- M[MAR], AC <- AC - MDR
            // NAND x: MDR <- M[MAR], AC <- ~(AC & MDR)
            // SHFT x: AC <- AC << 1
            // J x: PC <- MDR(address)
            // BNE x: if (z != 1) then PC <- MAR(address)
            const [IR, PC, AC, MAR, MDR, ALU, M] = [this._ir, this._pc, this._ac, this._mar, this._mdr, this._alu, this._memory];
            const copy = (dst, src) => dst.write(src.read());
            let opcode = IR.read();
            switch (opcode) {
                case PseudoCPU.OpCode.LDA: // LDA x:
                    M.load(); // MDR <- M[MAR]
                    copy(AC, MDR); // AC <- MDR
                    break;
                case PseudoCPU.OpCode.STA: // STA x:
                    copy(MDR, AC); // MDR <- AC
                    M.store(); // M[MAR] <- MDR
                    break;
                case PseudoCPU.OpCode.ADD: // ADD x:
                    M.load(); // MDR <- M[MAR]
                    ALU.add(); // AC <- AC + MDR
                    break;
                case PseudoCPU.OpCode.SUB: // SUB x:
                    M.load(); // MDR <- M[MAR]
                    ALU.sub(); // AC <- AC - MDR
                    break;
                case PseudoCPU.OpCode.NAND: // NAND x:
                    M.load(); // MDR <- M[MAR]
                    ALU.nand(); // AC <- ~(AC & MDR)
                    break;
                case PseudoCPU.OpCode.SHFT: // SHFT:
                    ALU.shft(); // AC <- AC << 1
                    break;
                case PseudoCPU.OpCode.J: // J x:
                    // PC <- MDR(address)
                    let ADDRESS_MASK = (1 << PseudoCPU.ADDRESS_SIZE) - 1;
                    let address = MDR.read() & ADDRESS_MASK;
                    PC.write(address);
                    break;
                case PseudoCPU.OpCode.BNE: // BNE x:
                    // if (Z != 1) then PC <- MDR(address)
                    if (ALU.Z != 1) {
                        let ADDRESS_MASK = (1 << PseudoCPU.ADDRESS_SIZE) - 1;
                        let address = MDR.read() & ADDRESS_MASK;
                        PC.write(address);
                    }
                    break;
                default:
                    throw `Unknown opcode: ${opcode}`;
            }
        }
    }
    PseudoCPU.ControlUnit = ControlUnit;
})(PseudoCPU || (PseudoCPU = {}));
var PseudoCPU;
(function (PseudoCPU) {
    class ECE375PseudoCPU {
        constructor(components) {
            this.WORD_SIZE = 16; // word size in bits.
            this.ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
            this.OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
            this.OPERAND_SIZE = PseudoCPU.ADDRESS_SIZE; // operand size in bits.
            this.PC = components.PC;
            this.IR = components.IR;
            this.AC = components.AC;
            this.MDR = components.MDR;
            this.MAR = components.MAR;
            this.ALU = components.ALU;
            this.PROG = components.PROG;
            this.DATA = components.DATA;
            this.M = components.M;
            this.CU = components.CU;
            this.PROGRAM_MEMORY_SIZE = this.PROG.SIZE;
            this.DATA_MEMORY_SIZE = this.DATA.SIZE;
        }
        step() {
            // == Fetch Cycle
            this.CU.fetchAndDecodeNextInstruction();
            // == Execute Cycle
            this.CU.executeInstruction();
        }
        loadProgram(program, start) {
            program.forEach((instruction, address) => {
                address += start ? start : 0;
                this.PROG.write(address, instruction.value);
            });
        }
    }
    PseudoCPU.ECE375PseudoCPU = ECE375PseudoCPU;
})(PseudoCPU || (PseudoCPU = {}));
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
/// <reference path="./pseudocpu/Memory.ts"/>
/// <reference path="./pseudocpu/MemoryMap.ts"/>
/// <reference path="./pseudocpu/Register.ts"/>
/// <reference path="./pseudocpu/ArithmeticLogicUnit.ts"/>
/// <reference path="./pseudocpu/Instruction.ts"/>
/// <reference path="./pseudocpu/ControlUnit.ts"/>
/// <reference path="./pseudocpu/ECE375PseudoCPU.ts"/>
var PseudoCPU;
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
/// <reference path="./pseudocpu/Memory.ts"/>
/// <reference path="./pseudocpu/MemoryMap.ts"/>
/// <reference path="./pseudocpu/Register.ts"/>
/// <reference path="./pseudocpu/ArithmeticLogicUnit.ts"/>
/// <reference path="./pseudocpu/Instruction.ts"/>
/// <reference path="./pseudocpu/ControlUnit.ts"/>
/// <reference path="./pseudocpu/ECE375PseudoCPU.ts"/>
(function (PseudoCPU) {
    PseudoCPU.WORD_SIZE = 16; // word size in bits.
    PseudoCPU.ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
    PseudoCPU.OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
    PseudoCPU.OPERAND_SIZE = PseudoCPU.ADDRESS_SIZE; // operand size in bits.
    PseudoCPU.PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
    PseudoCPU.DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.
    function main() {
        const PC = new PseudoCPU.Register("PC", PseudoCPU.ADDRESS_SIZE);
        const IR = new PseudoCPU.Register("IR", PseudoCPU.OPCODE_SIZE);
        const AC = new PseudoCPU.Register("AC", PseudoCPU.WORD_SIZE);
        const MDR = new PseudoCPU.Register("MDR", PseudoCPU.WORD_SIZE);
        const MAR = new PseudoCPU.Register("MAR", PseudoCPU.ADDRESS_SIZE);
        const ALU = new PseudoCPU.ArithmeticLogicUnit(AC, MDR);
        const PROG = new PseudoCPU.Memory(PseudoCPU.PROGRAM_MEMORY_SIZE);
        const DATA = new PseudoCPU.Memory(PseudoCPU.DATA_MEMORY_SIZE);
        const M = new PseudoCPU.MemoryMap(MDR, MAR);
        const CU = new PseudoCPU.ControlUnit(IR, PC, AC, MAR, MDR, ALU, M);
        // Assemble the CPU.
        const CPU = new PseudoCPU.ECE375PseudoCPU({
            PC, IR, AC, MDR, MAR, ALU, PROG, DATA, M, CU
        });
        // Map data and program memory locations onto the MemoryMap.
        // Place 
        const DATA_BEGIN = PROG.SIZE;
        // Place program starting immedietaly after DATA.
        const PROG_BEGIN = 0;
        M.mapExternalMemory(DATA_BEGIN, DATA.SIZE, PseudoCPU.MemoryAccess.READ_WRITE, DATA);
        M.mapExternalMemory(PROG_BEGIN, PROG.SIZE, PseudoCPU.MemoryAccess.READ, PROG);
        // Point PC to first program instruction.
        PC.write(PROG_BEGIN);
        // Program to compute the code C = 4*A + B.
        // Labels from perspective of MemoryMap.
        let A = DATA_BEGIN; // Label A = DATA[0]
        let B = DATA_BEGIN + 1; // Label B = DATA[1]
        let C = DATA_BEGIN + 2; // Label C = DATA[2]
        const program = [
            PseudoCPU.LDA(A),
            PseudoCPU.SHFT(),
            PseudoCPU.SHFT(),
            PseudoCPU.ADD(B),
            PseudoCPU.STA(C),
        ];
        // Write the program into program memory.
        CPU.loadProgram(program);
        // Write initial values into data memory.
        // Normalizing labels since I'm writing to Memory (local address) not MemoryMap (mapped address).
        DATA.write(A - DATA_BEGIN, 20); // M[A] = 20
        DATA.write(B - DATA_BEGIN, 20); // M[B] = 20
        function printState() {
            const print = (...args) => console.log(...args.map(value => value.toString()));
            print("==========");
            print("== Registers");
            print(PC);
            print(IR, "=>", PseudoCPU.OpCode[IR.read()]);
            print(AC, "|", `Z=${ALU.Z}`);
            print(MDR);
            print(MAR);
            print("== Program Memory");
            print(PROG.toString(PROG_BEGIN));
            print("== Data Memory");
            print(DATA.toString(DATA_BEGIN));
            print("\n");
        }
        // Run every instruction in the program.
        // Print the CPU state after each step.
        console.log("== Initial State");
        printState();
        const NUM_INSTRUCTIONS = program.length;
        for (let i = 0; i < NUM_INSTRUCTIONS; i++) {
            CPU.step();
            console.log(`Step #${i + 1}`);
            printState();
        }
    }
    PseudoCPU.main = main;
})(PseudoCPU || (PseudoCPU = {}));
PseudoCPU.main();
