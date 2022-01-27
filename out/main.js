/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
        this._dataLine = 0;
        this._addressLine = 0;
        this._enable = false;
    }
    clock() {
        if (this._enable) {
            this._data[this._addressLine] = this._dataLine;
        }
    }
    readData() {
        return this._dataLine;
    }
    writeAddress(address) {
        this._addressLine = address;
    }
    writeData(data) {
        this._dataLine = data;
    }
    setEnable() {
        this._enable = true;
    }
    clearEnable() {
        this._enable = false;
    }
    write(address, data) {
        this._data[address] = data;
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
    constructor(mdr, mar) {
        this._mdr = mdr;
        this._mar = mar;
        this.mappings = new Map();
    }
    clock() {
        this.mappings.forEach(entry => {
            entry === null || entry === void 0 ? void 0 : entry.clock();
        });
    }
    findAddressMapping(address) {
        let ranges = [...this.mappings.keys()];
        let key = ranges.find(range => address >= range[0] && address <= range[1]);
        let mapping = key ? this.mappings.get(key) : undefined;
        return mapping;
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
        let { clock, setEnable, clearEnable } = M;
        this.mappings.set(range, { read, write, clock, setEnable, clearEnable });
    }
    mapRegister(a, R) {
        function read(address) {
            return R.read();
        }
        function write(address, value) {
            R.write(value);
        }
        let range = [a, a];
        let [clock, setEnable, clearEnable] = [() => R.clock(), () => { }, () => { }];
        this.mappings.set(range, { read, write, clock, setEnable, clearEnable });
    }
}
exports.MemoryMap = MemoryMap;


/***/ }),

/***/ "./src/architecture/Register.ts":
/*!**************************************!*\
  !*** ./src/architecture/Register.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Register = void 0;
class Register {
    constructor(name, size) {
        this.NAME = name;
        this.SIZE = size;
        this._data = 0;
        this._dataLine = 0;
        this._enable = false;
    }
    clearEnable() {
        this._enable = false;
    }
    setEnable() {
        this._enable = true;
    }
    clock() {
        if (this._enable) {
            this._data = this._dataLine;
        }
    }
    writeData(data) {
        this._dataLine = data;
    }
    write(value) {
        this._data = value;
    }
    read() {
        return this._data;
    }
    toString() {
        return `${this.NAME}<0x${this._data.toString(16)}>`;
    }
}
exports.Register = Register;


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

/***/ "./src/implementations/PseudoCPU/PseudoCPU.ts":
/*!****************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoCPU.ts ***!
  \****************************************************/
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
exports.PseudoCPU = void 0;
const Register_1 = __webpack_require__(/*! @/Register */ "./src/architecture/Register.ts");
const Memory_1 = __webpack_require__(/*! @/Memory */ "./src/architecture/Memory.ts");
const MemoryMap_1 = __webpack_require__(/*! @/MemoryMap */ "./src/architecture/MemoryMap.ts");
const PseudoCU_1 = __webpack_require__(/*! ./PseudoCU */ "./src/implementations/PseudoCPU/PseudoCU.ts");
const PseudoALU_1 = __webpack_require__(/*! ./PseudoALU */ "./src/implementations/PseudoCPU/PseudoALU.ts");
class PseudoCPU {
    constructor() {
        this.PROGRAM_MEMORY_BEGIN = 0x00; // address of first word of program memory.
        this.DATA_MEMORY_BEGIN = PseudoCPU.PROGRAM_MEMORY_SIZE; // address of first word of data memory.
        this.PC = new Register_1.Register("PC", PseudoCPU.ADDRESS_SIZE);
        this.IR = new Register_1.Register("IR", PseudoCPU.OPCODE_SIZE);
        this.AC = new Register_1.Register("AC", PseudoCPU.WORD_SIZE);
        this.MDR = new Register_1.Register("MDR", PseudoCPU.WORD_SIZE);
        this.MAR = new Register_1.Register("MAR", PseudoCPU.ADDRESS_SIZE);
        this.ALU = new PseudoALU_1.PseudoALU(this.AC, this.MDR, PseudoCPU.WORD_SIZE);
        this.PROG = new Memory_1.Memory("PROG", PseudoCPU.PROGRAM_MEMORY_SIZE);
        this.DATA = new Memory_1.Memory("DATA", PseudoCPU.DATA_MEMORY_SIZE);
        this.M = new MemoryMap_1.MemoryMap(this.MDR, this.MAR);
        this.M.mapExternalMemory(this.PROGRAM_MEMORY_BEGIN, PseudoCPU.PROGRAM_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ, this.PROG);
        this.M.mapExternalMemory(this.DATA_MEMORY_BEGIN, PseudoCPU.DATA_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ_WRITE, this.DATA);
        this.CU = new PseudoCU_1.PseudoCU(this.IR, this.PC, this.AC, this.MAR, this.MDR, this.ALU, this.M);
    }
    stepClock() {
        this.CU.clock();
    }
    stepInstruction() {
        this.CU.clock();
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
exports.PseudoCPU = PseudoCPU;
PseudoCPU.WORD_SIZE = 16; // word size in bits.
PseudoCPU.ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
PseudoCPU.OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
PseudoCPU.PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
PseudoCPU.DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.


/***/ }),

/***/ "./src/implementations/PseudoCPU/PseudoCU.ts":
/*!***************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoCU.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PseudoCU = void 0;
const PseudoCPU_1 = __webpack_require__(/*! ./PseudoCPU */ "./src/implementations/PseudoCPU/PseudoCPU.ts");
const PseudoInstruction_1 = __webpack_require__(/*! ./PseudoInstruction */ "./src/implementations/PseudoCPU/PseudoInstruction.ts");
class PseudoCU {
    constructor(ir, pc, ac, mar, mdr, alu, memory) {
        this._ir = ir;
        this._pc = pc;
        this._ac = ac;
        this._mar = mar;
        this._mdr = mdr;
        this._alu = alu;
        this._memory = memory;
    }
    clock() {
        this.fetchAndDecodeNextInstruction();
        this.executeInstruction();
        // Clock all connected components
        // after instruction execution.
        this._ir.clock();
        this._pc.clock();
        this._ac.clock();
        this._mar.clock();
        this._mdr.clock();
        // this._alu.clock();
        this._memory.clock();
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
        let OPCODE_SHIFT = PseudoCPU_1.PseudoCPU.WORD_SIZE - PseudoCPU_1.PseudoCPU.OPCODE_SIZE;
        let opcode = this._mdr.read() >> OPCODE_SHIFT;
        this._ir.write(opcode);
        // MAR <- MDR(address)
        let ADDRESS_MASK = (1 << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) - 1;
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
        const copy = (dst, src) => dst.write(src.read());
        let opcode = IR.read();
        switch (opcode) {
            case PseudoInstruction_1.PseudoOpCode.LDA: // LDA x:
                M.load(); // MDR <- M[MAR]
                copy(AC, MDR); // AC <- MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.STA: // STA x:
                copy(MDR, AC); // MDR <- AC
                M.store(); // M[MAR] <- MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.ADD: // ADD x:
                M.load(); // MDR <- M[MAR]
                ALU.add(); // AC <- AC + MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.SUB: // SUB x:
                M.load(); // MDR <- M[MAR]
                ALU.sub(); // AC <- AC - MDR
                break;
            case PseudoInstruction_1.PseudoOpCode.NAND: // NAND x:
                M.load(); // MDR <- M[MAR]
                ALU.nand(); // AC <- ~(AC & MDR)
                break;
            case PseudoInstruction_1.PseudoOpCode.SHFT: // SHFT:
                ALU.shft(); // AC <- AC << 1
                break;
            case PseudoInstruction_1.PseudoOpCode.J: // J x:
                // PC <- MDR(address)
                let ADDRESS_MASK = (1 << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) - 1;
                let address = MDR.read() & ADDRESS_MASK;
                PC.write(address);
                break;
            case PseudoInstruction_1.PseudoOpCode.BNE: // BNE x:
                // if (Z != 1) then PC <- MDR(address)
                if (ALU.Z != 1) {
                    let ADDRESS_MASK = (1 << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) - 1;
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
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
exports.BNE = exports.J = exports.SHFT = exports.NAND = exports.SUB = exports.ADD = exports.STA = exports.LDA = exports.PseudoInstruction = exports.PseudoOpCode = void 0;
const PseudoCPU_1 = __webpack_require__(/*! ./PseudoCPU */ "./src/implementations/PseudoCPU/PseudoCPU.ts");
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
    constructor(opcode, operand) {
        this.opcode = opcode;
        this.operand = operand;
        this.VALUE = (this.opcode << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) + this.operand;
    }
}
exports.PseudoInstruction = PseudoInstruction;
const LDA = (operand) => new PseudoInstruction(PseudoOpCode.LDA, operand);
exports.LDA = LDA;
const STA = (operand) => new PseudoInstruction(PseudoOpCode.STA, operand);
exports.STA = STA;
const ADD = (operand) => new PseudoInstruction(PseudoOpCode.ADD, operand);
exports.ADD = ADD;
const SUB = (operand) => new PseudoInstruction(PseudoOpCode.SUB, operand);
exports.SUB = SUB;
const NAND = (operand) => new PseudoInstruction(PseudoOpCode.NAND, operand);
exports.NAND = NAND;
const SHFT = () => new PseudoInstruction(PseudoOpCode.SHFT, 0);
exports.SHFT = SHFT;
const J = (operand) => new PseudoInstruction(PseudoOpCode.J, operand);
exports.J = J;
const BNE = (operand) => new PseudoInstruction(PseudoOpCode.BNE, operand);
exports.BNE = BNE;


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
const PseudoCPU_1 = __webpack_require__(/*! @/PseudoCPU/PseudoCPU */ "./src/implementations/PseudoCPU/PseudoCPU.ts");
const PseudoInstruction_1 = __webpack_require__(/*! @/PseudoCPU/PseudoInstruction */ "./src/implementations/PseudoCPU/PseudoInstruction.ts");
function main() {
    // Construct a ECE375 Pseudo CPU, factory new!
    const CPU = new PseudoCPU_1.PseudoCPU();
    // Define labels in DATA memory.
    let A = CPU.DATA_MEMORY_BEGIN;
    let B = CPU.DATA_MEMORY_BEGIN + 1;
    let C = CPU.DATA_MEMORY_BEGIN + 2;
    // Program, computes C = 4*A + B
    const program = [
        (0, PseudoInstruction_1.LDA)(A),
        (0, PseudoInstruction_1.SHFT)(),
        (0, PseudoInstruction_1.SHFT)(),
        (0, PseudoInstruction_1.ADD)(B),
        (0, PseudoInstruction_1.STA)(C)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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SUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRU0sR0FBRztRQUNOLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDbEUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLENBQUMsR0FBRyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sSUFBSTtRQUNQLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUMvRCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxJQUFJO1FBQ1AsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMs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QUcsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNoQyxRQUFRLEVBQUUsQ0FBQztJQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDakMsR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3RCLFFBQVEsRUFBRSxDQUFDO0tBQ2Q7QUFDTCxDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL01lbW9yeS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL01lbW9yeU1hcC50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL1JlZ2lzdGVyLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0FMVS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9DUFUudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvQ1UudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvSW5zdHJ1Y3Rpb24udHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBNZW1vcnkge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE5BTUU6IHN0cmluZztcclxuICAgIHB1YmxpYyByZWFkb25seSBTSVpFOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kYXRhOiBBcnJheTxudW1iZXI+O1xyXG4gICAgcHJpdmF0ZSBfZGF0YUxpbmU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2FkZHJlc3NMaW5lOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9lbmFibGU6IGJvb2xlYW47XHJcblxyXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzaXplOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLk5BTUUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuU0laRSA9IHNpemU7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG5ldyBBcnJheTxudW1iZXI+KHRoaXMuU0laRSk7XHJcbiAgICAgICAgdGhpcy5fZGF0YS5maWxsKDApO1xyXG4gICAgICAgIHRoaXMuX2RhdGFMaW5lID0gMDtcclxuICAgICAgICB0aGlzLl9hZGRyZXNzTGluZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fZW5hYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsb2NrKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9lbmFibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZGF0YVt0aGlzLl9hZGRyZXNzTGluZV0gPSB0aGlzLl9kYXRhTGluZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWREYXRhKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFMaW5lO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZUFkZHJlc3MoYWRkcmVzczogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fYWRkcmVzc0xpbmUgPSBhZGRyZXNzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZURhdGEoZGF0YTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YUxpbmUgPSBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRFbmFibGUoKSB7XHJcbiAgICAgICAgdGhpcy5fZW5hYmxlID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXJFbmFibGUoKSB7XHJcbiAgICAgICAgdGhpcy5fZW5hYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgZGF0YTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YVthZGRyZXNzXSA9IGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVthZGRyZXNzXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcod2l0aE9mZnNldD86IG51bWJlcikge1xyXG4gICAgICAgIGxldCBsaW5lcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5TSVpFOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSB3aXRoT2Zmc2V0ID8gaSArIHdpdGhPZmZzZXQgOiBpO1xyXG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAweCR7YWRkcmVzcy50b1N0cmluZygxNil9OiAweCR7dGhpcy5fZGF0YVtpXS50b1N0cmluZygxNil9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUmVnaXN0ZXIgfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnkgfSBmcm9tIFwiQC9NZW1vcnlcIjtcclxuXHJcbmV4cG9ydCB0eXBlIE1lbW9yeU1hcHBpbmcgPSB7XHJcbiAgICByZWFkOiAoYWRkcmVzczogbnVtYmVyKSA9PiBudW1iZXIsXHJcbiAgICB3cml0ZTogKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikgPT4gdm9pZFxyXG59XHJcblxyXG5leHBvcnQgZW51bSBNZW1vcnlBY2Nlc3Mge1xyXG4gICAgUkVBRCxcclxuICAgIFdSSVRFLFxyXG4gICAgUkVBRF9XUklURVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWVtb3J5TWFwIHtcclxuICAgIC8vIEEgbWFwIGZyb20gYWRkcmVzcyByYW5nZSBbc3RhcnQsIGVuZF0gdG8gYSByZWFkL3dyaXRhYmxlIG1lbW9yeSBsb2NhdGlvbi5cclxuICAgIHByaXZhdGUgbWFwcGluZ3M6IE1hcDxbc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXJdLCBNZW1vcnlNYXBwaW5nICYgeyBzZXRFbmFibGUoKTogdm9pZCwgY2xlYXJFbmFibGUoKTogdm9pZCwgY2xvY2s6ICgpID0+IHZvaWQgfT47XHJcbiAgICBwcml2YXRlIF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSBfbWFyOiBSZWdpc3RlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtZHI6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyKSB7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX21hciA9IG1hcjtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbG9jaygpIHtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzLmZvckVhY2goZW50cnkgPT4ge1xyXG4gICAgICAgICAgICBlbnRyeT8uY2xvY2soKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3M6IG51bWJlcikge1xyXG4gICAgICAgIGxldCByYW5nZXMgPSBbLi4udGhpcy5tYXBwaW5ncy5rZXlzKCldO1xyXG4gICAgICAgIGxldCBrZXkgPSByYW5nZXMuZmluZChyYW5nZSA9PiBhZGRyZXNzID49IHJhbmdlWzBdICYmIGFkZHJlc3MgPD0gcmFuZ2VbMV0pO1xyXG4gICAgICAgIGxldCBtYXBwaW5nID0ga2V5ID8gdGhpcy5tYXBwaW5ncy5nZXQoa2V5KSA6IHVuZGVmaW5lZDtcclxuICAgICAgICByZXR1cm4gbWFwcGluZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbG9hZCgpIHtcclxuICAgICAgICBsZXQgYWRkcmVzcyA9IHRoaXMuX21hci5yZWFkKCk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBsb2FkKCkgZnJvbSB1bm1hcHBlZCBtZW1vcnlcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gbWFwcGluZy5yZWFkKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICB0aGlzLl9tZHIud3JpdGUoZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdG9yZSgpIHtcclxuICAgICAgICBsZXQgYWRkcmVzcyA9IHRoaXMuX21hci5yZWFkKCk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBzdG9yZSgpIHRvIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSB0aGlzLl9tZHIucmVhZCgpO1xyXG4gICAgICAgICAgICBtYXBwaW5nLndyaXRlKGFkZHJlc3MsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWFwRXh0ZXJuYWxNZW1vcnkoc3RhcnQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIG1vZGU6IE1lbW9yeUFjY2VzcywgTTogTWVtb3J5KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLldSSVRFKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gcmVhZCgpIGZyb20gV1JJVEUtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBNLnJlYWQoYWRkcmVzcyAtIHN0YXJ0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLlJFQUQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byB3cml0ZSgpIHRvIFJFQUQtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE0ud3JpdGUoYWRkcmVzcyAtIHN0YXJ0LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCByYW5nZTogW251bWJlciwgbnVtYmVyXSA9IFtzdGFydCwgc3RhcnQgKyBsZW5ndGggLSAxXTtcclxuICAgICAgICBsZXQgeyBjbG9jaywgc2V0RW5hYmxlLCBjbGVhckVuYWJsZSB9ID0gTTtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzLnNldChyYW5nZSwgeyByZWFkLCB3cml0ZSwgY2xvY2ssIHNldEVuYWJsZSwgY2xlYXJFbmFibGUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hcFJlZ2lzdGVyKGE6IG51bWJlciwgUjogUmVnaXN0ZXIpIHtcclxuICAgICAgICBmdW5jdGlvbiByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiBSLnJlYWQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgICAgICBSLndyaXRlKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdID0gW2EsIGFdO1xyXG4gICAgICAgIGxldCBbIGNsb2NrLCBzZXRFbmFibGUsIGNsZWFyRW5hYmxlIF0gPSBbICgpID0+IFIuY2xvY2soKSwgKCkgPT4ge30sICgpID0+IHt9IF07XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncy5zZXQocmFuZ2UsIHtyZWFkLCB3cml0ZSwgY2xvY2ssIHNldEVuYWJsZSwgY2xlYXJFbmFibGUgfSk7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY2xhc3MgUmVnaXN0ZXIge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE5BTUU6IHN0cmluZztcclxuICAgIHB1YmxpYyByZWFkb25seSBTSVpFOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kYXRhOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kYXRhTGluZTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZW5hYmxlOiBib29sZWFuO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5OQU1FID0gbmFtZTtcclxuICAgICAgICB0aGlzLlNJWkUgPSBzaXplO1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSAwO1xyXG4gICAgICAgIHRoaXMuX2RhdGFMaW5lID0gMDtcclxuICAgICAgICB0aGlzLl9lbmFibGUgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXJFbmFibGUoKSB7XHJcbiAgICAgICAgdGhpcy5fZW5hYmxlID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldEVuYWJsZSgpIHtcclxuICAgICAgICB0aGlzLl9lbmFibGUgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbG9jaygpIHtcclxuICAgICAgICBpZiAodGhpcy5fZW5hYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgPSB0aGlzLl9kYXRhTGluZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlRGF0YShkYXRhOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9kYXRhTGluZSA9IGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9kYXRhID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuTkFNRX08MHgke3RoaXMuX2RhdGEudG9TdHJpbmcoMTYpfT5gO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtSZWdpc3Rlcn0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9BTFUge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFdPUkRfU0laRTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21kcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF96OiBSZWdpc3RlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhYzogUmVnaXN0ZXIsIG1kcjogUmVnaXN0ZXIsIHdvcmRTaXplOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9hYyA9IGFjO1xyXG4gICAgICAgIHRoaXMuX21kciA9IG1kcjtcclxuICAgICAgICB0aGlzLldPUkRfU0laRSA9IHdvcmRTaXplO1xyXG4gICAgICAgIHRoaXMuX3ogPSBuZXcgUmVnaXN0ZXIoXCJaXCIsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgWigpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl96LnJlYWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IFoodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX3oud3JpdGUodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHN1bSA9ICh0aGlzLl9hYy5yZWFkKCkgKyB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShzdW0pO1xyXG4gICAgICAgIHRoaXMuWiA9IHN1bSA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdWIoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IGRpZmZlcmVuY2UgPSAodGhpcy5fYWMucmVhZCgpIC0gdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUoZGlmZmVyZW5jZSk7XHJcbiAgICAgICAgdGhpcy5aID0gZGlmZmVyZW5jZSA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYW5kKCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB+KHRoaXMuX2FjLnJlYWQoKSAmIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5aID0gcmVzdWx0ID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNoZnQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9ICh0aGlzLl9hYy5yZWFkKCkgPDwgMSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUocmVzdWx0KTtcclxuICAgICAgICB0aGlzLlogPSByZXN1bHQgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxufSIsIi8vID09IFBzZXVkb0lTQVxyXG4vLyAtLSBEYXRhIFRyYW5zZmVyIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtMb2FkIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBMREEgeDsgeCBpcyBhIG1lbW9yeSBsb2NhdGlvblxyXG4vLyAgICAgICAgICBMb2FkcyBhIG1lbW9yeSB3b3JkIHRvIHRoZSBBQy5cclxuLy8gICAgICBbU3RvcmUgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNUQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIFN0b3JlcyB0aGUgY29udGVudCBvZiB0aGUgQUMgdG8gbWVtb3J5LlxyXG4vLyAtLSBBcml0aG1ldGljIGFuZCBMb2dpY2FsIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtBZGQgdG8gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIEFERCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgQWRkcyB0aGUgY29udGVudCBvZiB0aGUgbWVtb3J5IHdvcmQgc3BlY2lmaWVkIGJ5XHJcbi8vICAgICAgICAgIHRoZSBlZmZlY3RpdmUgYWRkcmVzcyB0byB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW1N1YnRyYWN0IGZyb20gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNVQiB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgU3VidHJhY3RzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWRcclxuLy8gICAgICAgICAgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGZyb20gdGhlIGNvbnRlbnQgaW4gdGhlIEFDLlxyXG4vLyAgICAgIFtMb2dpY2FsIE5BTkQgd2l0aCBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgTkFORCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgUGVyZm9ybXMgbG9naWNhbCBOQU5EIGJldHdlZW4gdGhlIGNvbnRlbnRzIG9mIHRoZSBtZW1vcnlcclxuLy8gICAgICAgICAgd29yZCBzcGVjaWZpZWQgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGFuZCB0aGUgQUMuXHJcbi8vICAgICAgW1NoaWZ0XVxyXG4vLyAgICAgICAgICBTSEZUXHJcbi8vICAgICAgICAgIFRoZSBjb250ZW50IG9mIEFDIGlzIHNoaWZ0ZWQgbGVmdCBieSBvbmUgYml0LlxyXG4vLyAgICAgICAgICBUaGUgYml0IHNoaWZ0ZWQgaW4gaXMgMC5cclxuLy8gLS0gQ29udHJvbCBUcmFuc2ZlclxyXG4vLyAgICAgIFtKdW1wXVxyXG4vLyAgICAgICAgICBKIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHguXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzLlxyXG4vLyAgICAgIFtCTkVdXHJcbi8vICAgICAgICAgIEJORSB4OyBKdW1wIHRvIGluc3RydWN0aW9uIGluIG1lbW9yeSBsb2NhdGlvbiB4IGlmIGNvbnRlbnQgb2YgQUMgaXMgbm90IHplcm8uXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzIGlmIFogIT0gMC5cclxuLy8gXHJcbi8vID09IFBzZXVkb0NQVSBNaWNyby1vcGVyYXRpb25zXHJcbi8vIC0tIFN0b3JlL0xvYWQgbWVtb3J5XHJcbi8vICAgICAgTVtNQVJdIDwtIE1EUlxyXG4vLyAgICAgIE1EUiA8LSBNW01BUl1cclxuLy8gLS0gQ29weSByZWdpc3RlclxyXG4vLyAgICAgIFJhIDwtIFJiXHJcbi8vIC0tIFJlZ2lzdGVyIGluY3JlbWVudC9kZWNyZW1lbnRcclxuLy8gICAgICBSYSA8LSBSYSArIDFcclxuLy8gICAgICBSYSA8LSBSYSAtIDFcclxuLy8gICAgICBSYSA8LSBSYSArIFJiXHJcbi8vICAgICAgUmEgPC0gUmEgLSBSYlxyXG4vL1xyXG4vLyA9PSBNaW5pbWFsIENvbXBvbmVudHNcclxuLy8gW01lbW9yeV1cclxuLy8gQWRkcmVzc2FibGUgYnkgQWRkcmVzcyBMaW5lIHZpYSBNW01BUl1cclxuLy8gV3JpdGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNW01BUl0gPC0gTURSXHJcbi8vIFJlYWRhYmxlIGJ5IEFkZHJlc3MgTGluZSAmIERhdGEgTGluZSB2aWEgTURSIDwtIE1bTUFSXVxyXG4vLyBOZWVkIHR3byBtZW1vcmllczogcHJvZ3JhbSBtZW1vcnkgKHJlYWQgb25seSkgYW5kIGRhdGEgbWVtb3J5IChyZWFkICYgd3JpdGUpLlxyXG4vL1xyXG4vLyBbQUxVXVxyXG4vLyBQZXJmb3JtcyBhcml0aG1ldGljIG9wZXJhdGlvbnMsIG9mdGVuIGludm9sdmluZyB0aGUgQUMgcmVnaXN0ZXIuXHJcbi8vIEFDIDwtIEFDICsgMVxyXG4vLyBBQyA8LSBBQyArIFJBXHJcbi8vIEFDIDwtIEFDIC0gMVxyXG4vLyBBQyA8LSBBQyAtIFJBXHJcbi8vXHJcbi8vIFtDb250cm9sIFVuaXRdXHJcbi8vIEV4ZWN1dGVzIGluc3RydWN0aW9ucyBhbmQgc2VxdWVuY2VzIG1pY3Jvb3BlcmF0aW9ucy5cclxuLy9cclxuLy8gW01EUiBSZWdpc3Rlcl1cclxuLy8gVHJhbnNmZXIgdG8vZnJvbSBtZW1vcnkgdmlhIERhdGEgTGluZS5cclxuLy9cclxuLy8gW01BUiBSZWdpc3Rlcl1cclxuLy8gQWNjZXNzIG1lbW9yeSB2aWEgQWRkcmVzcyBMaW5lXHJcbi8vXHJcbi8vIFtQQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBQQyA8LSBQQyArIDFcclxuLy9cclxuLy8gW0lSIFJlZ2lzdGVyXVxyXG4vLyBIb2xkcyB0aGUgb3Bjb2RlIG9mIHRoZSBjdXJyZW50IGluc3RydWN0aW9uLlxyXG4vL1xyXG4vLyBbQUMgUmVnaXN0ZXJdXHJcbi8vIEluY3JlbWVudCB2aWEgQUMgPC0gQUMgKyAxIG9yIEFDIDwtIEFDICsgUmFcclxuLy8gRGVjcmVtZW50IHZpYSBBQyA8LSBBQyAtIDEgb3IgQUMgPC0gQUMgLSBSYVxyXG4vL1xyXG4vLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG5pbXBvcnQgeyBSZWdpc3RlciB9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IE1lbW9yeSB9IGZyb20gXCJAL01lbW9yeVwiO1xyXG5pbXBvcnQgeyBNZW1vcnlBY2Nlc3MsIE1lbW9yeU1hcCB9IGZyb20gXCJAL01lbW9yeU1hcFwiO1xyXG5pbXBvcnQgeyBDb250cm9sVW5pdCB9IGZyb20gXCJAL0NvbnRyb2xVbml0XCI7XHJcbmltcG9ydCB7IEluc3RydWN0aW9uIH0gZnJvbSBcIkAvSW5zdHJ1Y3Rpb25cIjtcclxuaW1wb3J0IHsgQ2VudHJhbFByb2Nlc3NpbmdVbml0IH0gZnJvbSBcIkAvQ2VudHJhbFByb2Nlc3NpbmdVbml0XCI7XHJcblxyXG5pbXBvcnQgeyBQc2V1ZG9DVSB9IGZyb20gXCIuL1BzZXVkb0NVXCI7XHJcbmltcG9ydCB7IFBzZXVkb0FMVSB9IGZyb20gXCIuL1BzZXVkb0FMVVwiO1xyXG5cclxuZXhwb3J0IHR5cGUgUHNldWRvQ1BVQXJjaGl0ZWN0dXJlID0ge1xyXG4gICAgUEM6IFJlZ2lzdGVyLFxyXG4gICAgSVI6IFJlZ2lzdGVyLFxyXG4gICAgQUM6IFJlZ2lzdGVyLFxyXG4gICAgTURSOiBSZWdpc3RlcixcclxuICAgIE1BUjogUmVnaXN0ZXIsXHJcbiAgICBBTFU6IFBzZXVkb0FMVSxcclxuICAgIFBST0c6IE1lbW9yeSxcclxuICAgIERBVEE6IE1lbW9yeSxcclxuICAgIE06IE1lbW9yeU1hcCxcclxuICAgIENVOiBDb250cm9sVW5pdFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHNldWRvQ1BVIGltcGxlbWVudHMgUHNldWRvQ1BVQXJjaGl0ZWN0dXJlLCBDZW50cmFsUHJvY2Vzc2luZ1VuaXQge1xyXG4gICAgcHVibGljIHN0YXRpYyBXT1JEX1NJWkUgPSAxNjsgLy8gd29yZCBzaXplIGluIGJpdHMuXHJcbiAgICBwdWJsaWMgc3RhdGljIEFERFJFU1NfU0laRSA9IDEzOyAvLyBhZGRyZXNzIHNpemUgaW4gYml0czsgMioqMTMgPSAweDIwMDAgPSA4MTkyIGFkZHJlc3NhYmxlIHdvcmRzIG1lbW9yeS5cclxuICAgIHB1YmxpYyBzdGF0aWMgT1BDT0RFX1NJWkUgPSAzOyAvLyBvcGNvZGUgc2l6ZSBpbiBiaXRzLCAyKiozID0gOCB1bmlxdWUgb3Bjb2Rlcy5cclxuICAgIHB1YmxpYyBzdGF0aWMgUFJPR1JBTV9NRU1PUllfU0laRSA9IDB4MDg7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIHByb2dyYW0gbWVtb3J5LlxyXG4gICAgcHVibGljIHN0YXRpYyBEQVRBX01FTU9SWV9TSVpFID0gMHgwODsgLy8gYWRkcmVzc2FibGUgd29yZHMgb2YgZGF0YSBtZW1vcnkuXHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0dSQU1fTUVNT1JZX0JFR0lOID0gMHgwMDsgLy8gYWRkcmVzcyBvZiBmaXJzdCB3b3JkIG9mIHByb2dyYW0gbWVtb3J5LlxyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEFfTUVNT1JZX0JFR0lOID0gUHNldWRvQ1BVLlBST0dSQU1fTUVNT1JZX1NJWkU7IC8vIGFkZHJlc3Mgb2YgZmlyc3Qgd29yZCBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUEM6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IElSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBBQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTURSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNQVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFMVTogUHNldWRvQUxVO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0c6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBEQVRBOiBNZW1vcnk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTTogTWVtb3J5TWFwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IENVOiBDb250cm9sVW5pdDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLlBDID0gbmV3IFJlZ2lzdGVyKFwiUENcIiwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSlcclxuICAgICAgICB0aGlzLklSID0gbmV3IFJlZ2lzdGVyKFwiSVJcIiwgUHNldWRvQ1BVLk9QQ09ERV9TSVpFKTtcclxuICAgICAgICB0aGlzLkFDID0gbmV3IFJlZ2lzdGVyKFwiQUNcIiwgUHNldWRvQ1BVLldPUkRfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NRFIgPSBuZXcgUmVnaXN0ZXIoXCJNRFJcIiwgUHNldWRvQ1BVLldPUkRfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NQVIgPSBuZXcgUmVnaXN0ZXIoXCJNQVJcIiwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSk7XHJcbiAgICAgICAgdGhpcy5BTFUgPSBuZXcgUHNldWRvQUxVKHRoaXMuQUMsIHRoaXMuTURSLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLlBST0cgPSBuZXcgTWVtb3J5KFwiUFJPR1wiLCBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRSk7XHJcbiAgICAgICAgdGhpcy5EQVRBID0gbmV3IE1lbW9yeShcIkRBVEFcIiwgUHNldWRvQ1BVLkRBVEFfTUVNT1JZX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuTSA9IG5ldyBNZW1vcnlNYXAodGhpcy5NRFIsIHRoaXMuTUFSKTtcclxuICAgICAgICB0aGlzLk0ubWFwRXh0ZXJuYWxNZW1vcnkodGhpcy5QUk9HUkFNX01FTU9SWV9CRUdJTiwgUHNldWRvQ1BVLlBST0dSQU1fTUVNT1JZX1NJWkUsIE1lbW9yeUFjY2Vzcy5SRUFELCB0aGlzLlBST0cpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBFeHRlcm5hbE1lbW9yeSh0aGlzLkRBVEFfTUVNT1JZX0JFR0lOLCBQc2V1ZG9DUFUuREFUQV9NRU1PUllfU0laRSwgTWVtb3J5QWNjZXNzLlJFQURfV1JJVEUsIHRoaXMuREFUQSk7XHJcbiAgICAgICAgdGhpcy5DVSA9IG5ldyBQc2V1ZG9DVSh0aGlzLklSLCB0aGlzLlBDLCB0aGlzLkFDLCB0aGlzLk1BUiwgdGhpcy5NRFIsIHRoaXMuQUxVLCB0aGlzLk0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGVwQ2xvY2soKSB7XHJcbiAgICAgICAgdGhpcy5DVS5jbG9jaygpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGVwSW5zdHJ1Y3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5DVS5jbG9jaygpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgd3JpdGVQcm9ncmFtKHN0YXJ0OiBudW1iZXIsIC4uLnByb2dyYW06IEFycmF5PG51bWJlcj4pIHtcclxuICAgICAgICBwcm9ncmFtLmZvckVhY2goKGluc3RydWN0aW9uLCBhZGRyZXNzKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuUFJPRy53cml0ZShzdGFydCArIGFkZHJlc3MgLSB0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBpbnN0cnVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlRGF0YShzdGFydDogbnVtYmVyLCAuLi5kYXRhOiBBcnJheTxudW1iZXI+KSB7XHJcbiAgICAgICAgZGF0YS5mb3JFYWNoKCh2YWx1ZSwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLkRBVEEud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5EQVRBX01FTU9SWV9CRUdJTiwgdmFsdWUpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnlNYXAgfSBmcm9tIFwiQC9NZW1vcnlNYXBcIjtcclxuaW1wb3J0IHsgQ29udHJvbFVuaXQgfSBmcm9tIFwiQC9Db250cm9sVW5pdFwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvQ1BVIH0gZnJvbSBcIi4vUHNldWRvQ1BVXCI7XHJcbmltcG9ydCB7IFBzZXVkb09wQ29kZSB9IGZyb20gXCIuL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcbmltcG9ydCB7UHNldWRvQUxVfSBmcm9tIFwiLi9Qc2V1ZG9BTFVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DVSBpbXBsZW1lbnRzIENvbnRyb2xVbml0IHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2lyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3BjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21hcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWx1OiBQc2V1ZG9BTFU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZW1vcnk6IE1lbW9yeU1hcDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpcjogUmVnaXN0ZXIsIHBjOiBSZWdpc3RlciwgYWM6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCBhbHU6IFBzZXVkb0FMVSwgbWVtb3J5OiBNZW1vcnlNYXApIHtcclxuICAgICAgICB0aGlzLl9pciA9IGlyO1xyXG4gICAgICAgIHRoaXMuX3BjID0gcGM7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX2FsdSA9IGFsdTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkgPSBtZW1vcnk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsb2NrKCkge1xyXG4gICAgICAgIHRoaXMuZmV0Y2hBbmREZWNvZGVOZXh0SW5zdHJ1Y3Rpb24oKTtcclxuICAgICAgICB0aGlzLmV4ZWN1dGVJbnN0cnVjdGlvbigpO1xyXG4gICAgICAgIC8vIENsb2NrIGFsbCBjb25uZWN0ZWQgY29tcG9uZW50c1xyXG4gICAgICAgIC8vIGFmdGVyIGluc3RydWN0aW9uIGV4ZWN1dGlvbi5cclxuICAgICAgICB0aGlzLl9pci5jbG9jaygpO1xyXG4gICAgICAgIHRoaXMuX3BjLmNsb2NrKCk7XHJcbiAgICAgICAgdGhpcy5fYWMuY2xvY2soKTtcclxuICAgICAgICB0aGlzLl9tYXIuY2xvY2soKTtcclxuICAgICAgICB0aGlzLl9tZHIuY2xvY2soKTtcclxuICAgICAgICAvLyB0aGlzLl9hbHUuY2xvY2soKTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkuY2xvY2soKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBQZXJmb3JtcyBpbnN0cnVjdGlvbiBmZXRjaCBhbmQgZGVjb2RlLlxyXG4gICAgcHVibGljIGZldGNoQW5kRGVjb2RlTmV4dEluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIC8vIE1BUiA8LSBQQ1xyXG4gICAgICAgIHRoaXMuX21hci53cml0ZSh0aGlzLl9wYy5yZWFkKCkpO1xyXG4gICAgICAgIC8vIFBDIDwtIFBDICsgMVxyXG4gICAgICAgIHRoaXMuX3BjLndyaXRlKHRoaXMuX3BjLnJlYWQoKSArIDEpO1xyXG4gICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICB0aGlzLl9tZW1vcnkubG9hZCgpO1xyXG4gICAgICAgIC8vIElSIDwtIE1EUihvcGNvZGUpXHJcbiAgICAgICAgbGV0IE9QQ09ERV9TSElGVCA9IFBzZXVkb0NQVS5XT1JEX1NJWkUgLSBQc2V1ZG9DUFUuT1BDT0RFX1NJWkU7XHJcbiAgICAgICAgbGV0IG9wY29kZSA9IHRoaXMuX21kci5yZWFkKCkgPj4gT1BDT0RFX1NISUZUO1xyXG4gICAgICAgIHRoaXMuX2lyLndyaXRlKG9wY29kZSk7XHJcbiAgICAgICAgLy8gTUFSIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IGFkZHJlc3MgPSB0aGlzLl9tZHIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgIHRoaXMuX21hci53cml0ZShhZGRyZXNzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRXhlY3V0ZXMgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24gbG9hZGVkIGludG8gSVIuXHJcbiAgICBwdWJsaWMgZXhlY3V0ZUluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIC8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuICAgICAgICAvLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbiAgICAgICAgLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4gICAgICAgIC8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4gICAgICAgIC8vIFNVQiB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyAtIE1EUlxyXG4gICAgICAgIC8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuICAgICAgICAvLyBTSEZUIHg6IEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAvLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIC8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuICAgICAgICBjb25zdCBbSVIsIFBDLCBBQywgTUFSLCBNRFIsIEFMVSwgTV0gPSBbdGhpcy5faXIsIHRoaXMuX3BjLCB0aGlzLl9hYywgdGhpcy5fbWFyLCB0aGlzLl9tZHIsIHRoaXMuX2FsdSwgdGhpcy5fbWVtb3J5XTtcclxuXHJcbiAgICAgICAgY29uc3QgY29weSA9IChkc3Q6IFJlZ2lzdGVyLCBzcmM6IFJlZ2lzdGVyKSA9PiBkc3Qud3JpdGUoc3JjLnJlYWQoKSk7XHJcblxyXG4gICAgICAgIGxldCBvcGNvZGUgPSBJUi5yZWFkKCk7XHJcbiAgICAgICAgc3dpdGNoIChvcGNvZGUpIHtcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuTERBOiAgICAgIC8vIExEQSB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgY29weShBQywgTURSKTsgICAgICAgICAgLy8gQUMgPC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU1RBOiAgICAgIC8vIFNUQSB4OlxyXG4gICAgICAgICAgICAgICAgY29weShNRFIsIEFDKTsgICAgICAgICAgLy8gTURSIDwtIEFDXHJcbiAgICAgICAgICAgICAgICBNLnN0b3JlKCk7ICAgICAgICAgICAgICAvLyBNW01BUl0gPC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuQUREOiAgICAgIC8vIEFERCB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLmFkZCgpOyAgICAgICAgICAgICAgLy8gQUMgPC0gQUMgKyBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TVUI6ICAgICAgLy8gU1VCIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUuc3ViKCk7ICAgICAgICAgICAgICAvLyBBQyA8LSBBQyAtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLk5BTkQ6ICAgICAvLyBOQU5EIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUubmFuZCgpOyAgICAgICAgICAgICAvLyBBQyA8LSB+KEFDICYgTURSKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNIRlQ6ICAgICAvLyBTSEZUOlxyXG4gICAgICAgICAgICAgICAgQUxVLnNoZnQoKTsgICAgICAgICAgICAgLy8gQUMgPC0gQUMgPDwgMVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLko6ICAgICAgICAvLyBKIHg6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE1EUi5yZWFkKCkgJiBBRERSRVNTX01BU0s7XHJcbiAgICAgICAgICAgICAgICBQQy53cml0ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5CTkU6ICAgICAgLy8gQk5FIHg6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoWiAhPSAxKSB0aGVuIFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgICAgICAgICAgaWYgKEFMVS5aICE9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTURSLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICAgICAgICAgICAgICBQQy53cml0ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgYFVua25vd24gb3Bjb2RlOiAke29wY29kZX1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4vLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbi8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4vLyBTVUIgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgLSBNRFJcclxuLy8gTkFORCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSB+KEFDICYgTURSKVxyXG4vLyBTSEZUIHg6IEFDIDwtIEFDIDw8IDFcclxuLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG5pbXBvcnQgeyBJbnN0cnVjdGlvbiB9IGZyb20gXCJAL0luc3RydWN0aW9uXCI7XHJcblxyXG5pbXBvcnQgeyBQc2V1ZG9DUFUgfSBmcm9tIFwiLi9Qc2V1ZG9DUFVcIjtcclxuXHJcblxyXG5leHBvcnQgZW51bSBQc2V1ZG9PcENvZGUge1xyXG4gICAgTERBICA9IDBiMDAwLFxyXG4gICAgU1RBICA9IDBiMDAxLFxyXG4gICAgQUREICA9IDBiMDEwLFxyXG4gICAgU1VCICA9IDBiMDExLFxyXG4gICAgTkFORCA9IDBiMTAwLFxyXG4gICAgU0hGVCA9IDBiMTAxLFxyXG4gICAgSiAgICA9IDBiMTEwLFxyXG4gICAgQk5FICA9IDBiMTExXHJcbn1cclxuXHJcbi8vIEluc3RydWN0aW9uIG1lbW9yeSBmb3JtYXQ6XHJcbi8vICAgICAgW0luc3RydWN0aW9uOiBXT1JEX1NJWkVdID0gW29wY29kZTogT1BDT0RFX1NJWkVdIFtvcGVyYW5kOiBBRERSRVNTX1NJWkVdXHJcbi8vIE9wZXJhbmQgdXNhZ2UgaXMgZGVmaW5lZCBieSB0aGUgb3Bjb2RlLlxyXG4vLyBPcGVyYW5kIGFkZHJlc3MgaXMgbG9hZGVkIGludG8gTUFSIGFmdGVyIHRoZSBmZXRjaCBhbmQgZGVjb2RlIGN5Y2xlLlxyXG5leHBvcnQgY2xhc3MgUHNldWRvSW5zdHJ1Y3Rpb24gaW1wbGVtZW50cyBJbnN0cnVjdGlvbiB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3Bjb2RlOiBQc2V1ZG9PcENvZGU7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3BlcmFuZDogbnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFZBTFVFOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3Bjb2RlOiBQc2V1ZG9PcENvZGUsIG9wZXJhbmQ6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMub3Bjb2RlID0gb3Bjb2RlO1xyXG4gICAgICAgIHRoaXMub3BlcmFuZCA9IG9wZXJhbmQ7XHJcbiAgICAgICAgdGhpcy5WQUxVRSA9ICh0aGlzLm9wY29kZSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSArIHRoaXMub3BlcmFuZDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IExEQSAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuTERBLCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IFNUQSAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuU1RBLCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IEFERCAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuQURELCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IFNVQiAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuU1VCLCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IE5BTkQgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuTkFORCwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBTSEZUICAgPSAoKSAgICAgICAgICAgICAgICA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLlNIRlQsIDApO1xyXG5leHBvcnQgY29uc3QgSiAgICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5KLCAgIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgQk5FICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5CTkUsIG9wZXJhbmQpO1xyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiaW1wb3J0IHsgUHNldWRvQ1BVIH0gZnJvbSBcIkAvUHNldWRvQ1BVL1BzZXVkb0NQVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9PcENvZGUsIExEQSwgU1RBLCBBREQsIFNIRlQsIFBzZXVkb0luc3RydWN0aW9uIH0gZnJvbSBcIkAvUHNldWRvQ1BVL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcblxyXG5mdW5jdGlvbiBtYWluKCkge1xyXG4gICAgLy8gQ29uc3RydWN0IGEgRUNFMzc1IFBzZXVkbyBDUFUsIGZhY3RvcnkgbmV3IVxyXG4gICAgY29uc3QgQ1BVID0gbmV3IFBzZXVkb0NQVSgpO1xyXG5cclxuICAgIC8vIERlZmluZSBsYWJlbHMgaW4gREFUQSBtZW1vcnkuXHJcbiAgICBsZXQgQSA9IENQVS5EQVRBX01FTU9SWV9CRUdJTjtcclxuICAgIGxldCBCID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMTtcclxuICAgIGxldCBDID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMjtcclxuICAgIC8vIFByb2dyYW0sIGNvbXB1dGVzIEMgPSA0KkEgKyBCXHJcbiAgICBjb25zdCBwcm9ncmFtID0gW1xyXG4gICAgICAgIExEQShBKSxcclxuICAgICAgICBTSEZUKCksXHJcbiAgICAgICAgU0hGVCgpLFxyXG4gICAgICAgIEFERChCKSxcclxuICAgICAgICBTVEEoQylcclxuICAgIF0ubWFwKGluc3RydWN0aW9uID0+IGluc3RydWN0aW9uLlZBTFVFKTtcclxuICAgIC8vIFdyaXRlIHByb2dyYW0gdG8gbWVtb3J5LlxyXG4gICAgQ1BVLndyaXRlUHJvZ3JhbSgwLCAuLi5wcm9ncmFtKTtcclxuICAgIC8vIEluaXRpYWwgdmFsdWVzOiBBID0gMjAsIEIgPSAyMCwgQyA9IDAuXHJcbiAgICBDUFUud3JpdGVEYXRhKEEsIDIwKTtcclxuICAgIENQVS53cml0ZURhdGEoQiwgMjEpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHByaW50Q1BVKCkge1xyXG4gICAgICAgIGNvbnN0IHByaW50ID0gKC4uLmFyZ3M6IEFycmF5PHsgdG9TdHJpbmcoKTogc3RyaW5nIH0+KSA9PiBjb25zb2xlLmxvZyguLi5hcmdzLm1hcCh2YWx1ZSA9PiB2YWx1ZS50b1N0cmluZygpKSk7XHJcbiAgICAgICAgY29uc3QgeyBQQywgSVIsIEFDLCBNRFIsIE1BUiwgQUxVLCBQUk9HLCBEQVRBLCBNLCBDVSB9ID0gQ1BVO1xyXG4gICAgICAgIHByaW50KFBDKTtcclxuICAgICAgICBwcmludChJUiwgXCI9PlwiLCBQc2V1ZG9PcENvZGVbSVIucmVhZCgpXSk7XHJcbiAgICAgICAgcHJpbnQoQUMsIFwiPT5cIiwgQUMucmVhZCgpKTtcclxuICAgICAgICBwcmludChgWj0ke0FMVS5afWApO1xyXG4gICAgICAgIHByaW50KE1EUiwgXCI9PlwiLCBNRFIucmVhZCgpKTtcclxuICAgICAgICBwcmludChNQVIpO1xyXG4gICAgICAgIHByaW50KGA9PSAke1BST0cuTkFNRX0gbWVtb3J5YClcclxuICAgICAgICBwcmludChQUk9HKTtcclxuICAgICAgICBwcmludChgPT0gJHtEQVRBLk5BTUV9IG1lbW9yeWApXHJcbiAgICAgICAgcHJpbnQoREFUQSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBTVEVQX0NPVU5UID0gcHJvZ3JhbS5sZW5ndGg7XHJcbiAgICBjb25zb2xlLmxvZyhcIj09IEluaXRpYWwgU3RhdGVcIik7XHJcbiAgICBwcmludENQVSgpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBTVEVQX0NPVU5UOyBpKyspIHtcclxuICAgICAgICBDUFUuc3RlcEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgcHJpbnRDUFUoKTtcclxuICAgIH1cclxufVxyXG5cclxubWFpbigpOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==