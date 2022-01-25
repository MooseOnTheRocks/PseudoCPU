"use strict";
var PseudoCPU;
(function (PseudoCPU) {
    let MemoryAccessMode;
    (function (MemoryAccessMode) {
        MemoryAccessMode[MemoryAccessMode["READ"] = 0] = "READ";
        MemoryAccessMode[MemoryAccessMode["WRITE"] = 1] = "WRITE";
        MemoryAccessMode[MemoryAccessMode["READ_WRITE"] = 2] = "READ_WRITE";
    })(MemoryAccessMode = PseudoCPU.MemoryAccessMode || (PseudoCPU.MemoryAccessMode = {}));
    PseudoCPU.READ = MemoryAccessMode.READ, PseudoCPU.WRITE = MemoryAccessMode.WRITE, PseudoCPU.READ_WRITE = MemoryAccessMode.READ_WRITE;
    class Memory {
        constructor(size, mode, addressLine, dataLine) {
            this.SIZE = size;
            this.MODE = mode;
            this._data = new Array(this.SIZE);
            this._data.fill(0);
            this._mar = addressLine;
            this._mdr = dataLine;
        }
        store() {
            if (this.MODE === PseudoCPU.READ) {
                throw "Attempted store() on READ only memory";
            }
            let address = this._mar.read();
            let data = this._mdr.read();
            this._data[address] = data;
        }
        load() {
            if (this.MODE === PseudoCPU.WRITE) {
                throw "Attempted load() on WRITE only memory";
            }
            let address = this._mar.read();
            let data = this._data[address];
            this._mdr.write(data);
        }
        _set(address, value) {
            this._data[address] = value;
        }
        _get(address) {
            return this._data[address];
        }
        toString() {
            let lines = [];
            for (let i = 0; i < this.SIZE; i++) {
                lines.push(`0x${i.toString(16)}: 0x${this._data[i].toString(16)}`);
            }
            return lines.join("\n");
        }
    }
    PseudoCPU.Memory = Memory;
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
        }
        add() {
            this._ac.write(this._ac.read() + this._mdr.read());
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
    // J x: PC <- MDR(address)
    // BNE x: if (z != 1) then PC <- MAR(address)
    let OpCode;
    (function (OpCode) {
        OpCode[OpCode["LDA"] = 0] = "LDA";
        OpCode[OpCode["STA"] = 1] = "STA";
        OpCode[OpCode["ADD"] = 2] = "ADD";
        OpCode[OpCode["J"] = 3] = "J";
        OpCode[OpCode["BNE"] = 4] = "BNE";
    })(OpCode = PseudoCPU.OpCode || (PseudoCPU.OpCode = {}));
    function opname(opcode) {
        switch (opcode) {
            case OpCode.LDA: return "LDA";
            case OpCode.STA: return "STA";
            case OpCode.ADD: return "ADD";
            case OpCode.J: return "J";
            case OpCode.BNE: return "BNE";
            default: return "UNKNOWN";
        }
    }
    PseudoCPU.opname = opname;
})(PseudoCPU || (PseudoCPU = {}));
var PseudoCPU;
(function (PseudoCPU) {
    class ControlUnit {
        constructor(ir, pc, ac, mar, mdr, alu, programMemory, dataMemory) {
            this._ir = ir;
            this._pc = pc;
            this._ac = ac;
            this._mar = mar;
            this._mdr = mdr;
            this._alu = alu;
            this._progMem = programMemory;
            this._dataMem = dataMemory;
        }
        // Fetches, decodes, and executes the current instruction.
        // PC <- PC + 1 unless branch or jump occurs.
        step() {
            this.fetchAndDecodeNextInstruction();
            this.executeInstruction();
        }
        executeInstruction() {
            // Instruction memory format:
            //      [Instruction: WORD_SIZE] =
            //          [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]
            // Operand usage is defined by the opcode.
            // Operand address is loaded into MAR after the fetch and decode cycle.
            //
            // Notation:
            // ```
            // OPCODE x:
            // Register Transactions
            // ```
            // Example:
            // ```
            // ADD x:
            // MDR <- M[MAR]
            // AC <- AC + MDR
            // ```
            const [IR, PC, AC, MAR, MDR, ALU, PROG, DATA] = [this._ir, this._pc, this._ac, this._mar, this._mdr, this._alu, this._progMem, this._dataMem];
            const copy = (dst, src) => dst.write(src.read());
            let opcode = this._ir.read();
            switch (opcode) {
                case PseudoCPU.OpCode.LDA: // LDA x:
                    DATA.load(); // MDR <- M[MAR]
                    copy(AC, MDR); // AC <- MDR
                    break;
                case PseudoCPU.OpCode.STA: // STA x:
                    copy(MDR, AC); // MDR <- AC
                    DATA.store(); // M[MAR] <- MDR
                    break;
                case PseudoCPU.OpCode.ADD: // ADD x:
                    DATA.load(); // MDR <- M[MAR]
                    ALU.add(); // AC <- AC + MDR
                    break;
                case PseudoCPU.OpCode.J: // J x:
                    // PC <- MDR(address)
                    let ADDRESS_MASK = (1 << PseudoCPU.ADDRESS_SIZE) - 1;
                    let address = MDR.read() & ADDRESS_MASK;
                    PC.write(address);
                    break;
                case PseudoCPU.OpCode.BNE:
                    // BNE x: if (Z != 1) then PC <- MAR(address)
                    break;
                default:
                    throw `Unknown opcode: ${opcode}`;
            }
        }
        // Performs instruction fetch and decode.
        fetchAndDecodeNextInstruction() {
            // MAR <- PC
            this._mar.write(this._pc.read());
            // PC <- PC + 1
            this._pc.write(this._pc.read() + 1);
            // MDR <- M[MAR]
            this._progMem.load();
            // IR <- MDR(opcode)
            let OPCODE_SHIFT = PseudoCPU.WORD_SIZE - PseudoCPU.OPCODE_SIZE;
            let opcode = this._mdr.read() >> OPCODE_SHIFT;
            this._ir.write(opcode);
            // MAR <- MDR(address)
            let ADDRESS_MASK = (1 << PseudoCPU.ADDRESS_SIZE) - 1;
            let address = this._mdr.read() & ADDRESS_MASK;
            this._mar.write(address);
        }
    }
    PseudoCPU.ControlUnit = ControlUnit;
})(PseudoCPU || (PseudoCPU = {}));
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
var PseudoCPU;
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
(function (PseudoCPU) {
    PseudoCPU.WORD_SIZE = 16; // word size in bits..
    PseudoCPU.ADDRESS_SIZE = 8; // address size in bits.
    PseudoCPU.OPCODE_SIZE = 8; // opcode size in bits.
    PseudoCPU.PROGRAM_MEMORY_SIZE = 8; // addressable words of program memory.
    PseudoCPU.DATA_MEMORY_SIZE = 8; // addressable words of data memory.
    function main() {
        let PC = new PseudoCPU.Register("PC", PseudoCPU.ADDRESS_SIZE);
        let IR = new PseudoCPU.Register("IR", PseudoCPU.OPCODE_SIZE);
        let AC = new PseudoCPU.Register("AC", PseudoCPU.WORD_SIZE);
        let MDR = new PseudoCPU.Register("MDR", PseudoCPU.WORD_SIZE);
        let MAR = new PseudoCPU.Register("MAR", PseudoCPU.ADDRESS_SIZE);
        let ALU = new PseudoCPU.ArithmeticLogicUnit(AC, MDR);
        let PROG = new PseudoCPU.Memory(PseudoCPU.PROGRAM_MEMORY_SIZE, PseudoCPU.READ, MAR, MDR);
        // LDA  0x07; AC <- M[0x07]
        PROG._set(0, 0x0007);
        // STA  0x01; M[0x01] <- AC
        PROG._set(1, 0x0101);
        // ADD  0x01; AC <- AC + MDR
        PROG._set(2, 0x0201);
        // STA  0x00; M[0x00] <- AC
        PROG._set(3, 0x0100);
        let DATA = new PseudoCPU.Memory(PseudoCPU.DATA_MEMORY_SIZE, PseudoCPU.READ_WRITE, MAR, MDR);
        // M[0x07] = 0xbe
        DATA._set(0x07, 0xbe);
        let CU = new PseudoCPU.ControlUnit(IR, PC, AC, MAR, MDR, ALU, PROG, DATA);
        function printState() {
            let print = (...args) => console.log(...args.map(value => value.toString()));
            print("==========");
            print("== Registers");
            print(PC);
            print(IR, "=>", PseudoCPU.opname(IR.read()));
            print(AC);
            print(MDR);
            print(MAR);
            print("== Program Memory");
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
    PseudoCPU.main = main;
})(PseudoCPU || (PseudoCPU = {}));
PseudoCPU.main();
