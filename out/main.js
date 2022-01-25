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
        mapExternalMemory(start, length, M) {
            function read(address) {
                return M.read(address - start);
            }
            function write(address, value) {
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
            let sum = this._ac.read() + this._mdr.read();
            this._ac.write(sum);
            this.Z = sum == 0 ? 1 : 0;
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
    class Instruction {
        constructor(opcode, operand) {
            this.opcode = opcode;
            this.operand = operand;
        }
        get value() {
            return (this.opcode << (PseudoCPU.WORD_SIZE - PseudoCPU.OPERAND_SIZE)) + this.operand;
        }
    }
    PseudoCPU.Instruction = Instruction;
    PseudoCPU.LDA = (operand) => new Instruction(OpCode.LDA, operand);
    PseudoCPU.STA = (operand) => new Instruction(OpCode.STA, operand);
    PseudoCPU.ADD = (operand) => new Instruction(OpCode.ADD, operand);
    PseudoCPU.J = (operand) => new Instruction(OpCode.J, operand);
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
            const [IR, PC, AC, MAR, MDR, ALU, M] = [this._ir, this._pc, this._ac, this._mar, this._mdr, this._alu, this._memory];
            const copy = (dst, src) => dst.write(src.read());
            let opcode = this._ir.read();
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
            this._memory.load();
            // this._progMem.load();
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
/// <reference path="./pseudocpu/MemoryMap.ts"/>
/// <reference path="./pseudocpu/Register.ts"/>
/// <reference path="./pseudocpu/ArithmeticLogicUnit.ts"/>
/// <reference path="./pseudocpu/Instruction.ts"/>
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
/// <reference path="./pseudocpu/MemoryMap.ts"/>
/// <reference path="./pseudocpu/Register.ts"/>
/// <reference path="./pseudocpu/ArithmeticLogicUnit.ts"/>
/// <reference path="./pseudocpu/Instruction.ts"/>
/// <reference path="./pseudocpu/ControlUnit.ts"/>
(function (PseudoCPU) {
    PseudoCPU.WORD_SIZE = 16; // word size in bits..
    PseudoCPU.ADDRESS_SIZE = 8; // address size in bits.
    PseudoCPU.OPCODE_SIZE = 8; // opcode size in bits.
    PseudoCPU.OPERAND_SIZE = 8; // operand size in bits.
    PseudoCPU.PROGRAM_MEMORY_SIZE = 16; // addressable words of program memory.
    PseudoCPU.DATA_MEMORY_SIZE = 8; // addressable words of data memory.
    function main() {
        let PC = new PseudoCPU.Register("PC", PseudoCPU.ADDRESS_SIZE);
        let IR = new PseudoCPU.Register("IR", PseudoCPU.OPCODE_SIZE);
        let AC = new PseudoCPU.Register("AC", PseudoCPU.WORD_SIZE);
        let MDR = new PseudoCPU.Register("MDR", PseudoCPU.WORD_SIZE);
        let MAR = new PseudoCPU.Register("MAR", PseudoCPU.ADDRESS_SIZE);
        let ALU = new PseudoCPU.ArithmeticLogicUnit(AC, MDR);
        let PROG = new PseudoCPU.Memory(PseudoCPU.PROGRAM_MEMORY_SIZE);
        let DATA = new PseudoCPU.Memory(PseudoCPU.DATA_MEMORY_SIZE);
        let M = new PseudoCPU.MemoryMap(MDR, MAR);
        let CU = new PseudoCPU.ControlUnit(IR, PC, AC, MAR, MDR, ALU, M);
        const DATA_BEGIN = 0x0000;
        M.mapExternalMemory(DATA_BEGIN, DATA.SIZE, DATA);
        const PROG_BEGIN = 0x0100;
        M.mapExternalMemory(PROG_BEGIN, PROG.SIZE, PROG);
        // Place PC on first program instruction.
        PC.write(PROG_BEGIN);
        // Program to compute the first 5 fibonacci numbers.
        let program = [
            PseudoCPU.LDA(0x00),
            PseudoCPU.ADD(0x00),
            PseudoCPU.STA(0x01),
            PseudoCPU.ADD(0x00),
            PseudoCPU.STA(0x02),
            PseudoCPU.ADD(0x01),
            PseudoCPU.STA(0x03),
            PseudoCPU.ADD(0x02),
            PseudoCPU.STA(0x04),
        ];
        program.forEach((instruction, address) => {
            PROG.write(address, instruction.value);
        });
        let NUM_INSTRUCTIONS = program.length;
        // Initial fibonacci number (1).
        DATA.write(0x00, 0x0001); // M[0x00] = 0x0001
        function printState() {
            let print = (...args) => console.log(...args.map(value => value.toString()));
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
        console.log("== Initial State");
        printState();
        for (let i = 0; i < NUM_INSTRUCTIONS; i++) {
            CU.step();
            printState();
        }
    }
    PseudoCPU.main = main;
})(PseudoCPU || (PseudoCPU = {}));
PseudoCPU.main();
