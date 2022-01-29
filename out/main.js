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
const PseudoCU_1 = __webpack_require__(/*! ../PseudoCU */ "./src/implementations/PseudoCPU/PseudoCU.ts");
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

/***/ "./src/implementations/PseudoCPU/PseudoCU.ts":
/*!***************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoCU.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PseudoCU = void 0;
const PseudoInstruction_1 = __webpack_require__(/*! ./PseudoInstruction */ "./src/implementations/PseudoCPU/PseudoInstruction.ts");
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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const PseudoCPUBasic_1 = __webpack_require__(/*! @/PseudoCPU/Basic/PseudoCPUBasic */ "./src/implementations/PseudoCPU/Basic/PseudoCPUBasic.ts");
const PseudoInstruction_1 = __webpack_require__(/*! @/PseudoCPU/PseudoInstruction */ "./src/implementations/PseudoCPU/PseudoInstruction.ts");
function main() {
    // Construct a ECE375 Pseudo CPU, factory new!
    const CPU = new PseudoCPUBasic_1.PseudoCPUBasic();
    // Create instruction bit representation based on CPU opcode and address size.
    const { LDA, STA, ADD, SHFT } = (0, PseudoInstruction_1.instructionBuilder)(CPU);
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
    ].map(instruction => instruction.VALUE);
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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVNLElBQUk7UUFDUCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDL0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sSUFBSTtRQUNQLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNoRCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QixJQUFJLENB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LENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM3QixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO1FBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNaLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDaEMsUUFBUSxFQUFFLENBQUM7SUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN0QixRQUFRLEVBQUUsQ0FBQztLQUNkO0FBQ0wsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9CaXQudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnkudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnlNYXAudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9SZWdpc3Rlci50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9CYXNpYy9Qc2V1ZG9DUFVCYXNpYy50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9BTFUudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvQ1UudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvSW5zdHJ1Y3Rpb24udHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB0eXBlIEJpdFZhbHVlID0gMCB8IDE7XHJcblxyXG5leHBvcnQgY2xhc3MgQml0IHtcclxuICAgIHByaXZhdGUgX3ZhbHVlOiBCaXRWYWx1ZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZT86IEJpdFZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZSA/PyAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQoKSB7XHJcbiAgICAgICAgdGhpcy5fdmFsdWUgPSAxO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLl92YWx1ZSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQml0RmllbGQge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2JpdHM6IEFycmF5PEJpdD47XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5TSVpFPSBzaXplO1xyXG4gICAgICAgIHRoaXMuX2JpdHMgPSBuZXcgQXJyYXk8Qml0PigpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2JpdHMucHVzaChuZXcgQml0KCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFZBTFVFKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JpdHMucmVkdWNlKChwcmV2LCBiaXQsIGluZGV4KSA9PiBwcmV2ICsgKGJpdC5yZWFkKCkgPDwgaW5kZXgpLCAwKTtcclxuICAgICAgICAvLyBsZXQgdG90YWwgPSAwO1xyXG4gICAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5TSVpFOyBpKyspIHtcclxuICAgICAgICAvLyAgICAgbGV0IGJpdF92YWx1ZSA9IHRoaXMuX2JpdHNbaV0ucmVhZCgpO1xyXG4gICAgICAgIC8vICAgICB0b3RhbCArPSBiaXRfdmFsdWUgPDwgaTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgLy8gcmV0dXJuIHRvdGFsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQoaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5TSVpFKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQml0RmllbGQuc2V0IG91dCBvZiBib3VuZHNcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fYml0c1tpbmRleF0uc2V0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyKGluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuU0laRSkge1xyXG4gICAgICAgICAgICB0aHJvdyBcIkJpdEZpZWxkLmNsZWFyIG91dCBvZiBib3VuZHNcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fYml0c1tpbmRleF0uY2xlYXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZChpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLlNJWkUpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJCaXRGaWVsZC5yZWFkIG91dCBvZiBib3VuZHNcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2JpdHNbaW5kZXhdLnJlYWQoKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IE1lbW9yeU1hcHBpbmcgfSBmcm9tIFwiLi9NZW1vcnlNYXBcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNZW1vcnkgaW1wbGVtZW50cyBNZW1vcnlNYXBwaW5nIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBOQU1FOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgU0laRTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZGF0YTogQXJyYXk8bnVtYmVyPjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gbmV3IEFycmF5PG51bWJlcj4odGhpcy5TSVpFKTtcclxuICAgICAgICB0aGlzLl9kYXRhLmZpbGwoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgZGF0YTogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYCR7dGhpcy5OQU1FfS53cml0ZSgke2FkZHJlc3N9LCAke2RhdGF9KWApO1xyXG4gICAgICAgIHRoaXMuX2RhdGFbYWRkcmVzc10gPSBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYCR7dGhpcy5OQU1FfS5yZWFkKCR7YWRkcmVzc30pYCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbYWRkcmVzc107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvU3RyaW5nKHdpdGhPZmZzZXQ/OiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgbGluZXMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU0laRTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBhZGRyZXNzID0gd2l0aE9mZnNldCA/IGkgKyB3aXRoT2Zmc2V0IDogaTtcclxuICAgICAgICAgICAgbGluZXMucHVzaChgMHgke2FkZHJlc3MudG9TdHJpbmcoMTYpfTogMHgke3RoaXMuX2RhdGFbaV0udG9TdHJpbmcoMTYpfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIkAvTWVtb3J5XCI7XHJcblxyXG5leHBvcnQgdHlwZSBNZW1vcnlNYXBwaW5nID0ge1xyXG4gICAgcmVhZDogKGFkZHJlc3M6IG51bWJlcikgPT4gbnVtYmVyLFxyXG4gICAgd3JpdGU6IChhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IHZvaWRcclxufVxyXG5cclxuZXhwb3J0IGVudW0gTWVtb3J5QWNjZXNzIHtcclxuICAgIFJFQUQsXHJcbiAgICBXUklURSxcclxuICAgIFJFQURfV1JJVEVcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1lbW9yeU1hcCB7XHJcbiAgICAvLyBBIG1hcCBmcm9tIGFkZHJlc3MgcmFuZ2UgW3N0YXJ0LCBlbmRdIHRvIGEgcmVhZC93cml0YWJsZSBtZW1vcnkgbG9jYXRpb24uXHJcbiAgICBwcml2YXRlIG1hcHBpbmdzOiBNYXA8W3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyXSwgTWVtb3J5TWFwcGluZz47XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncyA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzOiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgcmFuZ2VzID0gWy4uLnRoaXMubWFwcGluZ3Mua2V5cygpXTtcclxuICAgICAgICBsZXQga2V5ID0gcmFuZ2VzLmZpbmQocmFuZ2UgPT4gYWRkcmVzcyA+PSByYW5nZVswXSAmJiBhZGRyZXNzIDw9IHJhbmdlWzFdKTtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IGtleSA/IHRoaXMubWFwcGluZ3MuZ2V0KGtleSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgcmV0dXJuIG1hcHBpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIGxvYWQoKSBmcm9tIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSBtYXBwaW5nLnJlYWQoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUoYWRkcmVzczogbnVtYmVyLCBkYXRhOiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHN0b3JlKCkgdG8gdW5tYXBwZWQgbWVtb3J5XCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBtYXBwaW5nLndyaXRlKGFkZHJlc3MsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWFwTWVtb3J5UmFuZ2Uoc3RhcnQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIG1vZGU6IE1lbW9yeUFjY2VzcywgTU06IE1lbW9yeU1hcHBpbmcpIHtcclxuICAgICAgICBmdW5jdGlvbiByZWFkXyhhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLldSSVRFKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gcmVhZCgpIGZyb20gV1JJVEUtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBNTS5yZWFkKGFkZHJlc3MgLSBzdGFydCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZV8oYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2RlID09PSBNZW1vcnlBY2Nlc3MuUkVBRCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHdyaXRlKCkgdG8gUkVBRC1vbmx5IG1lbW9yeVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgTU0ud3JpdGUoYWRkcmVzcyAtIHN0YXJ0LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcmFuZ2U6IFtudW1iZXIsIG51bWJlcl0gPSBbc3RhcnQsIHN0YXJ0ICsgbGVuZ3RoIC0gMV07XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncy5zZXQocmFuZ2UsIHsgcmVhZDogcmVhZF8sIHdyaXRlOiB3cml0ZV8gfSlcclxuICAgIH1cclxufSIsImltcG9ydCB7IEJpdCwgQml0RmllbGQgfSBmcm9tIFwiQC9CaXRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZWdpc3RlciB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTkFNRTogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIC8vIHByaXZhdGUgX2RhdGE6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2JpdHM6IEJpdEZpZWxkO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5OQU1FID0gbmFtZTtcclxuICAgICAgICB0aGlzLlNJWkUgPSBzaXplO1xyXG4gICAgICAgIC8vIHRoaXMuX2RhdGEgPSAwO1xyXG4gICAgICAgIC8vIHRoaXMuX2RhdGEgPSBuZXcgQXJyYXk8Qml0PigpO1xyXG4gICAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuX2RhdGEucHVzaChuZXcgQml0KCkpO1xyXG4gICAgICAgIC8vIH1cclxuICAgICAgICB0aGlzLl9iaXRzID0gbmV3IEJpdEZpZWxkKHNpemUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgLy8gdGhpcy5fZGF0YSA9IHZhbHVlO1xyXG4gICAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5TSVpFOyBpKyspIHtcclxuICAgICAgICAvLyAgICAgbGV0IGJpdF92YWx1ZSA9ICh2YWx1ZSA+PiBpKSAmIDE7XHJcbiAgICAgICAgLy8gICAgIGlmIChiaXRfdmFsdWUgPT09IDEpIHtcclxuICAgICAgICAvLyAgICAgICAgIHRoaXMuX2RhdGFbaV0uc2V0KCk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyAgICAgZWxzZSB7XHJcbiAgICAgICAgLy8gICAgICAgICB0aGlzLl9kYXRhW2ldLmNsZWFyKCk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNJWkU7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgYml0X3ZhbHVlID0gKHZhbHVlID4+IGkpICYgMTtcclxuICAgICAgICAgICAgaWYgKGJpdF92YWx1ZSA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fYml0cy5zZXQoaSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9iaXRzLmNsZWFyKGkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkKCk6IG51bWJlciB7XHJcbiAgICAgICAgLy8gcmV0dXJuIHRoaXMuX2RhdGE7XHJcbiAgICAgICAgLy8gbGV0IHRvdGFsID0gMDtcclxuICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU0laRTsgaSsrKSB7XHJcbiAgICAgICAgLy8gICAgIGxldCBiaXRfdmFsdWUgPSB0aGlzLl9kYXRhW2ldLnJlYWQoKTtcclxuICAgICAgICAvLyAgICAgdG90YWwgKz0gYml0X3ZhbHVlIDw8IGk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vIHJldHVybiB0b3RhbDtcclxuICAgICAgICByZXR1cm4gdGhpcy5fYml0cy5WQUxVRTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgLy8gbGV0IGJpdF9zdHIgPSB0aGlzLl9iaXRzLm1hcChiaXQgPT4gYml0LnJlYWQoKSA9PT0gMSA/IFwiMVwiIDogXCIwXCIpLnJldmVyc2UoKS5qb2luKFwiXCIpO1xyXG4gICAgICAgIGxldCBoZXhfc3RyID0gXCIweFwiICsgdGhpcy5fYml0cy5WQUxVRS50b1N0cmluZygxNik7XHJcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuTkFNRX08JHtoZXhfc3RyfT5gO1xyXG4gICAgfVxyXG59IiwiLy8gPT0gUHNldWRvSVNBXHJcbi8vIC0tIERhdGEgVHJhbnNmZXIgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0xvYWQgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIExEQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIExvYWRzIGEgbWVtb3J5IHdvcmQgdG8gdGhlIEFDLlxyXG4vLyAgICAgIFtTdG9yZSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1RBIHg7IHggaXMgYSBtZW1vcnkgbG9jYXRpb25cclxuLy8gICAgICAgICAgU3RvcmVzIHRoZSBjb250ZW50IG9mIHRoZSBBQyB0byBtZW1vcnkuXHJcbi8vIC0tIEFyaXRobWV0aWMgYW5kIExvZ2ljYWwgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0FkZCB0byBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgQUREIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBBZGRzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWQgYnlcclxuLy8gICAgICAgICAgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIHRvIHRoZSBjb250ZW50IGluIHRoZSBBQy5cclxuLy8gICAgICBbU3VidHJhY3QgZnJvbSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1VCIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBTdWJ0cmFjdHMgdGhlIGNvbnRlbnQgb2YgdGhlIG1lbW9yeSB3b3JkIHNwZWNpZmllZFxyXG4vLyAgICAgICAgICBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgZnJvbSB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW0xvZ2ljYWwgTkFORCB3aXRoIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBOQU5EIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBQZXJmb3JtcyBsb2dpY2FsIE5BTkQgYmV0d2VlbiB0aGUgY29udGVudHMgb2YgdGhlIG1lbW9yeVxyXG4vLyAgICAgICAgICB3b3JkIHNwZWNpZmllZCBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgYW5kIHRoZSBBQy5cclxuLy8gICAgICBbU2hpZnRdXHJcbi8vICAgICAgICAgIFNIRlRcclxuLy8gICAgICAgICAgVGhlIGNvbnRlbnQgb2YgQUMgaXMgc2hpZnRlZCBsZWZ0IGJ5IG9uZSBiaXQuXHJcbi8vICAgICAgICAgIFRoZSBiaXQgc2hpZnRlZCBpbiBpcyAwLlxyXG4vLyAtLSBDb250cm9sIFRyYW5zZmVyXHJcbi8vICAgICAgW0p1bXBdXHJcbi8vICAgICAgICAgIEogeDsgSnVtcCB0byBpbnN0cnVjdGlvbiBpbiBtZW1vcnkgbG9jYXRpb24geC5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MuXHJcbi8vICAgICAgW0JORV1cclxuLy8gICAgICAgICAgQk5FIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHggaWYgY29udGVudCBvZiBBQyBpcyBub3QgemVyby5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MgaWYgWiAhPSAwLlxyXG4vLyBcclxuLy8gPT0gUHNldWRvQ1BVIE1pY3JvLW9wZXJhdGlvbnNcclxuLy8gLS0gU3RvcmUvTG9hZCBtZW1vcnlcclxuLy8gICAgICBNW01BUl0gPC0gTURSXHJcbi8vICAgICAgTURSIDwtIE1bTUFSXVxyXG4vLyAtLSBDb3B5IHJlZ2lzdGVyXHJcbi8vICAgICAgUmEgPC0gUmJcclxuLy8gLS0gUmVnaXN0ZXIgaW5jcmVtZW50L2RlY3JlbWVudFxyXG4vLyAgICAgIFJhIDwtIFJhICsgMVxyXG4vLyAgICAgIFJhIDwtIFJhIC0gMVxyXG4vLyAgICAgIFJhIDwtIFJhICsgUmJcclxuLy8gICAgICBSYSA8LSBSYSAtIFJiXHJcbi8vXHJcbi8vID09IE1pbmltYWwgQ29tcG9uZW50c1xyXG4vLyBbTWVtb3J5XVxyXG4vLyBBZGRyZXNzYWJsZSBieSBBZGRyZXNzIExpbmUgdmlhIE1bTUFSXVxyXG4vLyBXcml0YWJsZSBieSBBZGRyZXNzIExpbmUgJiBEYXRhIExpbmUgdmlhIE1bTUFSXSA8LSBNRFJcclxuLy8gUmVhZGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNRFIgPC0gTVtNQVJdXHJcbi8vIE5lZWQgdHdvIG1lbW9yaWVzOiBwcm9ncmFtIG1lbW9yeSAocmVhZCBvbmx5KSBhbmQgZGF0YSBtZW1vcnkgKHJlYWQgJiB3cml0ZSkuXHJcbi8vXHJcbi8vIFtBTFVdXHJcbi8vIFBlcmZvcm1zIGFyaXRobWV0aWMgb3BlcmF0aW9ucywgb2Z0ZW4gaW52b2x2aW5nIHRoZSBBQyByZWdpc3Rlci5cclxuLy8gQUMgPC0gQUMgKyAxXHJcbi8vIEFDIDwtIEFDICsgUkFcclxuLy8gQUMgPC0gQUMgLSAxXHJcbi8vIEFDIDwtIEFDIC0gUkFcclxuLy9cclxuLy8gW0NvbnRyb2wgVW5pdF1cclxuLy8gRXhlY3V0ZXMgaW5zdHJ1Y3Rpb25zIGFuZCBzZXF1ZW5jZXMgbWljcm9vcGVyYXRpb25zLlxyXG4vL1xyXG4vLyBbTURSIFJlZ2lzdGVyXVxyXG4vLyBUcmFuc2ZlciB0by9mcm9tIG1lbW9yeSB2aWEgRGF0YSBMaW5lLlxyXG4vL1xyXG4vLyBbTUFSIFJlZ2lzdGVyXVxyXG4vLyBBY2Nlc3MgbWVtb3J5IHZpYSBBZGRyZXNzIExpbmVcclxuLy9cclxuLy8gW1BDIFJlZ2lzdGVyXVxyXG4vLyBJbmNyZW1lbnQgdmlhIFBDIDwtIFBDICsgMVxyXG4vL1xyXG4vLyBbSVIgUmVnaXN0ZXJdXHJcbi8vIEhvbGRzIHRoZSBvcGNvZGUgb2YgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24uXHJcbi8vXHJcbi8vIFtBQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBBQyA8LSBBQyArIDEgb3IgQUMgPC0gQUMgKyBSYVxyXG4vLyBEZWNyZW1lbnQgdmlhIEFDIDwtIEFDIC0gMSBvciBBQyA8LSBBQyAtIFJhXHJcbi8vXHJcbi8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4vLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbi8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4vLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4vLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbmltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIkAvTWVtb3J5XCI7XHJcbmltcG9ydCB7IE1lbW9yeUFjY2VzcywgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuaW1wb3J0IHsgQ2VudHJhbFByb2Nlc3NpbmdVbml0IH0gZnJvbSBcIkAvQ2VudHJhbFByb2Nlc3NpbmdVbml0XCI7XHJcblxyXG5pbXBvcnQgeyBQc2V1ZG9DVSB9IGZyb20gXCIuLi9Qc2V1ZG9DVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9BTFUgfSBmcm9tIFwiLi4vUHNldWRvQUxVXCI7XHJcbmltcG9ydCB7IFBzZXVkb0NQVUFyY2hpdGVjdHVyZSB9IGZyb20gXCIuLi9Qc2V1ZG9DUFVBcmNoaXRlY3R1cmVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DUFVCYXNpYyBpbXBsZW1lbnRzIFBzZXVkb0NQVUFyY2hpdGVjdHVyZSwgQ2VudHJhbFByb2Nlc3NpbmdVbml0IHtcclxuICAgIHB1YmxpYyByZWFkb25seSBXT1JEX1NJWkUgPSAxNjsgLy8gd29yZCBzaXplIGluIGJpdHMuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQUREUkVTU19TSVpFID0gMTM7IC8vIGFkZHJlc3Mgc2l6ZSBpbiBiaXRzOyAyKioxMyA9IDB4MjAwMCA9IDgxOTIgYWRkcmVzc2FibGUgd29yZHMgbWVtb3J5LlxyXG4gICAgcHVibGljIHJlYWRvbmx5IE9QQ09ERV9TSVpFID0gMzsgLy8gb3Bjb2RlIHNpemUgaW4gYml0cywgMioqMyA9IDggdW5pcXVlIG9wY29kZXMuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPR1JBTV9NRU1PUllfU0laRSA9IDB4MDg7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIHByb2dyYW0gbWVtb3J5LlxyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEFfTUVNT1JZX1NJWkUgPSAweDA4OyAvLyBhZGRyZXNzYWJsZSB3b3JkcyBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPR1JBTV9NRU1PUllfQkVHSU4gPSAweDAwOyAvLyBhZGRyZXNzIG9mIGZpcnN0IHdvcmQgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgREFUQV9NRU1PUllfQkVHSU4gPSB0aGlzLlBST0dSQU1fTUVNT1JZX1NJWkU7IC8vIGFkZHJlc3Mgb2YgZmlyc3Qgd29yZCBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUEM6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IElSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBBQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTURSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNQVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFMVTogUHNldWRvQUxVO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0c6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBEQVRBOiBNZW1vcnk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTTogTWVtb3J5TWFwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IENVOiBDb250cm9sVW5pdDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLlBDID0gbmV3IFJlZ2lzdGVyKFwiUENcIiwgdGhpcy5BRERSRVNTX1NJWkUpXHJcbiAgICAgICAgdGhpcy5JUiA9IG5ldyBSZWdpc3RlcihcIklSXCIsIHRoaXMuT1BDT0RFX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuQUMgPSBuZXcgUmVnaXN0ZXIoXCJBQ1wiLCB0aGlzLldPUkRfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NRFIgPSBuZXcgUmVnaXN0ZXIoXCJNRFJcIiwgdGhpcy5XT1JEX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuTUFSID0gbmV3IFJlZ2lzdGVyKFwiTUFSXCIsIHRoaXMuQUREUkVTU19TSVpFKTtcclxuICAgICAgICB0aGlzLkFMVSA9IG5ldyBQc2V1ZG9BTFUodGhpcy5BQywgdGhpcy5NRFIsIHRoaXMuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLlBST0cgPSBuZXcgTWVtb3J5KFwiUFJPR1wiLCB0aGlzLlBST0dSQU1fTUVNT1JZX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuREFUQSA9IG5ldyBNZW1vcnkoXCJEQVRBXCIsIHRoaXMuREFUQV9NRU1PUllfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NID0gbmV3IE1lbW9yeU1hcCgpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBNZW1vcnlSYW5nZSh0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCB0aGlzLlBST0dSQU1fTUVNT1JZX1NJWkUsIE1lbW9yeUFjY2Vzcy5SRUFELCB0aGlzLlBST0cpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBNZW1vcnlSYW5nZSh0aGlzLkRBVEFfTUVNT1JZX0JFR0lOLCB0aGlzLkRBVEFfTUVNT1JZX1NJWkUsIE1lbW9yeUFjY2Vzcy5SRUFEX1dSSVRFLCB0aGlzLkRBVEEpO1xyXG4gICAgICAgIHRoaXMuQ1UgPSBuZXcgUHNldWRvQ1UodGhpcywgdGhpcy5JUiwgdGhpcy5QQywgdGhpcy5BQywgdGhpcy5NQVIsIHRoaXMuTURSLCB0aGlzLkFMVSwgdGhpcy5NKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RlcEluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuQ1UuZmV0Y2hBbmREZWNvZGVOZXh0SW5zdHJ1Y3Rpb24oKTtcclxuICAgICAgICB0aGlzLkNVLmV4ZWN1dGVJbnN0cnVjdGlvbigpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgd3JpdGVQcm9ncmFtKHN0YXJ0OiBudW1iZXIsIC4uLnByb2dyYW06IEFycmF5PG51bWJlcj4pIHtcclxuICAgICAgICBwcm9ncmFtLmZvckVhY2goKGluc3RydWN0aW9uLCBhZGRyZXNzKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuUFJPRy53cml0ZShzdGFydCArIGFkZHJlc3MgLSB0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBpbnN0cnVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlRGF0YShzdGFydDogbnVtYmVyLCAuLi5kYXRhOiBBcnJheTxudW1iZXI+KSB7XHJcbiAgICAgICAgZGF0YS5mb3JFYWNoKCh2YWx1ZSwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLkRBVEEud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5EQVRBX01FTU9SWV9CRUdJTiwgdmFsdWUpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0FMVSB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgV09SRF9TSVpFO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWM6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3o6IFJlZ2lzdGVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFjOiBSZWdpc3RlciwgbWRyOiBSZWdpc3Rlciwgd29yZFNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2FjID0gYWM7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuV09SRF9TSVpFID0gd29yZFNpemU7XHJcbiAgICAgICAgdGhpcy5feiA9IG5ldyBSZWdpc3RlcihcIlpcIiwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBaKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3oucmVhZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQgWih2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fei53cml0ZSh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgc3VtID0gKHRoaXMuX2FjLnJlYWQoKSArIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHN1bSk7XHJcbiAgICAgICAgdGhpcy5aID0gc3VtID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN1YigpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgZGlmZmVyZW5jZSA9ICh0aGlzLl9hYy5yZWFkKCkgLSB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShkaWZmZXJlbmNlKTtcclxuICAgICAgICB0aGlzLlogPSBkaWZmZXJlbmNlID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hbmQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IH4odGhpcy5fYWMucmVhZCgpICYgdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUocmVzdWx0KTtcclxuICAgICAgICB0aGlzLlogPSByZXN1bHQgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hmdCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gKHRoaXMuX2FjLnJlYWQoKSA8PCAxKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuWiA9IHJlc3VsdCA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtSZWdpc3Rlcn0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb09wQ29kZSB9IGZyb20gXCIuL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcbmltcG9ydCB7IFBzZXVkb0FMVSB9IGZyb20gXCIuL1BzZXVkb0FMVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUgfSBmcm9tIFwiLi9Qc2V1ZG9DUFVBcmNoaXRlY3R1cmVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DVSBpbXBsZW1lbnRzIENvbnRyb2xVbml0IHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FyY2hpdGVjdHVyZTogUHNldWRvQ1BVQXJjaGl0ZWN0dXJlO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfaXI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfcGM6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWM6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWFyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21kcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hbHU6IFBzZXVkb0FMVTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21lbW9yeTogTWVtb3J5TWFwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFyY2hpdGVjdHVyZTogUHNldWRvQ1BVQXJjaGl0ZWN0dXJlLCBpcjogUmVnaXN0ZXIsIHBjOiBSZWdpc3RlciwgYWM6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCBhbHU6IFBzZXVkb0FMVSwgbWVtb3J5OiBNZW1vcnlNYXApIHtcclxuICAgICAgICB0aGlzLl9hcmNoaXRlY3R1cmUgPSBhcmNoaXRlY3R1cmU7XHJcbiAgICAgICAgdGhpcy5faXIgPSBpcjtcclxuICAgICAgICB0aGlzLl9wYyA9IHBjO1xyXG4gICAgICAgIHRoaXMuX2FjID0gYWM7XHJcbiAgICAgICAgdGhpcy5fbWFyID0gbWFyO1xyXG4gICAgICAgIHRoaXMuX21kciA9IG1kcjtcclxuICAgICAgICB0aGlzLl9hbHUgPSBhbHU7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5ID0gbWVtb3J5O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFBlcmZvcm1zIGluc3RydWN0aW9uIGZldGNoIGFuZCBkZWNvZGUuXHJcbiAgICBwdWJsaWMgZmV0Y2hBbmREZWNvZGVOZXh0SW5zdHJ1Y3Rpb24oKSB7XHJcbiAgICAgICAgLy8gTUFSIDwtIFBDXHJcbiAgICAgICAgdGhpcy5fbWFyLndyaXRlKHRoaXMuX3BjLnJlYWQoKSk7XHJcbiAgICAgICAgLy8gUEMgPC0gUEMgKyAxXHJcbiAgICAgICAgdGhpcy5fcGMud3JpdGUodGhpcy5fcGMucmVhZCgpICsgMSk7XHJcblxyXG4gICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICB0aGlzLl9tZHIud3JpdGUodGhpcy5fbWVtb3J5LnJlYWQodGhpcy5fbWFyLnJlYWQoKSkpO1xyXG5cclxuICAgICAgICAvLyBJUiA8LSBNRFIob3Bjb2RlKVxyXG4gICAgICAgIGxldCBPUENPREVfU0hJRlQgPSB0aGlzLl9hcmNoaXRlY3R1cmUuV09SRF9TSVpFIC0gdGhpcy5fYXJjaGl0ZWN0dXJlLk9QQ09ERV9TSVpFO1xyXG4gICAgICAgIGxldCBvcGNvZGUgPSB0aGlzLl9tZHIucmVhZCgpID4+IE9QQ09ERV9TSElGVDtcclxuICAgICAgICB0aGlzLl9pci53cml0ZShvcGNvZGUpO1xyXG4gICAgICAgIC8vIE1BUiA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgdGhpcy5fYXJjaGl0ZWN0dXJlLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWRyLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUoYWRkcmVzcyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEV4ZWN1dGVzIHRoZSBjdXJyZW50IGluc3RydWN0aW9uIGxvYWRlZCBpbnRvIElSLlxyXG4gICAgcHVibGljIGV4ZWN1dGVJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbiAgICAgICAgLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4gICAgICAgIC8vIFNUQSB4OiBNRFIgPC0gQUMsIE1bTUFSXSA8LSBNRFJcclxuICAgICAgICAvLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuICAgICAgICAvLyBTVUIgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgLSBNRFJcclxuICAgICAgICAvLyBOQU5EIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIH4oQUMgJiBNRFIpXHJcbiAgICAgICAgLy8gU0hGVCB4OiBBQyA8LSBBQyA8PCAxXHJcbiAgICAgICAgLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAvLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbiAgICAgICAgY29uc3QgW0lSLCBQQywgQUMsIE1BUiwgTURSLCBBTFUsIE1dID0gW3RoaXMuX2lyLCB0aGlzLl9wYywgdGhpcy5fYWMsIHRoaXMuX21hciwgdGhpcy5fbWRyLCB0aGlzLl9hbHUsIHRoaXMuX21lbW9yeV07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNvcHkoZHN0OiBSZWdpc3Rlciwgc3JjOiBSZWdpc3Rlcikge1xyXG4gICAgICAgICAgICBkc3Qud3JpdGUoc3JjLnJlYWQoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgICAgICBNRFIud3JpdGUoTS5yZWFkKE1BUi5yZWFkKCkpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHN0b3JlKCkge1xyXG4gICAgICAgICAgICBNLndyaXRlKE1BUi5yZWFkKCksIE1EUi5yZWFkKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgb3Bjb2RlID0gSVIucmVhZCgpO1xyXG4gICAgICAgIHN3aXRjaCAob3Bjb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkxEQTogICAgICAvLyBMREEgeDpcclxuICAgICAgICAgICAgICAgIGxvYWQoKTsgICAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIGNvcHkoQUMsIE1EUik7ICAgICAgICAgIC8vIEFDIDwtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNUQTogICAgICAvLyBTVEEgeDpcclxuICAgICAgICAgICAgICAgIGNvcHkoTURSLCBBQyk7ICAgICAgICAgIC8vIE1EUiA8LSBBQ1xyXG4gICAgICAgICAgICAgICAgc3RvcmUoKTsgICAgICAgICAgICAgICAgLy8gTVtNQVJdIDwtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkFERDogICAgICAvLyBBREQgeDpcclxuICAgICAgICAgICAgICAgIGxvYWQoKTsgICAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5hZGQoKTsgICAgICAgICAgICAgIC8vIEFDIDwtIEFDICsgTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU1VCOiAgICAgIC8vIFNVQiB4OlxyXG4gICAgICAgICAgICAgICAgbG9hZCgpOyAgICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLnN1YigpOyAgICAgICAgICAgICAgLy8gQUMgPC0gQUMgLSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5OQU5EOiAgICAgLy8gTkFORCB4OlxyXG4gICAgICAgICAgICAgICAgbG9hZCgpOyAgICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLm5hbmQoKTsgICAgICAgICAgICAgLy8gQUMgPC0gfihBQyAmIE1EUilcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TSEZUOiAgICAgLy8gU0hGVDpcclxuICAgICAgICAgICAgICAgIEFMVS5zaGZ0KCk7ICAgICAgICAgICAgIC8vIEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5KOiAgICAgICAgLy8gSiB4OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUEMgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgdGhpcy5fYXJjaGl0ZWN0dXJlLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSBNRFIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgICAgICAgICAgUEMud3JpdGUoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuQk5FOiAgICAgIC8vIEJORSB4OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKFogIT0gMSkgdGhlbiBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGlmIChBTFUuWiAhPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IHRoaXMuX2FyY2hpdGVjdHVyZS5BRERSRVNTX1NJWkUpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE1EUi5yZWFkKCkgJiBBRERSRVNTX01BU0s7XHJcbiAgICAgICAgICAgICAgICAgICAgUEMud3JpdGUoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRocm93IGBVbmtub3duIG9wY29kZTogJHtvcGNvZGV9YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gU1VCIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDIC0gTURSXHJcbi8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuLy8gU0hGVCB4OiBBQyA8LSBBQyA8PCAxXHJcbi8vIEogeDogUEMgPC0gTURSKGFkZHJlc3MpXHJcbi8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuaW1wb3J0IHsgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUgfSBmcm9tIFwiLi9Qc2V1ZG9DUFVBcmNoaXRlY3R1cmVcIjtcclxuXHJcblxyXG5leHBvcnQgZW51bSBQc2V1ZG9PcENvZGUge1xyXG4gICAgTERBICA9IDBiMDAwLFxyXG4gICAgU1RBICA9IDBiMDAxLFxyXG4gICAgQUREICA9IDBiMDEwLFxyXG4gICAgU1VCICA9IDBiMDExLFxyXG4gICAgTkFORCA9IDBiMTAwLFxyXG4gICAgU0hGVCA9IDBiMTAxLFxyXG4gICAgSiAgICA9IDBiMTEwLFxyXG4gICAgQk5FICA9IDBiMTExXHJcbn1cclxuXHJcbi8vIEluc3RydWN0aW9uIG1lbW9yeSBmb3JtYXQ6XHJcbi8vICAgICAgW0luc3RydWN0aW9uOiBXT1JEX1NJWkVdID0gW29wY29kZTogT1BDT0RFX1NJWkVdIFtvcGVyYW5kOiBBRERSRVNTX1NJWkVdXHJcbi8vIE9wZXJhbmQgdXNhZ2UgaXMgZGVmaW5lZCBieSB0aGUgb3Bjb2RlLlxyXG4vLyBPcGVyYW5kIGFkZHJlc3MgaXMgbG9hZGVkIGludG8gTUFSIGFmdGVyIHRoZSBmZXRjaCBhbmQgZGVjb2RlIGN5Y2xlLlxyXG5leHBvcnQgY2xhc3MgUHNldWRvSW5zdHJ1Y3Rpb24gaW1wbGVtZW50cyBJbnN0cnVjdGlvbiB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3Bjb2RlOiBQc2V1ZG9PcENvZGU7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3BlcmFuZDogbnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFZBTFVFOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob2Zmc2V0OiBudW1iZXIsIG9wY29kZTogUHNldWRvT3BDb2RlLCBvcGVyYW5kOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLm9wY29kZSA9IG9wY29kZTtcclxuICAgICAgICB0aGlzLm9wZXJhbmQgPSBvcGVyYW5kO1xyXG4gICAgICAgIHRoaXMuVkFMVUUgPSAodGhpcy5vcGNvZGUgPDwgb2Zmc2V0KSArIHRoaXMub3BlcmFuZDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGluc3RydWN0aW9uQnVpbGRlciA9ICh7QUREUkVTU19TSVpFfTogUHNldWRvQ1BVQXJjaGl0ZWN0dXJlKSA9PiAoe1xyXG4gICAgTERBOiAgICAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuTERBLCBvcGVyYW5kKSxcclxuICAgIFNUQTogICAgKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKEFERFJFU1NfU0laRSwgUHNldWRvT3BDb2RlLlNUQSwgb3BlcmFuZCksXHJcbiAgICBBREQ6ICAgIChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihBRERSRVNTX1NJWkUsIFBzZXVkb09wQ29kZS5BREQsIG9wZXJhbmQpLFxyXG4gICAgU1VCOiAgICAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuU1VCLCBvcGVyYW5kKSxcclxuICAgIE5BTkQ6ICAgKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKEFERFJFU1NfU0laRSwgUHNldWRvT3BDb2RlLk5BTkQsIG9wZXJhbmQpLFxyXG4gICAgU0hGVDogICAoKSAgICAgICAgICAgICAgICA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuU0hGVCwgMCksXHJcbiAgICBKOiAgICAgIChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihBRERSRVNTX1NJWkUsIFBzZXVkb09wQ29kZS5KLCAgIG9wZXJhbmQpLFxyXG4gICAgQk5FOiAgICAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oQUREUkVTU19TSVpFLCBQc2V1ZG9PcENvZGUuQk5FLCBvcGVyYW5kKSxcclxufSk7XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJpbXBvcnQgeyBQc2V1ZG9DUFVCYXNpYyB9IGZyb20gXCJAL1BzZXVkb0NQVS9CYXNpYy9Qc2V1ZG9DUFVCYXNpY1wiO1xyXG5pbXBvcnQgeyBQc2V1ZG9PcENvZGUsIGluc3RydWN0aW9uQnVpbGRlciB9IGZyb20gXCJAL1BzZXVkb0NQVS9Qc2V1ZG9JbnN0cnVjdGlvblwiO1xyXG5cclxuZnVuY3Rpb24gbWFpbigpIHtcclxuICAgIC8vIENvbnN0cnVjdCBhIEVDRTM3NSBQc2V1ZG8gQ1BVLCBmYWN0b3J5IG5ldyFcclxuICAgIGNvbnN0IENQVSA9IG5ldyBQc2V1ZG9DUFVCYXNpYygpO1xyXG4gICAgLy8gQ3JlYXRlIGluc3RydWN0aW9uIGJpdCByZXByZXNlbnRhdGlvbiBiYXNlZCBvbiBDUFUgb3Bjb2RlIGFuZCBhZGRyZXNzIHNpemUuXHJcbiAgICBjb25zdCB7IExEQSwgU1RBLCBBREQsIFNIRlQgfSA9IGluc3RydWN0aW9uQnVpbGRlcihDUFUpO1xyXG5cclxuICAgIC8vIERlZmluZSBsYWJlbHMgaW4gREFUQSBtZW1vcnkuXHJcbiAgICBsZXQgQSA9IENQVS5EQVRBX01FTU9SWV9CRUdJTjtcclxuICAgIGxldCBCID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMTtcclxuICAgIGxldCBDID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMjtcclxuICAgIC8vIFByb2dyYW0sIGNvbXB1dGVzIEMgPSA0KkEgKyBCXHJcbiAgICBjb25zdCBwcm9ncmFtID0gW1xyXG4gICAgICAgIExEQShBKSxcclxuICAgICAgICBTSEZUKCksXHJcbiAgICAgICAgU0hGVCgpLFxyXG4gICAgICAgIEFERChCKSxcclxuICAgICAgICBTVEEoQylcclxuICAgIF0ubWFwKGluc3RydWN0aW9uID0+IGluc3RydWN0aW9uLlZBTFVFKTtcclxuICAgIC8vIFdyaXRlIHByb2dyYW0gdG8gbWVtb3J5LlxyXG4gICAgQ1BVLndyaXRlUHJvZ3JhbSgwLCAuLi5wcm9ncmFtKTtcclxuICAgIC8vIEluaXRpYWwgdmFsdWVzOiBBID0gMjAsIEIgPSAyMCwgQyA9IDAuXHJcbiAgICBDUFUud3JpdGVEYXRhKEEsIDIwKTtcclxuICAgIENQVS53cml0ZURhdGEoQiwgMjEpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHByaW50Q1BVKCkge1xyXG4gICAgICAgIGNvbnN0IHByaW50ID0gKC4uLmFyZ3M6IEFycmF5PHsgdG9TdHJpbmcoKTogc3RyaW5nIH0+KSA9PiBjb25zb2xlLmxvZyguLi5hcmdzLm1hcCh2YWx1ZSA9PiB2YWx1ZS50b1N0cmluZygpKSk7XHJcbiAgICAgICAgY29uc3QgeyBQQywgSVIsIEFDLCBNRFIsIE1BUiwgQUxVLCBQUk9HLCBEQVRBLCBNLCBDVSB9ID0gQ1BVO1xyXG4gICAgICAgIHByaW50KFBDKTtcclxuICAgICAgICBwcmludChJUiwgXCI9PlwiLCBQc2V1ZG9PcENvZGVbSVIucmVhZCgpXSk7XHJcbiAgICAgICAgcHJpbnQoQUMsIFwiPT5cIiwgQUMucmVhZCgpKTtcclxuICAgICAgICBwcmludChgWj0ke0FMVS5afWApO1xyXG4gICAgICAgIHByaW50KE1EUiwgXCI9PlwiLCBNRFIucmVhZCgpKTtcclxuICAgICAgICBwcmludChNQVIpO1xyXG4gICAgICAgIHByaW50KGA9PSAke1BST0cuTkFNRX0gbWVtb3J5YClcclxuICAgICAgICBwcmludChQUk9HKTtcclxuICAgICAgICBwcmludChgPT0gJHtEQVRBLk5BTUV9IG1lbW9yeWApXHJcbiAgICAgICAgcHJpbnQoREFUQSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBTVEVQX0NPVU5UID0gcHJvZ3JhbS5sZW5ndGg7XHJcbiAgICBjb25zb2xlLmxvZyhcIj09IEluaXRpYWwgU3RhdGVcIik7XHJcbiAgICBwcmludENQVSgpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBTVEVQX0NPVU5UOyBpKyspIHtcclxuICAgICAgICBDUFUuc3RlcEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgcHJpbnRDUFUoKTtcclxuICAgIH1cclxufVxyXG5cclxubWFpbigpOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==