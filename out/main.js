/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/architecture/Bit.ts":
/*!*********************************!*\
  !*** ./src/architecture/Bit.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BitField = exports.Bit = void 0;
class Bit {
    constructor(value) {
        this._value = value !== null && value !== void 0 ? value : 0;
    }
    set() {
        this._value = 1;
    }
    clear() {
        this._value = 0;
    }
    read() {
        return this._value;
    }
}
exports.Bit = Bit;
class BitField {
    constructor(size) {
        this.SIZE = size;
        this._bits = new Array();
        for (let i = 0; i < size; i++) {
            this._bits.push(new Bit());
        }
    }
    get VALUE() {
        return this._bits.reduce((prev, bit, index) => prev + (bit.read() << index), 0);
        // let total = 0;
        // for (let i = 0; i < this.SIZE; i++) {
        //     let bit_value = this._bits[i].read();
        //     total += bit_value << i;
        // }
        // return total;
    }
    set(index) {
        if (index < 0 || index >= this.SIZE) {
            throw "BitField.set out of bounds";
        }
        this._bits[index].set();
    }
    clear(index) {
        if (index < 0 || index >= this.SIZE) {
            throw "BitField.clear out of bounds";
        }
        this._bits[index].clear();
    }
    read(index) {
        if (index < 0 || index >= this.SIZE) {
            throw "BitField.read out of bounds";
        }
        return this._bits[index].read();
    }
}
exports.BitField = BitField;


/***/ }),

/***/ "./src/architecture/Memory.ts":
/*!************************************!*\
  !*** ./src/architecture/Memory.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Memory = void 0;
class Memory {
    constructor(name, size) {
        this.NAME = name;
        this.SIZE = size;
        this._data = new Array(this.SIZE);
        this._data.fill(0);
    }
    write(address, data) {
        console.log(`${this.NAME}.write(${address}, ${data})`);
        this._data[address] = data;
    }
    read(address) {
        console.log(`${this.NAME}.read(${address})`);
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
exports.Memory = Memory;


/***/ }),

/***/ "./src/architecture/MemoryMap.ts":
/*!***************************************!*\
  !*** ./src/architecture/MemoryMap.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MemoryMap = exports.MemoryAccess = void 0;
var MemoryAccess;
(function (MemoryAccess) {
    MemoryAccess[MemoryAccess["READ"] = 0] = "READ";
    MemoryAccess[MemoryAccess["WRITE"] = 1] = "WRITE";
    MemoryAccess[MemoryAccess["READ_WRITE"] = 2] = "READ_WRITE";
})(MemoryAccess = exports.MemoryAccess || (exports.MemoryAccess = {}));
class MemoryMap {
    constructor() {
        this.mappings = new Map();
    }
    findAddressMapping(address) {
        let ranges = [...this.mappings.keys()];
        let key = ranges.find(range => address >= range[0] && address <= range[1]);
        let mapping = key ? this.mappings.get(key) : undefined;
        return mapping;
    }
    read(address) {
        let mapping = this.findAddressMapping(address);
        if (mapping === undefined) {
            throw "Attempting to load() from unmapped memory";
        }
        else {
            let data = mapping.read(address);
            return data;
        }
    }
    write(address, data) {
        let mapping = this.findAddressMapping(address);
        if (mapping === undefined) {
            throw "Attempting to store() to unmapped memory";
        }
        else {
            mapping.write(address, data);
        }
    }
    mapMemoryRange(start, length, mode, MM) {
        function read_(address) {
            if (mode === MemoryAccess.WRITE) {
                throw "Attempting to read() from WRITE-only memory";
            }
            return MM.read(address - start);
        }
        function write_(address, value) {
            if (mode === MemoryAccess.READ) {
                throw "Attempting to write() to READ-only memory";
            }
            MM.write(address - start, value);
        }
        let range = [start, start + length - 1];
        this.mappings.set(range, { read: read_, write: write_ });
    }
}
exports.MemoryMap = MemoryMap;


/***/ }),

/***/ "./src/architecture/Register.ts":
/*!**************************************!*\
  !*** ./src/architecture/Register.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Register = void 0;
const Bit_1 = __webpack_require__(/*! @/Bit */ "./src/architecture/Bit.ts");
class Register {
    constructor(name, size) {
        this.NAME = name;
        this.SIZE = size;
        // this._data = 0;
        // this._data = new Array<Bit>();
        // for (let i = 0; i < size; i++) {
        //     this._data.push(new Bit());
        // }
        this._bits = new Bit_1.BitField(size);
    }
    write(value) {
        // this._data = value;
        // for (let i = 0; i < this.SIZE; i++) {
        //     let bit_value = (value >> i) & 1;
        //     if (bit_value === 1) {
        //         this._data[i].set();
        //     }
        //     else {
        //         this._data[i].clear();
        //     }
        // }
        for (let i = 0; i < this.SIZE; i++) {
            let bit_value = (value >> i) & 1;
            if (bit_value === 1) {
                this._bits.set(i);
            }
            else {
                this._bits.clear(i);
            }
        }
    }
    read() {
        // return this._data;
        // let total = 0;
        // for (let i = 0; i < this.SIZE; i++) {
        //     let bit_value = this._data[i].read();
        //     total += bit_value << i;
        // }
        // return total;
        return this._bits.VALUE;
    }
    toString() {
        // let bit_str = this._bits.map(bit => bit.read() === 1 ? "1" : "0").reverse().join("");
        let hex_str = "0x" + this._bits.VALUE.toString(16);
        return `${this.NAME}<${hex_str}>`;
    }
}
exports.Register = Register;


/***/ }),

/***/ "./src/implementations/PseudoCPU/Basic/PseudoCPUBasic.ts":
/*!***************************************************************!*\
  !*** ./src/implementations/PseudoCPU/Basic/PseudoCPUBasic.ts ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PseudoCPUBasic = void 0;
const Register_1 = __webpack_require__(/*! @/Register */ "./src/architecture/Register.ts");
const Memory_1 = __webpack_require__(/*! @/Memory */ "./src/architecture/Memory.ts");
const MemoryMap_1 = __webpack_require__(/*! @/MemoryMap */ "./src/architecture/MemoryMap.ts");
const PseudoCU_1 = __webpack_require__(/*! ./PseudoCU */ "./src/implementations/PseudoCPU/Basic/PseudoCU.ts");
const PseudoALU_1 = __webpack_require__(/*! ../PseudoALU */ "./src/implementations/PseudoCPU/PseudoALU.ts");
class PseudoCPUBasic {
    constructor() {
        this.WORD_SIZE = 16; // word size in bits.
        this.ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
        this.OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
        this.PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
        this.DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.
        this.PROGRAM_MEMORY_BEGIN = 0x00; // address of first word of program memory.
        this.DATA_MEMORY_BEGIN = this.PROGRAM_MEMORY_SIZE; // address of first word of data memory.
        this.PC = new Register_1.Register("PC", this.ADDRESS_SIZE);
        this.IR = new Register_1.Register("IR", this.OPCODE_SIZE);
        this.AC = new Register_1.Register("AC", this.WORD_SIZE);
        this.MDR = new Register_1.Register("MDR", this.WORD_SIZE);
        this.MAR = new Register_1.Register("MAR", this.ADDRESS_SIZE);
        this.ALU = new PseudoALU_1.PseudoALU(this.AC, this.MDR, this.WORD_SIZE);
        this.PROG = new Memory_1.Memory("PROG", this.PROGRAM_MEMORY_SIZE);
        this.DATA = new Memory_1.Memory("DATA", this.DATA_MEMORY_SIZE);
        this.M = new MemoryMap_1.MemoryMap();
        this.M.mapMemoryRange(this.PROGRAM_MEMORY_BEGIN, this.PROGRAM_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ, this.PROG);
        this.M.mapMemoryRange(this.DATA_MEMORY_BEGIN, this.DATA_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ_WRITE, this.DATA);
        this.CU = new PseudoCU_1.PseudoCU(this, this.IR, this.PC, this.AC, this.MAR, this.MDR, this.ALU, this.M);
    }
    stepInstruction() {
        this.CU.fetchAndDecodeNextInstruction();
        this.CU.executeInstruction();
    }
    writeProgram(start, ...program) {
        program.forEach((instruction, address) => {
            this.PROG.write(start + address - this.PROGRAM_MEMORY_BEGIN, instruction);
        });
    }
    writeData(start, ...data) {
        data.forEach((value, address) => {
            this.DATA.write(start + address - this.DATA_MEMORY_BEGIN, value);
        });
    }
}
exports.PseudoCPUBasic = PseudoCPUBasic;


/***/ }),

/***/ "./src/implementations/PseudoCPU/Basic/PseudoCU.ts":
/*!*********************************************************!*\
  !*** ./src/implementations/PseudoCPU/Basic/PseudoCU.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PseudoCU = void 0;
const PseudoInstruction_1 = __webpack_require__(/*! ../PseudoInstruction */ "./src/implementations/PseudoCPU/PseudoInstruction.ts");
class PseudoCU {
    constructor(architecture, ir, pc, ac, mar, mdr, alu, memory) {
        this._architecture = architecture;
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
        this._mdr.write(this._memory.read(this._mar.read()));
        // IR <- MDR(opcode)
        let OPCODE_SHIFT = this._architecture.WORD_SIZE - this._architecture.OPCODE_SIZE;
        let opcode = this._mdr.read() >> OPCODE_SHIFT;
        this._ir.write(opcode);
        // MAR <- MDR(address)
        let ADDRESS_MASK = (1 << this._architecture.ADDRESS_SIZE) - 1;
        let address = this._mdr.read() & ADDRESS_MASK;
        this._mar.write(address);
    }
    // Executes the current instruction loaded into IR.
    executeInstruction() {
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
        function copy(dst, src) {
            dst.write(src.read());
        }
        function load() {
            MDR.write(M.read(MAR.read()));
        }
        function store() {
            M.write(MAR.read(), MDR.read());
        }
        let opcode = IR.read();
        switch (opcode) {
            case PseudoInstruction_1.PseudoOpCode.LDA: // LDA x:
                load(); // MDR <- M[MAR]
                copy(AC, MDR); // AC <- MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.STA: // STA x:
                copy(MDR, AC); // MDR <- AC
                store(); // M[MAR] <- MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.ADD: // ADD x:
                load(); // MDR <- M[MAR]
                ALU.add(); // AC <- AC + MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.SUB: // SUB x:
                load(); // MDR <- M[MAR]
                ALU.sub(); // AC <- AC - MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.NAND: // NAND x:
                load(); // MDR <- M[MAR]
                ALU.nand(); // AC <- ~(AC & MDR)
                break;
            case PseudoInstruction_1.PseudoOpCode.SHFT: // SHFT:
                ALU.shft(); // AC <- AC << 1
                break;
            case PseudoInstruction_1.PseudoOpCode.J: // J x:
                // PC <- MDR(address)
                let ADDRESS_MASK = (1 << this._architecture.ADDRESS_SIZE) - 1;
                let address = MDR.read() & ADDRESS_MASK;
                PC.write(address);
                break;
            case PseudoInstruction_1.PseudoOpCode.BNE: // BNE x:
                // if (Z != 1) then PC <- MDR(address)
                if (ALU.Z != 1) {
                    let ADDRESS_MASK = (1 << this._architecture.ADDRESS_SIZE) - 1;
                    let address = MDR.read() & ADDRESS_MASK;
                    PC.write(address);
                }
                break;
            default:
                throw `Unknown opcode: ${opcode}`;
        }
    }
}
exports.PseudoCU = PseudoCU;


/***/ }),

/***/ "./src/implementations/PseudoCPU/PseudoALU.ts":
/*!****************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoALU.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PseudoALU = void 0;
const Register_1 = __webpack_require__(/*! @/Register */ "./src/architecture/Register.ts");
class PseudoALU {
    constructor(ac, mdr, wordSize) {
        this._ac = ac;
        this._mdr = mdr;
        this.WORD_SIZE = wordSize;
        this._z = new Register_1.Register("Z", 1);
    }
    get Z() {
        return this._z.read();
    }
    set Z(value) {
        this._z.write(value);
    }
    add() {
        let WORD_MASK = (1 << this.WORD_SIZE) - 1;
        let sum = (this._ac.read() + this._mdr.read()) & WORD_MASK;
        this._ac.write(sum);
        this.Z = sum === 0 ? 1 : 0;
    }
    sub() {
        let WORD_MASK = (1 << this.WORD_SIZE) - 1;
        let difference = (this._ac.read() - this._mdr.read()) & WORD_MASK;
        this._ac.write(difference);
        this.Z = difference === 0 ? 1 : 0;
    }
    nand() {
        let WORD_MASK = (1 << this.WORD_SIZE) - 1;
        let result = ~(this._ac.read() & this._mdr.read()) & WORD_MASK;
        this._ac.write(result);
        this.Z = result === 0 ? 1 : 0;
    }
    shft() {
        let WORD_MASK = (1 << this.WORD_SIZE) - 1;
        let result = (this._ac.read() << 1) & WORD_MASK;
        this._ac.write(result);
        this.Z = result === 0 ? 1 : 0;
    }
}
exports.PseudoALU = PseudoALU;


/***/ }),

/***/ "./src/implementations/PseudoCPU/PseudoInstruction.ts":
/*!************************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoInstruction.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports) => {


// == PseudoCPU Instructions
// LDA x: MDR <- M[MAR], AC <- MDR
// STA x: MDR <- AC, M[MAR] <- MDR
// ADD x: MDR <- M[MAR], AC <- AC + MDR
// SUB x: MDR <- M[MAR], AC <- AC - MDR
// NAND x: MDR <- M[MAR], AC <- ~(AC & MDR)
// SHFT x: AC <- AC << 1
// J x: PC <- MDR(address)
// BNE x: if (z != 1) then PC <- MAR(address)
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.instructionBuilder = exports.PseudoInstruction = exports.PseudoOpCode = void 0;
var PseudoOpCode;
(function (PseudoOpCode) {
    PseudoOpCode[PseudoOpCode["LDA"] = 0] = "LDA";
    PseudoOpCode[PseudoOpCode["STA"] = 1] = "STA";
    PseudoOpCode[PseudoOpCode["ADD"] = 2] = "ADD";
    PseudoOpCode[PseudoOpCode["SUB"] = 3] = "SUB";
    PseudoOpCode[PseudoOpCode["NAND"] = 4] = "NAND";
    PseudoOpCode[PseudoOpCode["SHFT"] = 5] = "SHFT";
    PseudoOpCode[PseudoOpCode["J"] = 6] = "J";
    PseudoOpCode[PseudoOpCode["BNE"] = 7] = "BNE";
})(PseudoOpCode = exports.PseudoOpCode || (exports.PseudoOpCode = {}));
// Instruction memory format:
//      [Instruction: WORD_SIZE] = [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]
// Operand usage is defined by the opcode.
// Operand address is loaded into MAR after the fetch and decode cycle.
class PseudoInstruction {
    constructor(offset, opcode, operand) {
        this.opcode = opcode;
        this.operand = operand;
        this.VALUE = (this.opcode << offset) + this.operand;
    }
}
exports.PseudoInstruction = PseudoInstruction;
const instructionBuilder = ({ ADDRESS_SIZE }) => ({
    LDA: (operand) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.LDA, operand),
    STA: (operand) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.STA, operand),
    ADD: (operand) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.ADD, operand),
    SUB: (operand) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.SUB, operand),
    NAND: (operand) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.NAND, operand),
    SHFT: () => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.SHFT, 0),
    J: (operand) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.J, operand),
    BNE: (operand) => new PseudoInstruction(ADDRESS_SIZE, PseudoOpCode.BNE, operand),
});
exports.instructionBuilder = instructionBuilder;


/***/ }),

/***/ "./src/implementations/PseudoCPU/programs/mul_4_A__add_B.ts":
/*!******************************************************************!*\
  !*** ./src/implementations/PseudoCPU/programs/mul_4_A__add_B.ts ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const PseudoInstruction_1 = __webpack_require__(/*! ../PseudoInstruction */ "./src/implementations/PseudoCPU/PseudoInstruction.ts");
function programBuilder(CPU) {
    // Create instruction bit representation based on CPU opcode and address size.
    const { LDA, STA, ADD, SHFT } = (0, PseudoInstruction_1.instructionBuilder)(CPU);
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
exports["default"] = programBuilder;


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const PseudoCPUBasic_1 = __webpack_require__(/*! @/PseudoCPU/Basic/PseudoCPUBasic */ "./src/implementations/PseudoCPU/Basic/PseudoCPUBasic.ts");
const PseudoInstruction_1 = __webpack_require__(/*! @/PseudoCPU/PseudoInstruction */ "./src/implementations/PseudoCPU/PseudoInstruction.ts");
const mul_4_A__add_B_1 = __importDefault(__webpack_require__(/*! @/PseudoCPU/programs/mul_4_A__add_B */ "./src/implementations/PseudoCPU/programs/mul_4_A__add_B.ts"));
function main() {
    // Construct a ECE375 Pseudo CPU, factory new!
    const CPU = new PseudoCPUBasic_1.PseudoCPUBasic();
    let { labels, program } = (0, mul_4_A__add_B_1.default)(CPU);
    const { A, B } = labels;
    // Write program to memory.
    CPU.writeProgram(0, ...program);
    // Initial values: A = 20, B = 20, C = 0.
    CPU.writeData(A, 20);
    CPU.writeData(B, 21);
    function printCPU() {
        const print = (...args) => console.log(...args.map(value => value.toString()));
        const { PC, IR, AC, MDR, MAR, ALU, PROG, DATA, M, CU } = CPU;
        print(PC);
        print(IR, "=>", PseudoInstruction_1.PseudoOpCode[IR.read()]);
        print(AC, "=>", AC.read());
        print(`Z=${ALU.Z}`);
        print(MDR, "=>", MDR.read());
        print(MAR);
        print(`== ${PROG.NAME} memory`);
        print(PROG);
        print(`== ${DATA.NAME} memory`);
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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RyxRQUFRLENBQUM7UUFDMUIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLG1CQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxJQUFXLENBQUM7UUFDUixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQVcsQ0FBQyxDQUFDLEtBQWE7UUFDdEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVNLEdBQUc7UUFDTixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQzNELElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVNLEdBQUc7UUFDTixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMs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Y3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9CaXQudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnkudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnlNYXAudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9SZWdpc3Rlci50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9CYXNpYy9Qc2V1ZG9DUFVCYXNpYy50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9CYXNpYy9Qc2V1ZG9DVS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9BTFUudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvSW5zdHJ1Y3Rpb24udHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvcHJvZ3JhbXMvbXVsXzRfQV9fYWRkX0IudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL21haW4udHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3BzZXVkb2NwdS93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL3BzZXVkb2NwdS93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1L3dlYnBhY2svYWZ0ZXItc3RhcnR1cCJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgdHlwZSBCaXRWYWx1ZSA9IDAgfCAxO1xyXG5cclxuZXhwb3J0IGNsYXNzIEJpdCB7XHJcbiAgICBwcml2YXRlIF92YWx1ZTogQml0VmFsdWU7XHJcblxyXG4gICAgY29uc3RydWN0b3IodmFsdWU/OiBCaXRWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWUgPz8gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KCkge1xyXG4gICAgICAgIHRoaXMuX3ZhbHVlID0gMTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl92YWx1ZTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJpdEZpZWxkIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBTSVpFOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9iaXRzOiBBcnJheTxCaXQ+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuU0laRT0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9iaXRzID0gbmV3IEFycmF5PEJpdD4oKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLl9iaXRzLnB1c2gobmV3IEJpdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBWQUxVRSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9iaXRzLnJlZHVjZSgocHJldiwgYml0LCBpbmRleCkgPT4gcHJldiArIChiaXQucmVhZCgpIDw8IGluZGV4KSwgMCk7XHJcbiAgICAgICAgLy8gbGV0IHRvdGFsID0gMDtcclxuICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU0laRTsgaSsrKSB7XHJcbiAgICAgICAgLy8gICAgIGxldCBiaXRfdmFsdWUgPSB0aGlzLl9iaXRzW2ldLnJlYWQoKTtcclxuICAgICAgICAvLyAgICAgdG90YWwgKz0gYml0X3ZhbHVlIDw8IGk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vIHJldHVybiB0b3RhbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0KGluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuU0laRSkge1xyXG4gICAgICAgICAgICB0aHJvdyBcIkJpdEZpZWxkLnNldCBvdXQgb2YgYm91bmRzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2JpdHNbaW5kZXhdLnNldCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcihpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLlNJWkUpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJCaXRGaWVsZC5jbGVhciBvdXQgb2YgYm91bmRzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2JpdHNbaW5kZXhdLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5TSVpFKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQml0RmllbGQucmVhZCBvdXQgb2YgYm91bmRzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLl9iaXRzW2luZGV4XS5yZWFkKCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBNZW1vcnlNYXBwaW5nIH0gZnJvbSBcIi4vTWVtb3J5TWFwXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTWVtb3J5IGltcGxlbWVudHMgTWVtb3J5TWFwcGluZyB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTkFNRTogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RhdGE6IEFycmF5PG51bWJlcj47XHJcblxyXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzaXplOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLk5BTUUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuU0laRSA9IHNpemU7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG5ldyBBcnJheTxudW1iZXI+KHRoaXMuU0laRSk7XHJcbiAgICAgICAgdGhpcy5fZGF0YS5maWxsKDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZShhZGRyZXNzOiBudW1iZXIsIGRhdGE6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGAke3RoaXMuTkFNRX0ud3JpdGUoJHthZGRyZXNzfSwgJHtkYXRhfSlgKTtcclxuICAgICAgICB0aGlzLl9kYXRhW2FkZHJlc3NdID0gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGAke3RoaXMuTkFNRX0ucmVhZCgke2FkZHJlc3N9KWApO1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2FkZHJlc3NdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZyh3aXRoT2Zmc2V0PzogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IGxpbmVzID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNJWkU7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgYWRkcmVzcyA9IHdpdGhPZmZzZXQgPyBpICsgd2l0aE9mZnNldCA6IGk7XHJcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYDB4JHthZGRyZXNzLnRvU3RyaW5nKDE2KX06IDB4JHt0aGlzLl9kYXRhW2ldLnRvU3RyaW5nKDE2KX1gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBSZWdpc3RlciB9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IE1lbW9yeSB9IGZyb20gXCJAL01lbW9yeVwiO1xyXG5cclxuZXhwb3J0IHR5cGUgTWVtb3J5TWFwcGluZyA9IHtcclxuICAgIHJlYWQ6IChhZGRyZXNzOiBudW1iZXIpID0+IG51bWJlcixcclxuICAgIHdyaXRlOiAoYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiB2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBlbnVtIE1lbW9yeUFjY2VzcyB7XHJcbiAgICBSRUFELFxyXG4gICAgV1JJVEUsXHJcbiAgICBSRUFEX1dSSVRFXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNZW1vcnlNYXAge1xyXG4gICAgLy8gQSBtYXAgZnJvbSBhZGRyZXNzIHJhbmdlIFtzdGFydCwgZW5kXSB0byBhIHJlYWQvd3JpdGFibGUgbWVtb3J5IGxvY2F0aW9uLlxyXG4gICAgcHJpdmF0ZSBtYXBwaW5nczogTWFwPFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl0sIE1lbW9yeU1hcHBpbmc+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3MgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmaW5kQWRkcmVzc01hcHBpbmcoYWRkcmVzczogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IHJhbmdlcyA9IFsuLi50aGlzLm1hcHBpbmdzLmtleXMoKV07XHJcbiAgICAgICAgbGV0IGtleSA9IHJhbmdlcy5maW5kKHJhbmdlID0+IGFkZHJlc3MgPj0gcmFuZ2VbMF0gJiYgYWRkcmVzcyA8PSByYW5nZVsxXSk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSBrZXkgPyB0aGlzLm1hcHBpbmdzLmdldChrZXkpIDogdW5kZWZpbmVkO1xyXG4gICAgICAgIHJldHVybiBtYXBwaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBsb2FkKCkgZnJvbSB1bm1hcHBlZCBtZW1vcnlcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gbWFwcGluZy5yZWFkKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgZGF0YTogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBzdG9yZSgpIHRvIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbWFwcGluZy53cml0ZShhZGRyZXNzLCBkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hcE1lbW9yeVJhbmdlKHN0YXJ0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBtb2RlOiBNZW1vcnlBY2Nlc3MsIE1NOiBNZW1vcnlNYXBwaW5nKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZF8oYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICAgICAgaWYgKG1vZGUgPT09IE1lbW9yeUFjY2Vzcy5XUklURSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHJlYWQoKSBmcm9tIFdSSVRFLW9ubHkgbWVtb3J5XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gTU0ucmVhZChhZGRyZXNzIC0gc3RhcnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGVfKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLlJFQUQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byB3cml0ZSgpIHRvIFJFQUQtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE1NLndyaXRlKGFkZHJlc3MgLSBzdGFydCwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdID0gW3N0YXJ0LCBzdGFydCArIGxlbmd0aCAtIDFdO1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3Muc2V0KHJhbmdlLCB7IHJlYWQ6IHJlYWRfLCB3cml0ZTogd3JpdGVfIH0pXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBCaXQsIEJpdEZpZWxkIH0gZnJvbSBcIkAvQml0XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVnaXN0ZXIge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE5BTUU6IHN0cmluZztcclxuICAgIHB1YmxpYyByZWFkb25seSBTSVpFOiBudW1iZXI7XHJcbiAgICAvLyBwcml2YXRlIF9kYXRhOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9iaXRzOiBCaXRGaWVsZDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICAvLyB0aGlzLl9kYXRhID0gMDtcclxuICAgICAgICAvLyB0aGlzLl9kYXRhID0gbmV3IEFycmF5PEJpdD4oKTtcclxuICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xyXG4gICAgICAgIC8vICAgICB0aGlzLl9kYXRhLnB1c2gobmV3IEJpdCgpKTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgdGhpcy5fYml0cyA9IG5ldyBCaXRGaWVsZChzaXplKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIC8vIHRoaXMuX2RhdGEgPSB2YWx1ZTtcclxuICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU0laRTsgaSsrKSB7XHJcbiAgICAgICAgLy8gICAgIGxldCBiaXRfdmFsdWUgPSAodmFsdWUgPj4gaSkgJiAxO1xyXG4gICAgICAgIC8vICAgICBpZiAoYml0X3ZhbHVlID09PSAxKSB7XHJcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9kYXRhW2ldLnNldCgpO1xyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gICAgIGVsc2Uge1xyXG4gICAgICAgIC8vICAgICAgICAgdGhpcy5fZGF0YVtpXS5jbGVhcigpO1xyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5TSVpFOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGJpdF92YWx1ZSA9ICh2YWx1ZSA+PiBpKSAmIDE7XHJcbiAgICAgICAgICAgIGlmIChiaXRfdmFsdWUgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2JpdHMuc2V0KGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYml0cy5jbGVhcihpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZCgpOiBudW1iZXIge1xyXG4gICAgICAgIC8vIHJldHVybiB0aGlzLl9kYXRhO1xyXG4gICAgICAgIC8vIGxldCB0b3RhbCA9IDA7XHJcbiAgICAgICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNJWkU7IGkrKykge1xyXG4gICAgICAgIC8vICAgICBsZXQgYml0X3ZhbHVlID0gdGhpcy5fZGF0YVtpXS5yZWFkKCk7XHJcbiAgICAgICAgLy8gICAgIHRvdGFsICs9IGJpdF92YWx1ZSA8PCBpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvLyByZXR1cm4gdG90YWw7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JpdHMuVkFMVUU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvU3RyaW5nKCkge1xyXG4gICAgICAgIC8vIGxldCBiaXRfc3RyID0gdGhpcy5fYml0cy5tYXAoYml0ID0+IGJpdC5yZWFkKCkgPT09IDEgPyBcIjFcIiA6IFwiMFwiKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcclxuICAgICAgICBsZXQgaGV4X3N0ciA9IFwiMHhcIiArIHRoaXMuX2JpdHMuVkFMVUUudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIHJldHVybiBgJHt0aGlzLk5BTUV9PCR7aGV4X3N0cn0+YDtcclxuICAgIH1cclxufSIsIi8vID09IFBzZXVkb0lTQVxyXG4vLyAtLSBEYXRhIFRyYW5zZmVyIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtMb2FkIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBMREEgeDsgeCBpcyBhIG1lbW9yeSBsb2NhdGlvblxyXG4vLyAgICAgICAgICBMb2FkcyBhIG1lbW9yeSB3b3JkIHRvIHRoZSBBQy5cclxuLy8gICAgICBbU3RvcmUgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNUQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIFN0b3JlcyB0aGUgY29udGVudCBvZiB0aGUgQUMgdG8gbWVtb3J5LlxyXG4vLyAtLSBBcml0aG1ldGljIGFuZCBMb2dpY2FsIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtBZGQgdG8gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIEFERCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgQWRkcyB0aGUgY29udGVudCBvZiB0aGUgbWVtb3J5IHdvcmQgc3BlY2lmaWVkIGJ5XHJcbi8vICAgICAgICAgIHRoZSBlZmZlY3RpdmUgYWRkcmVzcyB0byB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW1N1YnRyYWN0IGZyb20gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNVQiB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgU3VidHJhY3RzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWRcclxuLy8gICAgICAgICAgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGZyb20gdGhlIGNvbnRlbnQgaW4gdGhlIEFDLlxyXG4vLyAgICAgIFtMb2dpY2FsIE5BTkQgd2l0aCBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgTkFORCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgUGVyZm9ybXMgbG9naWNhbCBOQU5EIGJldHdlZW4gdGhlIGNvbnRlbnRzIG9mIHRoZSBtZW1vcnlcclxuLy8gICAgICAgICAgd29yZCBzcGVjaWZpZWQgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGFuZCB0aGUgQUMuXHJcbi8vICAgICAgW1NoaWZ0XVxyXG4vLyAgICAgICAgICBTSEZUXHJcbi8vICAgICAgICAgIFRoZSBjb250ZW50IG9mIEFDIGlzIHNoaWZ0ZWQgbGVmdCBieSBvbmUgYml0LlxyXG4vLyAgICAgICAgICBUaGUgYml0IHNoaWZ0ZWQgaW4gaXMgMC5cclxuLy8gLS0gQ29udHJvbCBUcmFuc2ZlclxyXG4vLyAgICAgIFtKdW1wXVxyXG4vLyAgICAgICAgICBKIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHguXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzLlxyXG4vLyAgICAgIFtCTkVdXHJcbi8vICAgICAgICAgIEJORSB4OyBKdW1wIHRvIGluc3RydWN0aW9uIGluIG1lbW9yeSBsb2NhdGlvbiB4IGlmIGNvbnRlbnQgb2YgQUMgaXMgbm90IHplcm8uXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzIGlmIFogIT0gMC5cclxuLy8gXHJcbi8vID09IFBzZXVkb0NQVSBNaWNyby1vcGVyYXRpb25zXHJcbi8vIC0tIFN0b3JlL0xvYWQgbWVtb3J5XHJcbi8vICAgICAgTVtNQVJdIDwtIE1EUlxyXG4vLyAgICAgIE1EUiA8LSBNW01BUl1cclxuLy8gLS0gQ29weSByZWdpc3RlclxyXG4vLyAgICAgIFJhIDwtIFJiXHJcbi8vIC0tIFJlZ2lzdGVyIGluY3JlbWVudC9kZWNyZW1lbnRcclxuLy8gICAgICBSYSA8LSBSYSArIDFcclxuLy8gICAgICBSYSA8LSBSYSAtIDFcclxuLy8gICAgICBSYSA8LSBSYSArIFJiXHJcbi8vICAgICAgUmEgPC0gUmEgLSBSYlxyXG4vL1xyXG4vLyA9PSBNaW5pbWFsIENvbXBvbmVudHNcclxuLy8gW01lbW9yeV1cclxuLy8gQWRkcmVzc2FibGUgYnkgQWRkcmVzcyBMaW5lIHZpYSBNW01BUl1cclxuLy8gV3JpdGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNW01BUl0gPC0gTURSXHJcbi8vIFJlYWRhYmxlIGJ5IEFkZHJlc3MgTGluZSAmIERhdGEgTGluZSB2aWEgTURSIDwtIE1bTUFSXVxyXG4vLyBOZWVkIHR3byBtZW1vcmllczogcHJvZ3JhbSBtZW1vcnkgKHJlYWQgb25seSkgYW5kIGRhdGEgbWVtb3J5IChyZWFkICYgd3JpdGUpLlxyXG4vL1xyXG4vLyBbQUxVXVxyXG4vLyBQZXJmb3JtcyBhcml0aG1ldGljIG9wZXJhdGlvbnMsIG9mdGVuIGludm9sdmluZyB0aGUgQUMgcmVnaXN0ZXIuXHJcbi8vIEFDIDwtIEFDICsgMVxyXG4vLyBBQyA8LSBBQyArIFJBXHJcbi8vIEFDIDwtIEFDIC0gMVxyXG4vLyBBQyA8LSBBQyAtIFJBXHJcbi8vXHJcbi8vIFtDb250cm9sIFVuaXRdXHJcbi8vIEV4ZWN1dGVzIGluc3RydWN0aW9ucyBhbmQgc2VxdWVuY2VzIG1pY3Jvb3BlcmF0aW9ucy5cclxuLy9cclxuLy8gW01EUiBSZWdpc3Rlcl1cclxuLy8gVHJhbnNmZXIgdG8vZnJvbSBtZW1vcnkgdmlhIERhdGEgTGluZS5cclxuLy9cclxuLy8gW01BUiBSZWdpc3Rlcl1cclxuLy8gQWNjZXNzIG1lbW9yeSB2aWEgQWRkcmVzcyBMaW5lXHJcbi8vXHJcbi8vIFtQQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBQQyA8LSBQQyArIDFcclxuLy9cclxuLy8gW0lSIFJlZ2lzdGVyXVxyXG4vLyBIb2xkcyB0aGUgb3Bjb2RlIG9mIHRoZSBjdXJyZW50IGluc3RydWN0aW9uLlxyXG4vL1xyXG4vLyBbQUMgUmVnaXN0ZXJdXHJcbi8vIEluY3JlbWVudCB2aWEgQUMgPC0gQUMgKyAxIG9yIEFDIDwtIEFDICsgUmFcclxuLy8gRGVjcmVtZW50IHZpYSBBQyA8LSBBQyAtIDEgb3IgQUMgPC0gQUMgLSBSYVxyXG4vL1xyXG4vLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG5pbXBvcnQgeyBSZWdpc3RlciB9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IE1lbW9yeSB9IGZyb20gXCJAL01lbW9yeVwiO1xyXG5pbXBvcnQgeyBNZW1vcnlBY2Nlc3MsIE1lbW9yeU1hcCB9IGZyb20gXCJAL01lbW9yeU1hcFwiO1xyXG5pbXBvcnQgeyBDb250cm9sVW5pdCB9IGZyb20gXCJAL0NvbnRyb2xVbml0XCI7XHJcbmltcG9ydCB7IENlbnRyYWxQcm9jZXNzaW5nVW5pdCB9IGZyb20gXCJAL0NlbnRyYWxQcm9jZXNzaW5nVW5pdFwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvQ1UgfSBmcm9tIFwiLi9Qc2V1ZG9DVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9BTFUgfSBmcm9tIFwiLi4vUHNldWRvQUxVXCI7XHJcbmltcG9ydCB7IFBzZXVkb0NQVUFyY2hpdGVjdHVyZSB9IGZyb20gXCIuLi9Qc2V1ZG9DUFVBcmNoaXRlY3R1cmVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DUFVCYXNpYyBpbXBsZW1lbnRzIFBzZXVkb0NQVUFyY2hpdGVjdHVyZSwgQ2VudHJhbFByb2Nlc3NpbmdVbml0IHtcclxuICAgIHB1YmxpYyByZWFkb25seSBXT1JEX1NJWkUgPSAxNjsgLy8gd29yZCBzaXplIGluIGJpdHMuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQUREUkVTU19TSVpFID0gMTM7IC8vIGFkZHJlc3Mgc2l6ZSBpbiBiaXRzOyAyKioxMyA9IDB4MjAwMCA9IDgxOTIgYWRkcmVzc2FibGUgd29yZHMgbWVtb3J5LlxyXG4gICAgcHVibGljIHJlYWRvbmx5IE9QQ09ERV9TSVpFID0gMzsgLy8gb3Bjb2RlIHNpemUgaW4gYml0cywgMioqMyA9IDggdW5pcXVlIG9wY29kZXMuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPR1JBTV9NRU1PUllfU0laRSA9IDB4MDg7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIHByb2dyYW0gbWVtb3J5LlxyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEFfTUVNT1JZX1NJWkUgPSAweDA4OyAvLyBhZGRyZXNzYWJsZSB3b3JkcyBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPR1JBTV9NRU1PUllfQkVHSU4gPSAweDAwOyAvLyBhZGRyZXNzIG9mIGZpcnN0IHdvcmQgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgREFUQV9NRU1PUllfQkVHSU4gPSB0aGlzLlBST0dSQU1fTUVNT1JZX1NJWkU7IC8vIGFkZHJlc3Mgb2YgZmlyc3Qgd29yZCBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUEM6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IElSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBBQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTURSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNQVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFMVTogUHNldWRvQUxVO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0c6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBEQVRBOiBNZW1vcnk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTTogTWVtb3J5TWFwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IENVOiBDb250cm9sVW5pdDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLlBDID0gbmV3IFJlZ2lzdGVyKFwiUENcIiwgdGhpcy5BRERSRVNTX1NJWkUpXHJcbiAgICAgICAgdGhpcy5JUiA9IG5ldyBSZWdpc3RlcihcIklSXCIsIHRoaXMuT1BDT0RFX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuQUMgPSBuZXcgUmVnaXN0ZXIoXCJBQ1wiLCB0aGlzLldPUkRfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NRFIgPSBuZXcgUmVnaXN0ZXIoXCJNRFJcIiwgdGhpcy5XT1JEX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuTUFSID0gbmV3IFJlZ2lzdGVyKFwiTUFSXCIsIHRoaXMuQUREUkVTU19TSVpFKTtcclxuICAgICAgICB0aGlzLkFMVSA9IG5ldyBQc2V1ZG9BTFUodGhpcy5BQywgdGhpcy5NRFIsIHRoaXMuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLlBST0cgPSBuZXcgTWVtb3J5KFwiUFJPR1wiLCB0aGlzLlBST0dSQU1fTUVNT1JZX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuREFUQSA9IG5ldyBNZW1vcnkoXCJEQVRBXCIsIHRoaXMuREFUQV9NRU1PUllfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NID0gbmV3IE1lbW9yeU1hcCgpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBNZW1vcnlSYW5nZSh0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCB0aGlzLlBST0dSQU1fTUVNT1JZX1NJWkUsIE1lbW9yeUFjY2Vzcy5SRUFELCB0aGlzLlBST0cpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBNZW1vcnlSYW5nZSh0aGlzLkRBVEFfTUVNT1JZX0JFR0lOLCB0aGlzLkRBVEFfTUVNT1JZX1NJWkUsIE1lbW9yeUFjY2Vzcy5SRUFEX1dSSVRFLCB0aGlzLkRBVEEpO1xyXG4gICAgICAgIHRoaXMuQ1UgPSBuZXcgUHNldWRvQ1UodGhpcywgdGhpcy5JUiwgdGhpcy5QQywgdGhpcy5BQywgdGhpcy5NQVIsIHRoaXMuTURSLCB0aGlzLkFMVSwgdGhpcy5NKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RlcEluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuQ1UuZmV0Y2hBbmREZWNvZGVOZXh0SW5zdHJ1Y3Rpb24oKTtcclxuICAgICAgICB0aGlzLkNVLmV4ZWN1dGVJbnN0cnVjdGlvbigpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgd3JpdGVQcm9ncmFtKHN0YXJ0OiBudW1iZXIsIC4uLnByb2dyYW06IEFycmF5PG51bWJlcj4pIHtcclxuICAgICAgICBwcm9ncmFtLmZvckVhY2goKGluc3RydWN0aW9uLCBhZGRyZXNzKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuUFJPRy53cml0ZShzdGFydCArIGFkZHJlc3MgLSB0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBpbnN0cnVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlRGF0YShzdGFydDogbnVtYmVyLCAuLi5kYXRhOiBBcnJheTxudW1iZXI+KSB7XHJcbiAgICAgICAgZGF0YS5mb3JFYWNoKCh2YWx1ZSwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLkRBVEEud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5EQVRBX01FTU9SWV9CRUdJTiwgdmFsdWUpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnlNYXAgfSBmcm9tIFwiQC9NZW1vcnlNYXBcIjtcclxuaW1wb3J0IHsgQ29udHJvbFVuaXQgfSBmcm9tIFwiQC9Db250cm9sVW5pdFwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvT3BDb2RlIH0gZnJvbSBcIi4uL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcbmltcG9ydCB7IFBzZXVkb0FMVSB9IGZyb20gXCIuLi9Qc2V1ZG9BTFVcIjtcclxuaW1wb3J0IHsgUHNldWRvQ1BVQXJjaGl0ZWN0dXJlIH0gZnJvbSBcIi4uL1BzZXVkb0NQVUFyY2hpdGVjdHVyZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0NVIGltcGxlbWVudHMgQ29udHJvbFVuaXQge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYXJjaGl0ZWN0dXJlOiBQc2V1ZG9DUFVBcmNoaXRlY3R1cmU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9pcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9wYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tYXI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FsdTogUHNldWRvQUxVO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWVtb3J5OiBNZW1vcnlNYXA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXJjaGl0ZWN0dXJlOiBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUsIGlyOiBSZWdpc3RlciwgcGM6IFJlZ2lzdGVyLCBhYzogUmVnaXN0ZXIsIG1hcjogUmVnaXN0ZXIsIG1kcjogUmVnaXN0ZXIsIGFsdTogUHNldWRvQUxVLCBtZW1vcnk6IE1lbW9yeU1hcCkge1xyXG4gICAgICAgIHRoaXMuX2FyY2hpdGVjdHVyZSA9IGFyY2hpdGVjdHVyZTtcclxuICAgICAgICB0aGlzLl9pciA9IGlyO1xyXG4gICAgICAgIHRoaXMuX3BjID0gcGM7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX2FsdSA9IGFsdTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkgPSBtZW1vcnk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGVyZm9ybXMgaW5zdHJ1Y3Rpb24gZmV0Y2ggYW5kIGRlY29kZS5cclxuICAgIHB1YmxpYyBmZXRjaEFuZERlY29kZU5leHRJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyBNQVIgPC0gUENcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUodGhpcy5fcGMucmVhZCgpKTtcclxuICAgICAgICAvLyBQQyA8LSBQQyArIDFcclxuICAgICAgICB0aGlzLl9wYy53cml0ZSh0aGlzLl9wYy5yZWFkKCkgKyAxKTtcclxuXHJcbiAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgIHRoaXMuX21kci53cml0ZSh0aGlzLl9tZW1vcnkucmVhZCh0aGlzLl9tYXIucmVhZCgpKSk7XHJcblxyXG4gICAgICAgIC8vIElSIDwtIE1EUihvcGNvZGUpXHJcbiAgICAgICAgbGV0IE9QQ09ERV9TSElGVCA9IHRoaXMuX2FyY2hpdGVjdHVyZS5XT1JEX1NJWkUgLSB0aGlzLl9hcmNoaXRlY3R1cmUuT1BDT0RFX1NJWkU7XHJcbiAgICAgICAgbGV0IG9wY29kZSA9IHRoaXMuX21kci5yZWFkKCkgPj4gT1BDT0RFX1NISUZUO1xyXG4gICAgICAgIHRoaXMuX2lyLndyaXRlKG9wY29kZSk7XHJcbiAgICAgICAgLy8gTUFSIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCB0aGlzLl9hcmNoaXRlY3R1cmUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IGFkZHJlc3MgPSB0aGlzLl9tZHIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgIHRoaXMuX21hci53cml0ZShhZGRyZXNzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRXhlY3V0ZXMgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24gbG9hZGVkIGludG8gSVIuXHJcbiAgICBwdWJsaWMgZXhlY3V0ZUluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIC8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuICAgICAgICAvLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbiAgICAgICAgLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4gICAgICAgIC8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4gICAgICAgIC8vIFNVQiB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyAtIE1EUlxyXG4gICAgICAgIC8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuICAgICAgICAvLyBTSEZUIHg6IEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAvLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIC8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuICAgICAgICBjb25zdCBbSVIsIFBDLCBBQywgTUFSLCBNRFIsIEFMVSwgTV0gPSBbdGhpcy5faXIsIHRoaXMuX3BjLCB0aGlzLl9hYywgdGhpcy5fbWFyLCB0aGlzLl9tZHIsIHRoaXMuX2FsdSwgdGhpcy5fbWVtb3J5XTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY29weShkc3Q6IFJlZ2lzdGVyLCBzcmM6IFJlZ2lzdGVyKSB7XHJcbiAgICAgICAgICAgIGRzdC53cml0ZShzcmMucmVhZCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgICAgIE1EUi53cml0ZShNLnJlYWQoTUFSLnJlYWQoKSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RvcmUoKSB7XHJcbiAgICAgICAgICAgIE0ud3JpdGUoTUFSLnJlYWQoKSwgTURSLnJlYWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBvcGNvZGUgPSBJUi5yZWFkKCk7XHJcbiAgICAgICAgc3dpdGNoIChvcGNvZGUpIHtcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuTERBOiAgICAgIC8vIExEQSB4OlxyXG4gICAgICAgICAgICAgICAgbG9hZCgpOyAgICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgY29weShBQywgTURSKTsgICAgICAgICAgLy8gQUMgPC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU1RBOiAgICAgIC8vIFNUQSB4OlxyXG4gICAgICAgICAgICAgICAgY29weShNRFIsIEFDKTsgICAgICAgICAgLy8gTURSIDwtIEFDXHJcbiAgICAgICAgICAgICAgICBzdG9yZSgpOyAgICAgICAgICAgICAgICAvLyBNW01BUl0gPC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuQUREOiAgICAgIC8vIEFERCB4OlxyXG4gICAgICAgICAgICAgICAgbG9hZCgpOyAgICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLmFkZCgpOyAgICAgICAgICAgICAgLy8gQUMgPC0gQUMgKyBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TVUI6ICAgICAgLy8gU1VCIHg6XHJcbiAgICAgICAgICAgICAgICBsb2FkKCk7ICAgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUuc3ViKCk7ICAgICAgICAgICAgICAvLyBBQyA8LSBBQyAtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLk5BTkQ6ICAgICAvLyBOQU5EIHg6XHJcbiAgICAgICAgICAgICAgICBsb2FkKCk7ICAgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUubmFuZCgpOyAgICAgICAgICAgICAvLyBBQyA8LSB+KEFDICYgTURSKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNIRlQ6ICAgICAvLyBTSEZUOlxyXG4gICAgICAgICAgICAgICAgQUxVLnNoZnQoKTsgICAgICAgICAgICAgLy8gQUMgPC0gQUMgPDwgMVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLko6ICAgICAgICAvLyBKIHg6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCB0aGlzLl9hcmNoaXRlY3R1cmUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE1EUi5yZWFkKCkgJiBBRERSRVNTX01BU0s7XHJcbiAgICAgICAgICAgICAgICBQQy53cml0ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5CTkU6ICAgICAgLy8gQk5FIHg6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoWiAhPSAxKSB0aGVuIFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgICAgICAgICAgaWYgKEFMVS5aICE9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgdGhpcy5fYXJjaGl0ZWN0dXJlLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTURSLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICAgICAgICAgICAgICBQQy53cml0ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgYFVua25vd24gb3Bjb2RlOiAke29wY29kZX1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7UmVnaXN0ZXJ9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUHNldWRvQUxVIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBXT1JEX1NJWkU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfejogUmVnaXN0ZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYWM6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCB3b3JkU2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tZHIgPSBtZHI7XHJcbiAgICAgICAgdGhpcy5XT1JEX1NJWkUgPSB3b3JkU2l6ZTtcclxuICAgICAgICB0aGlzLl96ID0gbmV3IFJlZ2lzdGVyKFwiWlwiLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFooKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fei5yZWFkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBaKHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl96LndyaXRlKHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkKCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBzdW0gPSAodGhpcy5fYWMucmVhZCgpICsgdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUoc3VtKTtcclxuICAgICAgICB0aGlzLlogPSBzdW0gPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3ViKCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBkaWZmZXJlbmNlID0gKHRoaXMuX2FjLnJlYWQoKSAtIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKGRpZmZlcmVuY2UpO1xyXG4gICAgICAgIHRoaXMuWiA9IGRpZmZlcmVuY2UgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmFuZCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gfih0aGlzLl9hYy5yZWFkKCkgJiB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuWiA9IHJlc3VsdCA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaGZ0KCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSAodGhpcy5fYWMucmVhZCgpIDw8IDEpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5aID0gcmVzdWx0ID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcbn0iLCIvLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gU1VCIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDIC0gTURSXHJcbi8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuLy8gU0hGVCB4OiBBQyA8LSBBQyA8PCAxXHJcbi8vIEogeDogUEMgPC0gTURSKGFkZHJlc3MpXHJcbi8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuaW1wb3J0IHsgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUgfSBmcm9tIFwiLi9Qc2V1ZG9DUFVBcmNoaXRlY3R1cmVcIjtcclxuXHJcblxyXG5leHBvcnQgZW51bSBQc2V1ZG9PcENvZGUge1xyXG4gICAgTERBICA9IDBiMDAwLFxyXG4gICAgU1RBICA9IDBiMDAxLFxyXG4gICAgQUREICA9IDBiMDEwLFxyXG4gICAgU1VCICA9IDBiMDExLFxyXG4gICAgTkFORCA9IDBiMTAwLFxyXG4gICAgU0hGVCA9IDBiMTAxLFxyXG4gICAgSiAgICA9IDBiMTEwLFxyXG4gICAgQk5FICA9IDBiMTExXHJcbn1cclxuXHJcbi8vIEluc3RydWN0aW9uIG1lbW9yeSBmb3JtYXQ6XHJcbi8vICAgICAgW0luc3RydWN0aW9uOiBXT1JEX1NJWkVdID0gW29wY29kZTogT1BDT0RFX1NJWkVdIFtvcGVyYW5kOiBBRERSRVNTX1NJWkVdXHJcbi8vIE9wZXJhbmQgdXNhZ2UgaXMgZGVmaW5lZCBieSB0aGUgb3Bjb2RlLlxyXG4vLyBPcGVyYW5kIGFkZHJlc3MgaXMgbG9hZGVkIGludG8gTUFSIGFmdGVyIHRoZSBmZXRjaCBhbmQgZGVjb2RlIGN5Y2xlLlxyXG5leHBvcnQgY2xhc3MgUHNldWRvSW5zdHJ1Y3Rpb24gaW1wbGVtZW50cyBJbnN0cnVjdGlvbiB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3Bjb2RlOiBQc2V1ZG9PcENvZGU7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3BlcmFuZDogbnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFZBTFVFOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob2Zmc2V0OiBudW1iZXIsIG9wY29kZTogUHNldWRvT3BDb2RlLCBvcGVyYW5kOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLm9wY29kZSA9IG9wY29kZTtcclxuICAgICAgICB0aGlzLm9wZXJhbmQgPSBvcGVyYW5kO1xyXG4gICAgICAgIHRoaXMuVkFMVUUgPSAodGhpcy5vcGNvZGUgPDwgb2Zmc2V0KSArIHRoaXMub3BlcmFuZDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGluc3RydWN0aW9uQnVpbGRlciA9ICh7QUREUkVTU19TSVpFfTogUHNldWRvQ1BVQXJjaGl0ZWN0dXJlKSA9PiAoe1xyXG4gICAgTERBOiAgICAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuTERBLCBvcGVyYW5kKSxcclxuICAgIFNUQTogICAgKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKEFERFJFU1NfU0laRSwgUHNldWRvT3BDb2RlLlNUQSwgb3BlcmFuZCksXHJcbiAgICBBREQ6ICAgIChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihBRERSRVNTX1NJWkUsIFBzZXVkb09wQ29kZS5BREQsIG9wZXJhbmQpLFxyXG4gICAgU1VCOiAgICAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuU1VCLCBvcGVyYW5kKSxcclxuICAgIE5BTkQ6ICAgKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKEFERFJFU1NfU0laRSwgUHNldWRvT3BDb2RlLk5BTkQsIG9wZXJhbmQpLFxyXG4gICAgU0hGVDogICAoKSAgICAgICAgICAgICAgICA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuU0hGVCwgMCksXHJcbiAgICBKOiAgICAgIChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihBRERSRVNTX1NJWkUsIFBzZXVkb09wQ29kZS5KLCAgIG9wZXJhbmQpLFxyXG4gICAgQk5FOiAgICAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuQk5FLCBvcGVyYW5kKSxcclxufSk7XHJcbiIsImltcG9ydCB7IFBzZXVkb0NQVUFyY2hpdGVjdHVyZSB9IGZyb20gXCIuLi9Qc2V1ZG9DUFVBcmNoaXRlY3R1cmVcIjtcclxuaW1wb3J0IHsgaW5zdHJ1Y3Rpb25CdWlsZGVyIH0gZnJvbSBcIi4uL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwcm9ncmFtQnVpbGRlcihDUFU6IFBzZXVkb0NQVUFyY2hpdGVjdHVyZSkge1xyXG4gICAgLy8gQ3JlYXRlIGluc3RydWN0aW9uIGJpdCByZXByZXNlbnRhdGlvbiBiYXNlZCBvbiBDUFUgb3Bjb2RlIGFuZCBhZGRyZXNzIHNpemUuXHJcbiAgICBjb25zdCB7IExEQSwgU1RBLCBBREQsIFNIRlQgfSA9IGluc3RydWN0aW9uQnVpbGRlcihDUFUpO1xyXG4gICAgLy8gRGVmaW5lIGxhYmVscyBpbiBEQVRBIG1lbW9yeS5cclxuICAgIGNvbnN0IEEgPSBDUFUuREFUQV9NRU1PUllfQkVHSU47XHJcbiAgICBjb25zdCBCID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMTtcclxuICAgIGNvbnN0IEMgPSBDUFUuREFUQV9NRU1PUllfQkVHSU4gKyAyO1xyXG4gICAgY29uc3QgbGFiZWxzID0geyBBLCBCLCBDIH07XHJcbiAgICAvLyBQcm9ncmFtLCBjb21wdXRlcyBDID0gNCpBICsgQlxyXG4gICAgbGV0IHByb2dyYW0gPSBbXHJcbiAgICAgICAgTERBKEEpLFxyXG4gICAgICAgIFNIRlQoKSxcclxuICAgICAgICBTSEZUKCksXHJcbiAgICAgICAgQUREKEIpLFxyXG4gICAgICAgIFNUQShDKVxyXG4gICAgXTtcclxuICAgIC8vIFJldHVybiBsYWJlbHMgYW5kIHByb2dyYW0uXHJcbiAgICByZXR1cm4geyBsYWJlbHMsIHByb2dyYW06IHByb2dyYW0ubWFwKGluc3RydWN0aW9uID0+IGluc3RydWN0aW9uLlZBTFVFKSB9O1xyXG59IiwiaW1wb3J0IHsgUHNldWRvQ1BVQmFzaWMgfSBmcm9tIFwiQC9Qc2V1ZG9DUFUvQmFzaWMvUHNldWRvQ1BVQmFzaWNcIjtcclxuaW1wb3J0IHsgUHNldWRvT3BDb2RlIH0gZnJvbSBcIkAvUHNldWRvQ1BVL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcblxyXG5pbXBvcnQgcHJvZ3JhbUJ1aWxkZXIgZnJvbSBcIkAvUHNldWRvQ1BVL3Byb2dyYW1zL211bF80X0FfX2FkZF9CXCI7XHJcblxyXG5mdW5jdGlvbiBtYWluKCkge1xyXG4gICAgLy8gQ29uc3RydWN0IGEgRUNFMzc1IFBzZXVkbyBDUFUsIGZhY3RvcnkgbmV3IVxyXG4gICAgY29uc3QgQ1BVID0gbmV3IFBzZXVkb0NQVUJhc2ljKCk7XHJcbiAgICBsZXQgeyBsYWJlbHMsIHByb2dyYW19ICA9IHByb2dyYW1CdWlsZGVyKENQVSk7XHJcbiAgICBjb25zdCB7IEEsIEIgfSA9IGxhYmVscztcclxuICAgIC8vIFdyaXRlIHByb2dyYW0gdG8gbWVtb3J5LlxyXG4gICAgQ1BVLndyaXRlUHJvZ3JhbSgwLCAuLi5wcm9ncmFtKTtcclxuICAgIC8vIEluaXRpYWwgdmFsdWVzOiBBID0gMjAsIEIgPSAyMCwgQyA9IDAuXHJcbiAgICBDUFUud3JpdGVEYXRhKEEsIDIwKTtcclxuICAgIENQVS53cml0ZURhdGEoQiwgMjEpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHByaW50Q1BVKCkge1xyXG4gICAgICAgIGNvbnN0IHByaW50ID0gKC4uLmFyZ3M6IEFycmF5PHsgdG9TdHJpbmcoKTogc3RyaW5nIH0+KSA9PiBjb25zb2xlLmxvZyguLi5hcmdzLm1hcCh2YWx1ZSA9PiB2YWx1ZS50b1N0cmluZygpKSk7XHJcbiAgICAgICAgY29uc3QgeyBQQywgSVIsIEFDLCBNRFIsIE1BUiwgQUxVLCBQUk9HLCBEQVRBLCBNLCBDVSB9ID0gQ1BVO1xyXG4gICAgICAgIHByaW50KFBDKTtcclxuICAgICAgICBwcmludChJUiwgXCI9PlwiLCBQc2V1ZG9PcENvZGVbSVIucmVhZCgpXSk7XHJcbiAgICAgICAgcHJpbnQoQUMsIFwiPT5cIiwgQUMucmVhZCgpKTtcclxuICAgICAgICBwcmludChgWj0ke0FMVS5afWApO1xyXG4gICAgICAgIHByaW50KE1EUiwgXCI9PlwiLCBNRFIucmVhZCgpKTtcclxuICAgICAgICBwcmludChNQVIpO1xyXG4gICAgICAgIHByaW50KGA9PSAke1BST0cuTkFNRX0gbWVtb3J5YClcclxuICAgICAgICBwcmludChQUk9HKTtcclxuICAgICAgICBwcmludChgPT0gJHtEQVRBLk5BTUV9IG1lbW9yeWApXHJcbiAgICAgICAgcHJpbnQoREFUQSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBTVEVQX0NPVU5UID0gcHJvZ3JhbS5sZW5ndGg7XHJcbiAgICBjb25zb2xlLmxvZyhcIj09IEluaXRpYWwgU3RhdGVcIik7XHJcbiAgICBwcmludENQVSgpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBTVEVQX0NPVU5UOyBpKyspIHtcclxuICAgICAgICBDUFUuc3RlcEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgcHJpbnRDUFUoKTtcclxuICAgIH1cclxufVxyXG5cclxubWFpbigpOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9tYWluLnRzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9