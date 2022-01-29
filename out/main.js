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
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Register = void 0;
class Register {
    constructor(name, size) {
        this.NAME = name;
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
        this.M = new MemoryMap_1.MemoryMap();
        this.M.mapMemoryRange(this.PROGRAM_MEMORY_BEGIN, PseudoCPU.PROGRAM_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ, this.PROG);
        this.M.mapMemoryRange(this.DATA_MEMORY_BEGIN, PseudoCPU.DATA_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ_WRITE, this.DATA);
        this.CU = new PseudoCU_1.PseudoCU(this.IR, this.PC, this.AC, this.MAR, this.MDR, this.ALU, this.M);
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
    // Performs instruction fetch and decode.
    fetchAndDecodeNextInstruction() {
        // MAR <- PC
        this._mar.write(this._pc.read());
        // PC <- PC + 1
        this._pc.write(this._pc.read() + 1);
        // MDR <- M[MAR]
        this._mdr.write(this._memory.read(this._mar.read()));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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R0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDM0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRU0sR0FBRztRQUNOLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDbEUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLENBQUMsR0FBRyxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sSUFBSTtRQUNQLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUMvRCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFTSxJQUFJO1FBQ1AsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQ2hELElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEMsQ0FBQztDQUNKO0FBaERELDhCQWdEQzs7Ozs7Ozs7Ozs7O0FDbERELGVBQWU7QUFDZixnQ0FBZ0M7QUFDaEMsMEJBQTBCO0FBQzFCLHlDQUF5QztBQUN6QywwQ0FBMEM7QUFDMUMsMkJBQTJCO0FBQzNCLHlDQUF5QztBQUN6QyxtREFBbUQ7QUFDbkQseUNBQXlDO0FBQ3pDLDRCQUE0QjtBQUM1QixpREFBaUQ7QUFDakQsNERBQTREO0FBQzVELDJEQUEyRDtBQUMzRCxtQ0FBbUM7QUFDbkMsaURBQWlEO0FBQ2pELDhEQUE4RDtBQUM5RCxnRUFBZ0U7QUFDaEUsdUNBQXVDO0FBQ3ZDLGtEQUFrRDtBQUNsRCxvRUFBb0U7QUFDcEUsK0RBQStEO0FBQy9ELGVBQWU7QUFDZixnQkFBZ0I7QUFDaEIseURBQXlEO0FBQ3pELG9DQUFvQztBQUNwQyxzQkFBc0I7QUFDdEIsY0FBYztBQUNkLDBEQUEwRDtBQUMxRCw0REFBNEQ7QUFDNUQsNENBQTRDO0FBQzVDLGFBQWE7QUFDYix5RkFBeUY7QUFDekYsNERBQTREO0FBQzVELHNEQUFzRDtBQUN0RCxHQUFHO0FBQ0gsZ0NBQWdDO0FBQ2hDLHVCQUF1QjtBQUN2QixxQkFBcUI7QUFDckIscUJBQXFCO0FBQ3JCLG1CQUFtQjtBQUNuQixnQkFBZ0I7QUFDaEIsa0NBQWtDO0FBQ2xDLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIscUJBQXFCO0FBQ3JCLHFCQUFxQjtBQUNyQixFQUFFO0FBQ0Ysd0JBQXdCO0FBQ3hCLFdBQVc7QUFDWCx5Q0FBeUM7QUFDekMseURBQXlEO0FBQ3pELHlEQUF5RDtBQUN6RCxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLFFBQVE7QUFDUixtRUFBbUU7QUFDbkUsZUFBZTtBQUNmLGdCQUFnQjtBQUNoQixlQUFlO0FBQ2YsZ0JBQWdCO0FBQ2hCLEVBQUU7QUFDRixpQkFBaUI7QUFDakIsdURBQXVEO0FBQ3ZELEVBQUU7QUFDRixpQkFBaUI7QUFDakIseUNBQXlDO0FBQ3pDLEVBQUU7QUFDRixpQkFBaUI7QUFDakIsaUNBQWlDO0FBQ2pDLEVBQUU7QUFDRixnQkFBZ0I7QUFDaEIsNkJBQTZCO0FBQzdCLEVBQUU7QUFDRixnQkFBZ0I7QUFDaEIsK0NBQStDO0FBQy9DLEVBQUU7QUFDRixnQkFBZ0I7QUFDaEIsOENBQThDO0FBQzlDLDhDQUE4QztBQUM5QyxFQUFFO0FBQ0YsNEJBQTRCO0FBQzVCLGtDQUFrQztBQUNsQyxrQ0FBa0M7QUFDbEMsdUNBQXVDO0FBQ3ZDLDBCQUEwQjtBQUMxQiw2Q0FBNkM7OztBQUU3QywyRkFBc0M7QUFDdEMscUZBQWtDO0FBQ2xDLDhGQUFzRDtBQUt0RCx3R0FBc0M7QUFDdEMsMkdBQXdDO0FBZXhDLE1BQWEsU0FBUztJQXFCbEI7UUFkZ0IseUJBQW9CLEdBQUcsSUFBSSxDQUFDLENBQUMsMkNBQTJDO1FBQ3hFLHNCQUFpQixHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLHdDQUF3QztRQWN2RyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUNwRCxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxtQkFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLG1CQUFRLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksbUJBQVEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxxQkFBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGVBQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGVBQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLHFCQUFTLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLG1CQUFtQixFQUFFLHdCQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5RyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixFQUFFLHdCQUFZLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5RyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUYsQ0FBQztJQUVNLGVBQWU7UUFDbEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRU0sWUFBWSxDQUFDLEtBQWEsRUFBRSxHQUFHLE9BQXNCO1FBQ3hELE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDOUUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU0sU0FBUyxDQUFDLEtBQWEsRUFBRSxHQUFHLElBQW1CO1FBQ2xELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckUsQ0FBQyxDQUFDO0lBQ04sQ0FBQzs7QUFuREwsOEJBb0RDO0FBbkRpQixtQkFBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLHFCQUFxQjtBQUNyQyxzQkFBWSxHQUFHLEVBQUUsQ0FBQyxDQUFDLHdFQUF3RTtBQUMzRixxQkFBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLGdEQUFnRDtBQUNqRSw2QkFBbUIsR0FBRyxJQUFJLENBQUMsQ0FBQyx1Q0FBdUM7QUFDbkUsMEJBQWdCLEdBQUcsSUFBSSxDQUFDLENBQUMsb0NBQW9DOzs7Ozs7Ozs7Ozs7OztBQy9HL0UsMkdBQXdDO0FBQ3hDLG1JQUFtRDtBQUduRCxNQUFhLFFBQVE7SUFTakIsWUFBWSxFQUFZLEVBQUUsRUFBWSxFQUFFLEVBQVksRUFBRSxHQUFhLEVBQUUsR0FBYSxFQUFFLEdBQWMsRUFBRSxNQUFpQjtRQUNqSCxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNkLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRUQseUNBQXlDO0lBQ2xDLDZCQUE2QjtRQUNoQyxZQUFZO1FBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLGVBQWU7UUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRXBDLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVyRCxvQkFBb0I7UUFDcEIsSUFBSSxZQUFZLEdBQUcscUJBQVMsQ0FBQyxTQUFTLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUM7UUFDL0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxZQUFZLENBQUM7UUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkIsc0JBQXNCO1FBQ3RCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLHFCQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsWUFBWSxDQUFDO1FBQzlDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRCxtREFBbUQ7SUFDNUMsa0JBQWtCO1FBQ3JCLDRCQUE0QjtRQUM1QixrQ0FBa0M7UUFDbEMsa0NBQWtDO1FBQ2xDLHVDQUF1QztRQUN2Qyx1Q0FBdUM7UUFDdkMsMkNBQTJDO1FBQzNDLHdCQUF3QjtRQUN4QiwwQkFBMEI7UUFDMUIsNkNBQTZDO1FBRTdDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVySCxTQUFTLElBQUksQ0FBQyxHQUFhLEVBQUUsR0FBYTtZQUN0QyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRCxTQUFTLElBQUk7WUFDVCxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsU0FBUyxLQUFLO1lBQ1YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixRQUFRLE1BQU0sRUFBRTtZQUNaLEtBQUssZ0NBQVksQ0FBQyxHQUFHLEVBQU8sU0FBUztnQkFDakMsSUFBSSxFQUFFLENBQUMsQ0FBaUIsZ0JBQWdCO2dCQUN4QyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQVUsWUFBWTtnQkFDcEMsTUFBTTtZQUNWLEtBQUssZ0NBQVksQ0FBQyxHQUFHLEVBQU8sU0FBUztnQkFDakMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFVLFlBQVk7Z0JBQ3BDLEtBQUssRUFBRSxDQUFDLENBQWdCLGdCQUFnQjtnQkFDeEMsTUFBTTtZQUNWLEtBQUssZ0NBQVksQ0FBQyxHQUFHLEVBQU8sU0FBUztnQkFDakMsSUFBSSxFQUFFLENBQUMsQ0FBaUIsZ0JBQWdCO2dCQUN4QyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBYyxpQkFBaUI7Z0JBQ3pDLE1BQU07WUFDVixLQUFLLGdDQUFZLENBQUMsR0FBRyxFQUFPLFNBQVM7Z0JBQ2pDLElBQUksRUFBRSxDQUFDLENBQWlCLGdCQUFnQjtnQkFDeEMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQWMsaUJBQWlCO2dCQUN6QyxNQUFNO1lBQ1YsS0FBSyxnQ0FBWSxDQUFDLElBQUksRUFBTSxVQUFVO2dCQUNsQyxJQUFJLEVBQUUsQ0FBQyxDQUFpQixnQkFBZ0I7Z0JBQ3hDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFhLG9CQUFvQjtnQkFDNUMsTUFBTTtZQUNWLEtBQUssZ0NBQVksQ0FBQyxJQUFJLEVBQU0sUUFBUTtnQkFDaEMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQWEsZ0JBQWdCO2dCQUN4QyxNQUFNO1lBQ1YsS0FBSyxnQ0FBWSxDQUFDLENBQUMsRUFBUyxPQUFPO2dCQUNQLHFCQUFxQjtnQkFDN0MsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLElBQUkscUJBQVMsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JELElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxZQUFZLENBQUM7Z0JBQ3hDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xCLE1BQU07WUFDVixLQUFLLGdDQUFZLENBQUMsR0FBRyxFQUFPLFNBQVM7Z0JBQ1Qsc0NBQXNDO2dCQUM5RCxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNaLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLHFCQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNyRCxJQUFJLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsWUFBWSxDQUFDO29CQUN4QyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNyQjtnQkFDRCxNQUFNO1lBQ1Y7Z0JBQ0ksTUFBTSxtQkFBbUIsTUFBTSxFQUFFLENBQUM7U0FDekM7SUFDTCxDQUFDO0NBQ0o7QUE1R0QsNEJBNEdDOzs7Ozs7Ozs7Ozs7QUNwSEQsNEJBQTRCO0FBQzVCLGtDQUFrQztBQUNsQyxrQ0FBa0M7QUFDbEMsdUNBQXVDO0FBQ3ZDLHVDQUF1QztBQUN2QywyQ0FBMkM7QUFDM0Msd0JBQXdCO0FBQ3hCLDBCQUEwQjtBQUMxQiw2Q0FBNkM7OztBQUk3QywyR0FBd0M7QUFHeEMsSUFBWSxZQVNYO0FBVEQsV0FBWSxZQUFZO0lBQ3BCLDZDQUFZO0lBQ1osNkNBQVk7SUFDWiw2Q0FBWTtJQUNaLDZDQUFZO0lBQ1osK0NBQVk7SUFDWiwrQ0FBWTtJQUNaLHlDQUFZO0lBQ1osNkNBQVk7QUFDaEIsQ0FBQyxFQVRXLFlBQVksR0FBWixvQkFBWSxLQUFaLG9CQUFZLFFBU3ZCO0FBRUQsNkJBQTZCO0FBQzdCLGdGQUFnRjtBQUNoRiwwQ0FBMEM7QUFDMUMsdUVBQXVFO0FBQ3ZFLE1BQWEsaUJBQWlCO0lBSzFCLFlBQVksTUFBb0IsRUFBRSxPQUFlO1FBQzdDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLHFCQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN4RSxDQUFDO0NBQ0o7QUFWRCw4Q0FVQztBQUVNLE1BQU0sR0FBRyxHQUFNLENBQUMsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBL0UsV0FBRyxPQUE0RTtBQUNyRixNQUFNLEdBQUcsR0FBTSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQS9FLFdBQUcsT0FBNEU7QUFDckYsTUFBTSxHQUFHLEdBQU0sQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksaUJBQWlCLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUEvRSxXQUFHLE9BQTRFO0FBQ3JGLE1BQU0sR0FBRyxHQUFNLENBQUMsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBL0UsV0FBRyxPQUE0RTtBQUNyRixNQUFNLElBQUksR0FBSyxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQWhGLFlBQUksUUFBNEU7QUFDdEYsTUFBTSxJQUFJLEdBQUssR0FBa0IsRUFBRSxDQUFDLElBQUksaUJBQWlCLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztBQUExRSxZQUFJLFFBQXNFO0FBQ2hGLE1BQU0sQ0FBQyxHQUFRLENBQUMsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUksT0FBTyxDQUFDLENBQUM7QUFBL0UsU0FBQyxLQUE4RTtBQUNyRixNQUFNLEdBQUcsR0FBTSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQS9FLFdBQUcsT0FBNEU7Ozs7Ozs7VUNqRDVGO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7OztBQ3RCQSxxSEFBa0Q7QUFDbEQsNklBQXFHO0FBRXJHLFNBQVMsSUFBSTtJQUNULDhDQUE4QztJQUM5QyxNQUFNLEdBQUcsR0FBRyxJQUFJLHFCQUFTLEVBQUUsQ0FBQztJQUU1QixnQ0FBZ0M7SUFDaEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0lBQzlCLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFDbEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUNsQyxnQ0FBZ0M7SUFDaEMsTUFBTSxPQUFPLEdBQUc7UUFDWiwyQkFBRyxFQUFDLENBQUMsQ0FBQztRQUNOLDRCQUFJLEdBQUU7UUFDTiw0QkFBSSxHQUFFO1FBQ04sMkJBQUcsRUFBQyxDQUFDLENBQUM7UUFDTiwyQkFBRyxFQUFDLENBQUMsQ0FBQztLQUNULENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLDJCQUEyQjtJQUMzQixHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLHlDQUF5QztJQUN6QyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNyQixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVyQixTQUFTLFFBQVE7UUFDYixNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsSUFBbUMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlHLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUM7UUFDN0QsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ1YsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsZ0NBQVksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNCLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BCLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQztRQUMvQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNoQyxRQUFRLEVBQUUsQ0FBQztJQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDakMsR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3RCLFFBQVEsRUFBRSxDQUFDO0tBQ2Q7QUFDTCxDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL01lbW9yeS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL01lbW9yeU1hcC50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL1JlZ2lzdGVyLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0FMVS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9DUFUudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvQ1UudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvSW5zdHJ1Y3Rpb24udHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lbW9yeU1hcHBpbmcgfSBmcm9tIFwiLi9NZW1vcnlNYXBcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNZW1vcnkgaW1wbGVtZW50cyBNZW1vcnlNYXBwaW5nIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBOQU1FOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgU0laRTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZGF0YTogQXJyYXk8bnVtYmVyPjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gbmV3IEFycmF5PG51bWJlcj4odGhpcy5TSVpFKTtcclxuICAgICAgICB0aGlzLl9kYXRhLmZpbGwoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgZGF0YTogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYCR7dGhpcy5OQU1FfS53cml0ZSgke2FkZHJlc3N9LCAke2RhdGF9KWApO1xyXG4gICAgICAgIHRoaXMuX2RhdGFbYWRkcmVzc10gPSBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYCR7dGhpcy5OQU1FfS5yZWFkKCR7YWRkcmVzc30pYCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbYWRkcmVzc107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvU3RyaW5nKHdpdGhPZmZzZXQ/OiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgbGluZXMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU0laRTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBhZGRyZXNzID0gd2l0aE9mZnNldCA/IGkgKyB3aXRoT2Zmc2V0IDogaTtcclxuICAgICAgICAgICAgbGluZXMucHVzaChgMHgke2FkZHJlc3MudG9TdHJpbmcoMTYpfTogMHgke3RoaXMuX2RhdGFbaV0udG9TdHJpbmcoMTYpfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIkAvTWVtb3J5XCI7XHJcblxyXG5leHBvcnQgdHlwZSBNZW1vcnlNYXBwaW5nID0ge1xyXG4gICAgcmVhZDogKGFkZHJlc3M6IG51bWJlcikgPT4gbnVtYmVyLFxyXG4gICAgd3JpdGU6IChhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IHZvaWRcclxufVxyXG5cclxuZXhwb3J0IGVudW0gTWVtb3J5QWNjZXNzIHtcclxuICAgIFJFQUQsXHJcbiAgICBXUklURSxcclxuICAgIFJFQURfV1JJVEVcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1lbW9yeU1hcCB7XHJcbiAgICAvLyBBIG1hcCBmcm9tIGFkZHJlc3MgcmFuZ2UgW3N0YXJ0LCBlbmRdIHRvIGEgcmVhZC93cml0YWJsZSBtZW1vcnkgbG9jYXRpb24uXHJcbiAgICBwcml2YXRlIG1hcHBpbmdzOiBNYXA8W3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyXSwgTWVtb3J5TWFwcGluZz47XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncyA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzOiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgcmFuZ2VzID0gWy4uLnRoaXMubWFwcGluZ3Mua2V5cygpXTtcclxuICAgICAgICBsZXQga2V5ID0gcmFuZ2VzLmZpbmQocmFuZ2UgPT4gYWRkcmVzcyA+PSByYW5nZVswXSAmJiBhZGRyZXNzIDw9IHJhbmdlWzFdKTtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IGtleSA/IHRoaXMubWFwcGluZ3MuZ2V0KGtleSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgcmV0dXJuIG1hcHBpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIGxvYWQoKSBmcm9tIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSBtYXBwaW5nLnJlYWQoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUoYWRkcmVzczogbnVtYmVyLCBkYXRhOiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHN0b3JlKCkgdG8gdW5tYXBwZWQgbWVtb3J5XCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBtYXBwaW5nLndyaXRlKGFkZHJlc3MsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWFwTWVtb3J5UmFuZ2Uoc3RhcnQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIG1vZGU6IE1lbW9yeUFjY2VzcywgTU06IE1lbW9yeU1hcHBpbmcpIHtcclxuICAgICAgICBmdW5jdGlvbiByZWFkXyhhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLldSSVRFKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gcmVhZCgpIGZyb20gV1JJVEUtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBNTS5yZWFkKGFkZHJlc3MgLSBzdGFydCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZV8oYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2RlID09PSBNZW1vcnlBY2Nlc3MuUkVBRCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHdyaXRlKCkgdG8gUkVBRC1vbmx5IG1lbW9yeVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgTU0ud3JpdGUoYWRkcmVzcyAtIHN0YXJ0LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcmFuZ2U6IFtudW1iZXIsIG51bWJlcl0gPSBbc3RhcnQsIHN0YXJ0ICsgbGVuZ3RoIC0gMV07XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncy5zZXQocmFuZ2UsIHsgcmVhZDogcmVhZF8sIHdyaXRlOiB3cml0ZV8gfSlcclxuICAgIH1cclxufSIsImV4cG9ydCBjbGFzcyBSZWdpc3RlciB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTkFNRTogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RhdGE6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpIHtcclxuICAgICAgICByZXR1cm4gYCR7dGhpcy5OQU1FfTwweCR7dGhpcy5fZGF0YS50b1N0cmluZygxNil9PmA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0FMVSB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgV09SRF9TSVpFO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWM6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3o6IFJlZ2lzdGVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFjOiBSZWdpc3RlciwgbWRyOiBSZWdpc3Rlciwgd29yZFNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2FjID0gYWM7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuV09SRF9TSVpFID0gd29yZFNpemU7XHJcbiAgICAgICAgdGhpcy5feiA9IG5ldyBSZWdpc3RlcihcIlpcIiwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBaKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3oucmVhZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQgWih2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fei53cml0ZSh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgc3VtID0gKHRoaXMuX2FjLnJlYWQoKSArIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHN1bSk7XHJcbiAgICAgICAgdGhpcy5aID0gc3VtID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN1YigpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgZGlmZmVyZW5jZSA9ICh0aGlzLl9hYy5yZWFkKCkgLSB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShkaWZmZXJlbmNlKTtcclxuICAgICAgICB0aGlzLlogPSBkaWZmZXJlbmNlID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hbmQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IH4odGhpcy5fYWMucmVhZCgpICYgdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUocmVzdWx0KTtcclxuICAgICAgICB0aGlzLlogPSByZXN1bHQgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hmdCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gKHRoaXMuX2FjLnJlYWQoKSA8PCAxKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuWiA9IHJlc3VsdCA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG59IiwiLy8gPT0gUHNldWRvSVNBXHJcbi8vIC0tIERhdGEgVHJhbnNmZXIgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0xvYWQgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIExEQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIExvYWRzIGEgbWVtb3J5IHdvcmQgdG8gdGhlIEFDLlxyXG4vLyAgICAgIFtTdG9yZSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1RBIHg7IHggaXMgYSBtZW1vcnkgbG9jYXRpb25cclxuLy8gICAgICAgICAgU3RvcmVzIHRoZSBjb250ZW50IG9mIHRoZSBBQyB0byBtZW1vcnkuXHJcbi8vIC0tIEFyaXRobWV0aWMgYW5kIExvZ2ljYWwgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0FkZCB0byBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgQUREIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBBZGRzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWQgYnlcclxuLy8gICAgICAgICAgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIHRvIHRoZSBjb250ZW50IGluIHRoZSBBQy5cclxuLy8gICAgICBbU3VidHJhY3QgZnJvbSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1VCIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBTdWJ0cmFjdHMgdGhlIGNvbnRlbnQgb2YgdGhlIG1lbW9yeSB3b3JkIHNwZWNpZmllZFxyXG4vLyAgICAgICAgICBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgZnJvbSB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW0xvZ2ljYWwgTkFORCB3aXRoIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBOQU5EIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBQZXJmb3JtcyBsb2dpY2FsIE5BTkQgYmV0d2VlbiB0aGUgY29udGVudHMgb2YgdGhlIG1lbW9yeVxyXG4vLyAgICAgICAgICB3b3JkIHNwZWNpZmllZCBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgYW5kIHRoZSBBQy5cclxuLy8gICAgICBbU2hpZnRdXHJcbi8vICAgICAgICAgIFNIRlRcclxuLy8gICAgICAgICAgVGhlIGNvbnRlbnQgb2YgQUMgaXMgc2hpZnRlZCBsZWZ0IGJ5IG9uZSBiaXQuXHJcbi8vICAgICAgICAgIFRoZSBiaXQgc2hpZnRlZCBpbiBpcyAwLlxyXG4vLyAtLSBDb250cm9sIFRyYW5zZmVyXHJcbi8vICAgICAgW0p1bXBdXHJcbi8vICAgICAgICAgIEogeDsgSnVtcCB0byBpbnN0cnVjdGlvbiBpbiBtZW1vcnkgbG9jYXRpb24geC5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MuXHJcbi8vICAgICAgW0JORV1cclxuLy8gICAgICAgICAgQk5FIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHggaWYgY29udGVudCBvZiBBQyBpcyBub3QgemVyby5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MgaWYgWiAhPSAwLlxyXG4vLyBcclxuLy8gPT0gUHNldWRvQ1BVIE1pY3JvLW9wZXJhdGlvbnNcclxuLy8gLS0gU3RvcmUvTG9hZCBtZW1vcnlcclxuLy8gICAgICBNW01BUl0gPC0gTURSXHJcbi8vICAgICAgTURSIDwtIE1bTUFSXVxyXG4vLyAtLSBDb3B5IHJlZ2lzdGVyXHJcbi8vICAgICAgUmEgPC0gUmJcclxuLy8gLS0gUmVnaXN0ZXIgaW5jcmVtZW50L2RlY3JlbWVudFxyXG4vLyAgICAgIFJhIDwtIFJhICsgMVxyXG4vLyAgICAgIFJhIDwtIFJhIC0gMVxyXG4vLyAgICAgIFJhIDwtIFJhICsgUmJcclxuLy8gICAgICBSYSA8LSBSYSAtIFJiXHJcbi8vXHJcbi8vID09IE1pbmltYWwgQ29tcG9uZW50c1xyXG4vLyBbTWVtb3J5XVxyXG4vLyBBZGRyZXNzYWJsZSBieSBBZGRyZXNzIExpbmUgdmlhIE1bTUFSXVxyXG4vLyBXcml0YWJsZSBieSBBZGRyZXNzIExpbmUgJiBEYXRhIExpbmUgdmlhIE1bTUFSXSA8LSBNRFJcclxuLy8gUmVhZGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNRFIgPC0gTVtNQVJdXHJcbi8vIE5lZWQgdHdvIG1lbW9yaWVzOiBwcm9ncmFtIG1lbW9yeSAocmVhZCBvbmx5KSBhbmQgZGF0YSBtZW1vcnkgKHJlYWQgJiB3cml0ZSkuXHJcbi8vXHJcbi8vIFtBTFVdXHJcbi8vIFBlcmZvcm1zIGFyaXRobWV0aWMgb3BlcmF0aW9ucywgb2Z0ZW4gaW52b2x2aW5nIHRoZSBBQyByZWdpc3Rlci5cclxuLy8gQUMgPC0gQUMgKyAxXHJcbi8vIEFDIDwtIEFDICsgUkFcclxuLy8gQUMgPC0gQUMgLSAxXHJcbi8vIEFDIDwtIEFDIC0gUkFcclxuLy9cclxuLy8gW0NvbnRyb2wgVW5pdF1cclxuLy8gRXhlY3V0ZXMgaW5zdHJ1Y3Rpb25zIGFuZCBzZXF1ZW5jZXMgbWljcm9vcGVyYXRpb25zLlxyXG4vL1xyXG4vLyBbTURSIFJlZ2lzdGVyXVxyXG4vLyBUcmFuc2ZlciB0by9mcm9tIG1lbW9yeSB2aWEgRGF0YSBMaW5lLlxyXG4vL1xyXG4vLyBbTUFSIFJlZ2lzdGVyXVxyXG4vLyBBY2Nlc3MgbWVtb3J5IHZpYSBBZGRyZXNzIExpbmVcclxuLy9cclxuLy8gW1BDIFJlZ2lzdGVyXVxyXG4vLyBJbmNyZW1lbnQgdmlhIFBDIDwtIFBDICsgMVxyXG4vL1xyXG4vLyBbSVIgUmVnaXN0ZXJdXHJcbi8vIEhvbGRzIHRoZSBvcGNvZGUgb2YgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24uXHJcbi8vXHJcbi8vIFtBQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBBQyA8LSBBQyArIDEgb3IgQUMgPC0gQUMgKyBSYVxyXG4vLyBEZWNyZW1lbnQgdmlhIEFDIDwtIEFDIC0gMSBvciBBQyA8LSBBQyAtIFJhXHJcbi8vXHJcbi8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4vLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbi8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4vLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4vLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbmltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIkAvTWVtb3J5XCI7XHJcbmltcG9ydCB7IE1lbW9yeUFjY2VzcywgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuaW1wb3J0IHsgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQgeyBDZW50cmFsUHJvY2Vzc2luZ1VuaXQgfSBmcm9tIFwiQC9DZW50cmFsUHJvY2Vzc2luZ1VuaXRcIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NVIH0gZnJvbSBcIi4vUHNldWRvQ1VcIjtcclxuaW1wb3J0IHsgUHNldWRvQUxVIH0gZnJvbSBcIi4vUHNldWRvQUxVXCI7XHJcblxyXG5leHBvcnQgdHlwZSBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUgPSB7XHJcbiAgICBQQzogUmVnaXN0ZXIsXHJcbiAgICBJUjogUmVnaXN0ZXIsXHJcbiAgICBBQzogUmVnaXN0ZXIsXHJcbiAgICBNRFI6IFJlZ2lzdGVyLFxyXG4gICAgTUFSOiBSZWdpc3RlcixcclxuICAgIEFMVTogUHNldWRvQUxVLFxyXG4gICAgUFJPRzogTWVtb3J5LFxyXG4gICAgREFUQTogTWVtb3J5LFxyXG4gICAgTTogTWVtb3J5TWFwLFxyXG4gICAgQ1U6IENvbnRyb2xVbml0XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DUFUgaW1wbGVtZW50cyBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUsIENlbnRyYWxQcm9jZXNzaW5nVW5pdCB7XHJcbiAgICBwdWJsaWMgc3RhdGljIFdPUkRfU0laRSA9IDE2OyAvLyB3b3JkIHNpemUgaW4gYml0cy5cclxuICAgIHB1YmxpYyBzdGF0aWMgQUREUkVTU19TSVpFID0gMTM7IC8vIGFkZHJlc3Mgc2l6ZSBpbiBiaXRzOyAyKioxMyA9IDB4MjAwMCA9IDgxOTIgYWRkcmVzc2FibGUgd29yZHMgbWVtb3J5LlxyXG4gICAgcHVibGljIHN0YXRpYyBPUENPREVfU0laRSA9IDM7IC8vIG9wY29kZSBzaXplIGluIGJpdHMsIDIqKjMgPSA4IHVuaXF1ZSBvcGNvZGVzLlxyXG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkFNX01FTU9SWV9TSVpFID0gMHgwODsgLy8gYWRkcmVzc2FibGUgd29yZHMgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgc3RhdGljIERBVEFfTUVNT1JZX1NJWkUgPSAweDA4OyAvLyBhZGRyZXNzYWJsZSB3b3JkcyBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPR1JBTV9NRU1PUllfQkVHSU4gPSAweDAwOyAvLyBhZGRyZXNzIG9mIGZpcnN0IHdvcmQgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgREFUQV9NRU1PUllfQkVHSU4gPSBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRTsgLy8gYWRkcmVzcyBvZiBmaXJzdCB3b3JkIG9mIGRhdGEgbWVtb3J5LlxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBQQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgSVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFDOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNRFI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE1BUjogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQUxVOiBQc2V1ZG9BTFU7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPRzogTWVtb3J5O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEE6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBNOiBNZW1vcnlNYXA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQ1U6IENvbnRyb2xVbml0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuUEMgPSBuZXcgUmVnaXN0ZXIoXCJQQ1wiLCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKVxyXG4gICAgICAgIHRoaXMuSVIgPSBuZXcgUmVnaXN0ZXIoXCJJUlwiLCBQc2V1ZG9DUFUuT1BDT0RFX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuQUMgPSBuZXcgUmVnaXN0ZXIoXCJBQ1wiLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLk1EUiA9IG5ldyBSZWdpc3RlcihcIk1EUlwiLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLk1BUiA9IG5ldyBSZWdpc3RlcihcIk1BUlwiLCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKTtcclxuICAgICAgICB0aGlzLkFMVSA9IG5ldyBQc2V1ZG9BTFUodGhpcy5BQywgdGhpcy5NRFIsIFBzZXVkb0NQVS5XT1JEX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuUFJPRyA9IG5ldyBNZW1vcnkoXCJQUk9HXCIsIFBzZXVkb0NQVS5QUk9HUkFNX01FTU9SWV9TSVpFKTtcclxuICAgICAgICB0aGlzLkRBVEEgPSBuZXcgTWVtb3J5KFwiREFUQVwiLCBQc2V1ZG9DUFUuREFUQV9NRU1PUllfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NID0gbmV3IE1lbW9yeU1hcCgpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBNZW1vcnlSYW5nZSh0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRSwgTWVtb3J5QWNjZXNzLlJFQUQsIHRoaXMuUFJPRyk7XHJcbiAgICAgICAgdGhpcy5NLm1hcE1lbW9yeVJhbmdlKHRoaXMuREFUQV9NRU1PUllfQkVHSU4sIFBzZXVkb0NQVS5EQVRBX01FTU9SWV9TSVpFLCBNZW1vcnlBY2Nlc3MuUkVBRF9XUklURSwgdGhpcy5EQVRBKTtcclxuICAgICAgICB0aGlzLkNVID0gbmV3IFBzZXVkb0NVKHRoaXMuSVIsIHRoaXMuUEMsIHRoaXMuQUMsIHRoaXMuTUFSLCB0aGlzLk1EUiwgdGhpcy5BTFUsIHRoaXMuTSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0ZXBJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICB0aGlzLkNVLmZldGNoQW5kRGVjb2RlTmV4dEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5DVS5leGVjdXRlSW5zdHJ1Y3Rpb24oKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHdyaXRlUHJvZ3JhbShzdGFydDogbnVtYmVyLCAuLi5wcm9ncmFtOiBBcnJheTxudW1iZXI+KSB7XHJcbiAgICAgICAgcHJvZ3JhbS5mb3JFYWNoKChpbnN0cnVjdGlvbiwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLlBST0cud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5QUk9HUkFNX01FTU9SWV9CRUdJTiwgaW5zdHJ1Y3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZURhdGEoc3RhcnQ6IG51bWJlciwgLi4uZGF0YTogQXJyYXk8bnVtYmVyPikge1xyXG4gICAgICAgIGRhdGEuZm9yRWFjaCgodmFsdWUsIGFkZHJlc3MpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5EQVRBLndyaXRlKHN0YXJ0ICsgYWRkcmVzcyAtIHRoaXMuREFUQV9NRU1PUllfQkVHSU4sIHZhbHVlKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtSZWdpc3Rlcn0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NQVSB9IGZyb20gXCIuL1BzZXVkb0NQVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9PcENvZGUgfSBmcm9tIFwiLi9Qc2V1ZG9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9BTFUgfSBmcm9tIFwiLi9Qc2V1ZG9BTFVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DVSBpbXBsZW1lbnRzIENvbnRyb2xVbml0IHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2lyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3BjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21hcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWx1OiBQc2V1ZG9BTFU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZW1vcnk6IE1lbW9yeU1hcDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpcjogUmVnaXN0ZXIsIHBjOiBSZWdpc3RlciwgYWM6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCBhbHU6IFBzZXVkb0FMVSwgbWVtb3J5OiBNZW1vcnlNYXApIHtcclxuICAgICAgICB0aGlzLl9pciA9IGlyO1xyXG4gICAgICAgIHRoaXMuX3BjID0gcGM7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX2FsdSA9IGFsdTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkgPSBtZW1vcnk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGVyZm9ybXMgaW5zdHJ1Y3Rpb24gZmV0Y2ggYW5kIGRlY29kZS5cclxuICAgIHB1YmxpYyBmZXRjaEFuZERlY29kZU5leHRJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyBNQVIgPC0gUENcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUodGhpcy5fcGMucmVhZCgpKTtcclxuICAgICAgICAvLyBQQyA8LSBQQyArIDFcclxuICAgICAgICB0aGlzLl9wYy53cml0ZSh0aGlzLl9wYy5yZWFkKCkgKyAxKTtcclxuXHJcbiAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgIHRoaXMuX21kci53cml0ZSh0aGlzLl9tZW1vcnkucmVhZCh0aGlzLl9tYXIucmVhZCgpKSk7XHJcblxyXG4gICAgICAgIC8vIElSIDwtIE1EUihvcGNvZGUpXHJcbiAgICAgICAgbGV0IE9QQ09ERV9TSElGVCA9IFBzZXVkb0NQVS5XT1JEX1NJWkUgLSBQc2V1ZG9DUFUuT1BDT0RFX1NJWkU7XHJcbiAgICAgICAgbGV0IG9wY29kZSA9IHRoaXMuX21kci5yZWFkKCkgPj4gT1BDT0RFX1NISUZUO1xyXG4gICAgICAgIHRoaXMuX2lyLndyaXRlKG9wY29kZSk7XHJcbiAgICAgICAgLy8gTUFSIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IGFkZHJlc3MgPSB0aGlzLl9tZHIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgIHRoaXMuX21hci53cml0ZShhZGRyZXNzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRXhlY3V0ZXMgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24gbG9hZGVkIGludG8gSVIuXHJcbiAgICBwdWJsaWMgZXhlY3V0ZUluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIC8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuICAgICAgICAvLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbiAgICAgICAgLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4gICAgICAgIC8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4gICAgICAgIC8vIFNVQiB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyAtIE1EUlxyXG4gICAgICAgIC8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuICAgICAgICAvLyBTSEZUIHg6IEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAvLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIC8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuICAgICAgICBjb25zdCBbSVIsIFBDLCBBQywgTUFSLCBNRFIsIEFMVSwgTV0gPSBbdGhpcy5faXIsIHRoaXMuX3BjLCB0aGlzLl9hYywgdGhpcy5fbWFyLCB0aGlzLl9tZHIsIHRoaXMuX2FsdSwgdGhpcy5fbWVtb3J5XTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY29weShkc3Q6IFJlZ2lzdGVyLCBzcmM6IFJlZ2lzdGVyKSB7XHJcbiAgICAgICAgICAgIGRzdC53cml0ZShzcmMucmVhZCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgICAgIE1EUi53cml0ZShNLnJlYWQoTUFSLnJlYWQoKSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RvcmUoKSB7XHJcbiAgICAgICAgICAgIE0ud3JpdGUoTUFSLnJlYWQoKSwgTURSLnJlYWQoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBvcGNvZGUgPSBJUi5yZWFkKCk7XHJcbiAgICAgICAgc3dpdGNoIChvcGNvZGUpIHtcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuTERBOiAgICAgIC8vIExEQSB4OlxyXG4gICAgICAgICAgICAgICAgbG9hZCgpOyAgICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgY29weShBQywgTURSKTsgICAgICAgICAgLy8gQUMgPC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU1RBOiAgICAgIC8vIFNUQSB4OlxyXG4gICAgICAgICAgICAgICAgY29weShNRFIsIEFDKTsgICAgICAgICAgLy8gTURSIDwtIEFDXHJcbiAgICAgICAgICAgICAgICBzdG9yZSgpOyAgICAgICAgICAgICAgICAvLyBNW01BUl0gPC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuQUREOiAgICAgIC8vIEFERCB4OlxyXG4gICAgICAgICAgICAgICAgbG9hZCgpOyAgICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLmFkZCgpOyAgICAgICAgICAgICAgLy8gQUMgPC0gQUMgKyBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TVUI6ICAgICAgLy8gU1VCIHg6XHJcbiAgICAgICAgICAgICAgICBsb2FkKCk7ICAgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUuc3ViKCk7ICAgICAgICAgICAgICAvLyBBQyA8LSBBQyAtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLk5BTkQ6ICAgICAvLyBOQU5EIHg6XHJcbiAgICAgICAgICAgICAgICBsb2FkKCk7ICAgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUubmFuZCgpOyAgICAgICAgICAgICAvLyBBQyA8LSB+KEFDICYgTURSKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNIRlQ6ICAgICAvLyBTSEZUOlxyXG4gICAgICAgICAgICAgICAgQUxVLnNoZnQoKTsgICAgICAgICAgICAgLy8gQUMgPC0gQUMgPDwgMVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLko6ICAgICAgICAvLyBKIHg6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE1EUi5yZWFkKCkgJiBBRERSRVNTX01BU0s7XHJcbiAgICAgICAgICAgICAgICBQQy53cml0ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5CTkU6ICAgICAgLy8gQk5FIHg6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoWiAhPSAxKSB0aGVuIFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgICAgICAgICAgaWYgKEFMVS5aICE9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTURSLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICAgICAgICAgICAgICBQQy53cml0ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgYFVua25vd24gb3Bjb2RlOiAke29wY29kZX1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsIi8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4vLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbi8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4vLyBTVUIgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgLSBNRFJcclxuLy8gTkFORCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSB+KEFDICYgTURSKVxyXG4vLyBTSEZUIHg6IEFDIDwtIEFDIDw8IDFcclxuLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG5pbXBvcnQgeyBJbnN0cnVjdGlvbiB9IGZyb20gXCJAL0luc3RydWN0aW9uXCI7XHJcblxyXG5pbXBvcnQgeyBQc2V1ZG9DUFUgfSBmcm9tIFwiLi9Qc2V1ZG9DUFVcIjtcclxuXHJcblxyXG5leHBvcnQgZW51bSBQc2V1ZG9PcENvZGUge1xyXG4gICAgTERBICA9IDBiMDAwLFxyXG4gICAgU1RBICA9IDBiMDAxLFxyXG4gICAgQUREICA9IDBiMDEwLFxyXG4gICAgU1VCICA9IDBiMDExLFxyXG4gICAgTkFORCA9IDBiMTAwLFxyXG4gICAgU0hGVCA9IDBiMTAxLFxyXG4gICAgSiAgICA9IDBiMTEwLFxyXG4gICAgQk5FICA9IDBiMTExXHJcbn1cclxuXHJcbi8vIEluc3RydWN0aW9uIG1lbW9yeSBmb3JtYXQ6XHJcbi8vICAgICAgW0luc3RydWN0aW9uOiBXT1JEX1NJWkVdID0gW29wY29kZTogT1BDT0RFX1NJWkVdIFtvcGVyYW5kOiBBRERSRVNTX1NJWkVdXHJcbi8vIE9wZXJhbmQgdXNhZ2UgaXMgZGVmaW5lZCBieSB0aGUgb3Bjb2RlLlxyXG4vLyBPcGVyYW5kIGFkZHJlc3MgaXMgbG9hZGVkIGludG8gTUFSIGFmdGVyIHRoZSBmZXRjaCBhbmQgZGVjb2RlIGN5Y2xlLlxyXG5leHBvcnQgY2xhc3MgUHNldWRvSW5zdHJ1Y3Rpb24gaW1wbGVtZW50cyBJbnN0cnVjdGlvbiB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3Bjb2RlOiBQc2V1ZG9PcENvZGU7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgb3BlcmFuZDogbnVtYmVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFZBTFVFOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3Bjb2RlOiBQc2V1ZG9PcENvZGUsIG9wZXJhbmQ6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMub3Bjb2RlID0gb3Bjb2RlO1xyXG4gICAgICAgIHRoaXMub3BlcmFuZCA9IG9wZXJhbmQ7XHJcbiAgICAgICAgdGhpcy5WQUxVRSA9ICh0aGlzLm9wY29kZSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSArIHRoaXMub3BlcmFuZDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IExEQSAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuTERBLCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IFNUQSAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuU1RBLCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IEFERCAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuQURELCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IFNVQiAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuU1VCLCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IE5BTkQgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuTkFORCwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBTSEZUICAgPSAoKSAgICAgICAgICAgICAgICA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLlNIRlQsIDApO1xyXG5leHBvcnQgY29uc3QgSiAgICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5KLCAgIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgQk5FICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5CTkUsIG9wZXJhbmQpO1xyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiaW1wb3J0IHsgUHNldWRvQ1BVIH0gZnJvbSBcIkAvUHNldWRvQ1BVL1BzZXVkb0NQVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9PcENvZGUsIExEQSwgU1RBLCBBREQsIFNIRlQsIFBzZXVkb0luc3RydWN0aW9uIH0gZnJvbSBcIkAvUHNldWRvQ1BVL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcblxyXG5mdW5jdGlvbiBtYWluKCkge1xyXG4gICAgLy8gQ29uc3RydWN0IGEgRUNFMzc1IFBzZXVkbyBDUFUsIGZhY3RvcnkgbmV3IVxyXG4gICAgY29uc3QgQ1BVID0gbmV3IFBzZXVkb0NQVSgpO1xyXG5cclxuICAgIC8vIERlZmluZSBsYWJlbHMgaW4gREFUQSBtZW1vcnkuXHJcbiAgICBsZXQgQSA9IENQVS5EQVRBX01FTU9SWV9CRUdJTjtcclxuICAgIGxldCBCID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMTtcclxuICAgIGxldCBDID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMjtcclxuICAgIC8vIFByb2dyYW0sIGNvbXB1dGVzIEMgPSA0KkEgKyBCXHJcbiAgICBjb25zdCBwcm9ncmFtID0gW1xyXG4gICAgICAgIExEQShBKSxcclxuICAgICAgICBTSEZUKCksXHJcbiAgICAgICAgU0hGVCgpLFxyXG4gICAgICAgIEFERChCKSxcclxuICAgICAgICBTVEEoQylcclxuICAgIF0ubWFwKGluc3RydWN0aW9uID0+IGluc3RydWN0aW9uLlZBTFVFKTtcclxuICAgIC8vIFdyaXRlIHByb2dyYW0gdG8gbWVtb3J5LlxyXG4gICAgQ1BVLndyaXRlUHJvZ3JhbSgwLCAuLi5wcm9ncmFtKTtcclxuICAgIC8vIEluaXRpYWwgdmFsdWVzOiBBID0gMjAsIEIgPSAyMCwgQyA9IDAuXHJcbiAgICBDUFUud3JpdGVEYXRhKEEsIDIwKTtcclxuICAgIENQVS53cml0ZURhdGEoQiwgMjEpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHByaW50Q1BVKCkge1xyXG4gICAgICAgIGNvbnN0IHByaW50ID0gKC4uLmFyZ3M6IEFycmF5PHsgdG9TdHJpbmcoKTogc3RyaW5nIH0+KSA9PiBjb25zb2xlLmxvZyguLi5hcmdzLm1hcCh2YWx1ZSA9PiB2YWx1ZS50b1N0cmluZygpKSk7XHJcbiAgICAgICAgY29uc3QgeyBQQywgSVIsIEFDLCBNRFIsIE1BUiwgQUxVLCBQUk9HLCBEQVRBLCBNLCBDVSB9ID0gQ1BVO1xyXG4gICAgICAgIHByaW50KFBDKTtcclxuICAgICAgICBwcmludChJUiwgXCI9PlwiLCBQc2V1ZG9PcENvZGVbSVIucmVhZCgpXSk7XHJcbiAgICAgICAgcHJpbnQoQUMsIFwiPT5cIiwgQUMucmVhZCgpKTtcclxuICAgICAgICBwcmludChgWj0ke0FMVS5afWApO1xyXG4gICAgICAgIHByaW50KE1EUiwgXCI9PlwiLCBNRFIucmVhZCgpKTtcclxuICAgICAgICBwcmludChNQVIpO1xyXG4gICAgICAgIHByaW50KGA9PSAke1BST0cuTkFNRX0gbWVtb3J5YClcclxuICAgICAgICBwcmludChQUk9HKTtcclxuICAgICAgICBwcmludChgPT0gJHtEQVRBLk5BTUV9IG1lbW9yeWApXHJcbiAgICAgICAgcHJpbnQoREFUQSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBTVEVQX0NPVU5UID0gcHJvZ3JhbS5sZW5ndGg7XHJcbiAgICBjb25zb2xlLmxvZyhcIj09IEluaXRpYWwgU3RhdGVcIik7XHJcbiAgICBwcmludENQVSgpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBTVEVQX0NPVU5UOyBpKyspIHtcclxuICAgICAgICBDUFUuc3RlcEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgcHJpbnRDUFUoKTtcclxuICAgIH1cclxufVxyXG5cclxubWFpbigpOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==