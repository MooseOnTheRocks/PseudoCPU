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
        this.M = new MemoryMap_1.MemoryMap(this.MDR, this.MAR);
        this.M.mapExternalMemory(this.PROGRAM_MEMORY_BEGIN, PseudoCPU.PROGRAM_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ, this.PROG);
        this.M.mapExternalMemory(this.DATA_MEMORY_BEGIN, PseudoCPU.DATA_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ_WRITE, this.DATA);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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L0IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO1FBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNaLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDaEMsUUFBUSxFQUFFLENBQUM7SUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN0QixRQUFRLEVBQUUsQ0FBQztLQUNkO0FBQ0wsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnkudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnlNYXAudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9SZWdpc3Rlci50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9BTFUudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvQ1BVLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0NVLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0luc3RydWN0aW9uLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgTWVtb3J5IHtcclxuICAgIHB1YmxpYyByZWFkb25seSBOQU1FOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgU0laRTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZGF0YTogQXJyYXk8bnVtYmVyPjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gbmV3IEFycmF5PG51bWJlcj4odGhpcy5TSVpFKTtcclxuICAgICAgICB0aGlzLl9kYXRhLmZpbGwoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgZGF0YTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YVthZGRyZXNzXSA9IGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVthZGRyZXNzXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcod2l0aE9mZnNldD86IG51bWJlcikge1xyXG4gICAgICAgIGxldCBsaW5lcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5TSVpFOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSB3aXRoT2Zmc2V0ID8gaSArIHdpdGhPZmZzZXQgOiBpO1xyXG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAweCR7YWRkcmVzcy50b1N0cmluZygxNil9OiAweCR7dGhpcy5fZGF0YVtpXS50b1N0cmluZygxNil9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUmVnaXN0ZXIgfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnkgfSBmcm9tIFwiQC9NZW1vcnlcIjtcclxuXHJcbmV4cG9ydCB0eXBlIE1lbW9yeU1hcHBpbmcgPSB7XHJcbiAgICByZWFkOiAoYWRkcmVzczogbnVtYmVyKSA9PiBudW1iZXIsXHJcbiAgICB3cml0ZTogKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikgPT4gdm9pZFxyXG59XHJcblxyXG5leHBvcnQgZW51bSBNZW1vcnlBY2Nlc3Mge1xyXG4gICAgUkVBRCxcclxuICAgIFdSSVRFLFxyXG4gICAgUkVBRF9XUklURVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWVtb3J5TWFwIHtcclxuICAgIC8vIEEgbWFwIGZyb20gYWRkcmVzcyByYW5nZSBbc3RhcnQsIGVuZF0gdG8gYSByZWFkL3dyaXRhYmxlIG1lbW9yeSBsb2NhdGlvbi5cclxuICAgIHByaXZhdGUgbWFwcGluZ3M6IE1hcDxbc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXJdLCBNZW1vcnlNYXBwaW5nPjtcclxuICAgIHByaXZhdGUgX21kcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIF9tYXI6IFJlZ2lzdGVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1kcjogUmVnaXN0ZXIsIG1hcjogUmVnaXN0ZXIpIHtcclxuICAgICAgICB0aGlzLl9tZHIgPSBtZHI7XHJcbiAgICAgICAgdGhpcy5fbWFyID0gbWFyO1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3MgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmaW5kQWRkcmVzc01hcHBpbmcoYWRkcmVzczogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IHJhbmdlcyA9IFsuLi50aGlzLm1hcHBpbmdzLmtleXMoKV07XHJcbiAgICAgICAgbGV0IGtleSA9IHJhbmdlcy5maW5kKHJhbmdlID0+IGFkZHJlc3MgPj0gcmFuZ2VbMF0gJiYgYWRkcmVzcyA8PSByYW5nZVsxXSk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSBrZXkgPyB0aGlzLm1hcHBpbmdzLmdldChrZXkpIDogdW5kZWZpbmVkO1xyXG4gICAgICAgIHJldHVybiBtYXBwaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsb2FkKCkge1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWFyLnJlYWQoKTtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIGxvYWQoKSBmcm9tIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSBtYXBwaW5nLnJlYWQoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgIHRoaXMuX21kci53cml0ZShkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0b3JlKCkge1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWFyLnJlYWQoKTtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHN0b3JlKCkgdG8gdW5tYXBwZWQgbWVtb3J5XCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX21kci5yZWFkKCk7XHJcbiAgICAgICAgICAgIG1hcHBpbmcud3JpdGUoYWRkcmVzcywgZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXBFeHRlcm5hbE1lbW9yeShzdGFydDogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgbW9kZTogTWVtb3J5QWNjZXNzLCBNOiBNZW1vcnkpIHtcclxuICAgICAgICBmdW5jdGlvbiByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgICAgIGlmIChtb2RlID09PSBNZW1vcnlBY2Nlc3MuV1JJVEUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byByZWFkKCkgZnJvbSBXUklURS1vbmx5IG1lbW9yeVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIE0ucmVhZChhZGRyZXNzIC0gc3RhcnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGUoYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2RlID09PSBNZW1vcnlBY2Nlc3MuUkVBRCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHdyaXRlKCkgdG8gUkVBRC1vbmx5IG1lbW9yeVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgTS53cml0ZShhZGRyZXNzIC0gc3RhcnQsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdID0gW3N0YXJ0LCBzdGFydCArIGxlbmd0aCAtIDFdO1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3Muc2V0KHJhbmdlLCB7IHJlYWQsIHdyaXRlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXBSZWdpc3RlcihhOiBudW1iZXIsIFI6IFJlZ2lzdGVyKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICByZXR1cm4gUi5yZWFkKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZShhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICAgICAgUi53cml0ZSh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCByYW5nZTogW251bWJlciwgbnVtYmVyXSA9IFthLCBhXTtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzLnNldChyYW5nZSwgeyByZWFkLCB3cml0ZSB9KTtcclxuICAgIH1cclxufSIsImV4cG9ydCBjbGFzcyBSZWdpc3RlciB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTkFNRTogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RhdGE6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpIHtcclxuICAgICAgICByZXR1cm4gYCR7dGhpcy5OQU1FfTwweCR7dGhpcy5fZGF0YS50b1N0cmluZygxNil9PmA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0FMVSB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgV09SRF9TSVpFO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWM6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3o6IFJlZ2lzdGVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFjOiBSZWdpc3RlciwgbWRyOiBSZWdpc3Rlciwgd29yZFNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2FjID0gYWM7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuV09SRF9TSVpFID0gd29yZFNpemU7XHJcbiAgICAgICAgdGhpcy5feiA9IG5ldyBSZWdpc3RlcihcIlpcIiwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBaKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3oucmVhZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQgWih2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fei53cml0ZSh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgc3VtID0gKHRoaXMuX2FjLnJlYWQoKSArIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHN1bSk7XHJcbiAgICAgICAgdGhpcy5aID0gc3VtID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN1YigpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgZGlmZmVyZW5jZSA9ICh0aGlzLl9hYy5yZWFkKCkgLSB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShkaWZmZXJlbmNlKTtcclxuICAgICAgICB0aGlzLlogPSBkaWZmZXJlbmNlID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hbmQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IH4odGhpcy5fYWMucmVhZCgpICYgdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUocmVzdWx0KTtcclxuICAgICAgICB0aGlzLlogPSByZXN1bHQgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hmdCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gKHRoaXMuX2FjLnJlYWQoKSA8PCAxKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuWiA9IHJlc3VsdCA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG59IiwiLy8gPT0gUHNldWRvSVNBXHJcbi8vIC0tIERhdGEgVHJhbnNmZXIgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0xvYWQgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIExEQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIExvYWRzIGEgbWVtb3J5IHdvcmQgdG8gdGhlIEFDLlxyXG4vLyAgICAgIFtTdG9yZSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1RBIHg7IHggaXMgYSBtZW1vcnkgbG9jYXRpb25cclxuLy8gICAgICAgICAgU3RvcmVzIHRoZSBjb250ZW50IG9mIHRoZSBBQyB0byBtZW1vcnkuXHJcbi8vIC0tIEFyaXRobWV0aWMgYW5kIExvZ2ljYWwgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0FkZCB0byBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgQUREIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBBZGRzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWQgYnlcclxuLy8gICAgICAgICAgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIHRvIHRoZSBjb250ZW50IGluIHRoZSBBQy5cclxuLy8gICAgICBbU3VidHJhY3QgZnJvbSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1VCIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBTdWJ0cmFjdHMgdGhlIGNvbnRlbnQgb2YgdGhlIG1lbW9yeSB3b3JkIHNwZWNpZmllZFxyXG4vLyAgICAgICAgICBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgZnJvbSB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW0xvZ2ljYWwgTkFORCB3aXRoIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBOQU5EIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBQZXJmb3JtcyBsb2dpY2FsIE5BTkQgYmV0d2VlbiB0aGUgY29udGVudHMgb2YgdGhlIG1lbW9yeVxyXG4vLyAgICAgICAgICB3b3JkIHNwZWNpZmllZCBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgYW5kIHRoZSBBQy5cclxuLy8gICAgICBbU2hpZnRdXHJcbi8vICAgICAgICAgIFNIRlRcclxuLy8gICAgICAgICAgVGhlIGNvbnRlbnQgb2YgQUMgaXMgc2hpZnRlZCBsZWZ0IGJ5IG9uZSBiaXQuXHJcbi8vICAgICAgICAgIFRoZSBiaXQgc2hpZnRlZCBpbiBpcyAwLlxyXG4vLyAtLSBDb250cm9sIFRyYW5zZmVyXHJcbi8vICAgICAgW0p1bXBdXHJcbi8vICAgICAgICAgIEogeDsgSnVtcCB0byBpbnN0cnVjdGlvbiBpbiBtZW1vcnkgbG9jYXRpb24geC5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MuXHJcbi8vICAgICAgW0JORV1cclxuLy8gICAgICAgICAgQk5FIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHggaWYgY29udGVudCBvZiBBQyBpcyBub3QgemVyby5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MgaWYgWiAhPSAwLlxyXG4vLyBcclxuLy8gPT0gUHNldWRvQ1BVIE1pY3JvLW9wZXJhdGlvbnNcclxuLy8gLS0gU3RvcmUvTG9hZCBtZW1vcnlcclxuLy8gICAgICBNW01BUl0gPC0gTURSXHJcbi8vICAgICAgTURSIDwtIE1bTUFSXVxyXG4vLyAtLSBDb3B5IHJlZ2lzdGVyXHJcbi8vICAgICAgUmEgPC0gUmJcclxuLy8gLS0gUmVnaXN0ZXIgaW5jcmVtZW50L2RlY3JlbWVudFxyXG4vLyAgICAgIFJhIDwtIFJhICsgMVxyXG4vLyAgICAgIFJhIDwtIFJhIC0gMVxyXG4vLyAgICAgIFJhIDwtIFJhICsgUmJcclxuLy8gICAgICBSYSA8LSBSYSAtIFJiXHJcbi8vXHJcbi8vID09IE1pbmltYWwgQ29tcG9uZW50c1xyXG4vLyBbTWVtb3J5XVxyXG4vLyBBZGRyZXNzYWJsZSBieSBBZGRyZXNzIExpbmUgdmlhIE1bTUFSXVxyXG4vLyBXcml0YWJsZSBieSBBZGRyZXNzIExpbmUgJiBEYXRhIExpbmUgdmlhIE1bTUFSXSA8LSBNRFJcclxuLy8gUmVhZGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNRFIgPC0gTVtNQVJdXHJcbi8vIE5lZWQgdHdvIG1lbW9yaWVzOiBwcm9ncmFtIG1lbW9yeSAocmVhZCBvbmx5KSBhbmQgZGF0YSBtZW1vcnkgKHJlYWQgJiB3cml0ZSkuXHJcbi8vXHJcbi8vIFtBTFVdXHJcbi8vIFBlcmZvcm1zIGFyaXRobWV0aWMgb3BlcmF0aW9ucywgb2Z0ZW4gaW52b2x2aW5nIHRoZSBBQyByZWdpc3Rlci5cclxuLy8gQUMgPC0gQUMgKyAxXHJcbi8vIEFDIDwtIEFDICsgUkFcclxuLy8gQUMgPC0gQUMgLSAxXHJcbi8vIEFDIDwtIEFDIC0gUkFcclxuLy9cclxuLy8gW0NvbnRyb2wgVW5pdF1cclxuLy8gRXhlY3V0ZXMgaW5zdHJ1Y3Rpb25zIGFuZCBzZXF1ZW5jZXMgbWljcm9vcGVyYXRpb25zLlxyXG4vL1xyXG4vLyBbTURSIFJlZ2lzdGVyXVxyXG4vLyBUcmFuc2ZlciB0by9mcm9tIG1lbW9yeSB2aWEgRGF0YSBMaW5lLlxyXG4vL1xyXG4vLyBbTUFSIFJlZ2lzdGVyXVxyXG4vLyBBY2Nlc3MgbWVtb3J5IHZpYSBBZGRyZXNzIExpbmVcclxuLy9cclxuLy8gW1BDIFJlZ2lzdGVyXVxyXG4vLyBJbmNyZW1lbnQgdmlhIFBDIDwtIFBDICsgMVxyXG4vL1xyXG4vLyBbSVIgUmVnaXN0ZXJdXHJcbi8vIEhvbGRzIHRoZSBvcGNvZGUgb2YgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24uXHJcbi8vXHJcbi8vIFtBQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBBQyA8LSBBQyArIDEgb3IgQUMgPC0gQUMgKyBSYVxyXG4vLyBEZWNyZW1lbnQgdmlhIEFDIDwtIEFDIC0gMSBvciBBQyA8LSBBQyAtIFJhXHJcbi8vXHJcbi8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4vLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbi8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4vLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4vLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbmltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIkAvTWVtb3J5XCI7XHJcbmltcG9ydCB7IE1lbW9yeUFjY2VzcywgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuaW1wb3J0IHsgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQgeyBDZW50cmFsUHJvY2Vzc2luZ1VuaXQgfSBmcm9tIFwiQC9DZW50cmFsUHJvY2Vzc2luZ1VuaXRcIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NVIH0gZnJvbSBcIi4vUHNldWRvQ1VcIjtcclxuaW1wb3J0IHsgUHNldWRvQUxVIH0gZnJvbSBcIi4vUHNldWRvQUxVXCI7XHJcblxyXG5leHBvcnQgdHlwZSBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUgPSB7XHJcbiAgICBQQzogUmVnaXN0ZXIsXHJcbiAgICBJUjogUmVnaXN0ZXIsXHJcbiAgICBBQzogUmVnaXN0ZXIsXHJcbiAgICBNRFI6IFJlZ2lzdGVyLFxyXG4gICAgTUFSOiBSZWdpc3RlcixcclxuICAgIEFMVTogUHNldWRvQUxVLFxyXG4gICAgUFJPRzogTWVtb3J5LFxyXG4gICAgREFUQTogTWVtb3J5LFxyXG4gICAgTTogTWVtb3J5TWFwLFxyXG4gICAgQ1U6IENvbnRyb2xVbml0XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DUFUgaW1wbGVtZW50cyBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUsIENlbnRyYWxQcm9jZXNzaW5nVW5pdCB7XHJcbiAgICBwdWJsaWMgc3RhdGljIFdPUkRfU0laRSA9IDE2OyAvLyB3b3JkIHNpemUgaW4gYml0cy5cclxuICAgIHB1YmxpYyBzdGF0aWMgQUREUkVTU19TSVpFID0gMTM7IC8vIGFkZHJlc3Mgc2l6ZSBpbiBiaXRzOyAyKioxMyA9IDB4MjAwMCA9IDgxOTIgYWRkcmVzc2FibGUgd29yZHMgbWVtb3J5LlxyXG4gICAgcHVibGljIHN0YXRpYyBPUENPREVfU0laRSA9IDM7IC8vIG9wY29kZSBzaXplIGluIGJpdHMsIDIqKjMgPSA4IHVuaXF1ZSBvcGNvZGVzLlxyXG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkFNX01FTU9SWV9TSVpFID0gMHgwODsgLy8gYWRkcmVzc2FibGUgd29yZHMgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgc3RhdGljIERBVEFfTUVNT1JZX1NJWkUgPSAweDA4OyAvLyBhZGRyZXNzYWJsZSB3b3JkcyBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPR1JBTV9NRU1PUllfQkVHSU4gPSAweDAwOyAvLyBhZGRyZXNzIG9mIGZpcnN0IHdvcmQgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgREFUQV9NRU1PUllfQkVHSU4gPSBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRTsgLy8gYWRkcmVzcyBvZiBmaXJzdCB3b3JkIG9mIGRhdGEgbWVtb3J5LlxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBQQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgSVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFDOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNRFI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE1BUjogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQUxVOiBQc2V1ZG9BTFU7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPRzogTWVtb3J5O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEE6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBNOiBNZW1vcnlNYXA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQ1U6IENvbnRyb2xVbml0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuUEMgPSBuZXcgUmVnaXN0ZXIoXCJQQ1wiLCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKVxyXG4gICAgICAgIHRoaXMuSVIgPSBuZXcgUmVnaXN0ZXIoXCJJUlwiLCBQc2V1ZG9DUFUuT1BDT0RFX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuQUMgPSBuZXcgUmVnaXN0ZXIoXCJBQ1wiLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLk1EUiA9IG5ldyBSZWdpc3RlcihcIk1EUlwiLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLk1BUiA9IG5ldyBSZWdpc3RlcihcIk1BUlwiLCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKTtcclxuICAgICAgICB0aGlzLkFMVSA9IG5ldyBQc2V1ZG9BTFUodGhpcy5BQywgdGhpcy5NRFIsIFBzZXVkb0NQVS5XT1JEX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuUFJPRyA9IG5ldyBNZW1vcnkoXCJQUk9HXCIsIFBzZXVkb0NQVS5QUk9HUkFNX01FTU9SWV9TSVpFKTtcclxuICAgICAgICB0aGlzLkRBVEEgPSBuZXcgTWVtb3J5KFwiREFUQVwiLCBQc2V1ZG9DUFUuREFUQV9NRU1PUllfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NID0gbmV3IE1lbW9yeU1hcCh0aGlzLk1EUiwgdGhpcy5NQVIpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBFeHRlcm5hbE1lbW9yeSh0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRSwgTWVtb3J5QWNjZXNzLlJFQUQsIHRoaXMuUFJPRyk7XHJcbiAgICAgICAgdGhpcy5NLm1hcEV4dGVybmFsTWVtb3J5KHRoaXMuREFUQV9NRU1PUllfQkVHSU4sIFBzZXVkb0NQVS5EQVRBX01FTU9SWV9TSVpFLCBNZW1vcnlBY2Nlc3MuUkVBRF9XUklURSwgdGhpcy5EQVRBKTtcclxuICAgICAgICB0aGlzLkNVID0gbmV3IFBzZXVkb0NVKHRoaXMuSVIsIHRoaXMuUEMsIHRoaXMuQUMsIHRoaXMuTUFSLCB0aGlzLk1EUiwgdGhpcy5BTFUsIHRoaXMuTSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0ZXBJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICB0aGlzLkNVLmZldGNoQW5kRGVjb2RlTmV4dEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5DVS5leGVjdXRlSW5zdHJ1Y3Rpb24oKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHdyaXRlUHJvZ3JhbShzdGFydDogbnVtYmVyLCAuLi5wcm9ncmFtOiBBcnJheTxudW1iZXI+KSB7XHJcbiAgICAgICAgcHJvZ3JhbS5mb3JFYWNoKChpbnN0cnVjdGlvbiwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLlBST0cud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5QUk9HUkFNX01FTU9SWV9CRUdJTiwgaW5zdHJ1Y3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZURhdGEoc3RhcnQ6IG51bWJlciwgLi4uZGF0YTogQXJyYXk8bnVtYmVyPikge1xyXG4gICAgICAgIGRhdGEuZm9yRWFjaCgodmFsdWUsIGFkZHJlc3MpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5EQVRBLndyaXRlKHN0YXJ0ICsgYWRkcmVzcyAtIHRoaXMuREFUQV9NRU1PUllfQkVHSU4sIHZhbHVlKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtSZWdpc3Rlcn0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NQVSB9IGZyb20gXCIuL1BzZXVkb0NQVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9PcENvZGUgfSBmcm9tIFwiLi9Qc2V1ZG9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9BTFUgfSBmcm9tIFwiLi9Qc2V1ZG9BTFVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DVSBpbXBsZW1lbnRzIENvbnRyb2xVbml0IHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2lyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3BjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21hcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWx1OiBQc2V1ZG9BTFU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZW1vcnk6IE1lbW9yeU1hcDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpcjogUmVnaXN0ZXIsIHBjOiBSZWdpc3RlciwgYWM6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCBhbHU6IFBzZXVkb0FMVSwgbWVtb3J5OiBNZW1vcnlNYXApIHtcclxuICAgICAgICB0aGlzLl9pciA9IGlyO1xyXG4gICAgICAgIHRoaXMuX3BjID0gcGM7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX2FsdSA9IGFsdTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkgPSBtZW1vcnk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGVyZm9ybXMgaW5zdHJ1Y3Rpb24gZmV0Y2ggYW5kIGRlY29kZS5cclxuICAgIHB1YmxpYyBmZXRjaEFuZERlY29kZU5leHRJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyBNQVIgPC0gUENcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUodGhpcy5fcGMucmVhZCgpKTtcclxuICAgICAgICAvLyBQQyA8LSBQQyArIDFcclxuICAgICAgICB0aGlzLl9wYy53cml0ZSh0aGlzLl9wYy5yZWFkKCkgKyAxKTtcclxuXHJcbiAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgIHRoaXMuX21lbW9yeS5sb2FkKCk7XHJcblxyXG4gICAgICAgIC8vIElSIDwtIE1EUihvcGNvZGUpXHJcbiAgICAgICAgbGV0IE9QQ09ERV9TSElGVCA9IFBzZXVkb0NQVS5XT1JEX1NJWkUgLSBQc2V1ZG9DUFUuT1BDT0RFX1NJWkU7XHJcbiAgICAgICAgbGV0IG9wY29kZSA9IHRoaXMuX21kci5yZWFkKCkgPj4gT1BDT0RFX1NISUZUO1xyXG4gICAgICAgIHRoaXMuX2lyLndyaXRlKG9wY29kZSk7XHJcbiAgICAgICAgLy8gTUFSIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IGFkZHJlc3MgPSB0aGlzLl9tZHIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgIHRoaXMuX21hci53cml0ZShhZGRyZXNzKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRXhlY3V0ZXMgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24gbG9hZGVkIGludG8gSVIuXHJcbiAgICBwdWJsaWMgZXhlY3V0ZUluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIC8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuICAgICAgICAvLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbiAgICAgICAgLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4gICAgICAgIC8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4gICAgICAgIC8vIFNVQiB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyAtIE1EUlxyXG4gICAgICAgIC8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuICAgICAgICAvLyBTSEZUIHg6IEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAvLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgIC8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuICAgICAgICBjb25zdCBbSVIsIFBDLCBBQywgTUFSLCBNRFIsIEFMVSwgTV0gPSBbdGhpcy5faXIsIHRoaXMuX3BjLCB0aGlzLl9hYywgdGhpcy5fbWFyLCB0aGlzLl9tZHIsIHRoaXMuX2FsdSwgdGhpcy5fbWVtb3J5XTtcclxuXHJcbiAgICAgICAgY29uc3QgY29weSA9IChkc3Q6IFJlZ2lzdGVyLCBzcmM6IFJlZ2lzdGVyKSA9PiBkc3Qud3JpdGUoc3JjLnJlYWQoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IG9wY29kZSA9IElSLnJlYWQoKTtcclxuICAgICAgICBzd2l0Y2ggKG9wY29kZSkge1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5MREE6ICAgICAgLy8gTERBIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBjb3B5KEFDLCBNRFIpOyAgICAgICAgICAvLyBBQyA8LSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TVEE6ICAgICAgLy8gU1RBIHg6XHJcbiAgICAgICAgICAgICAgICBjb3B5KE1EUiwgQUMpOyAgICAgICAgICAvLyBNRFIgPC0gQUNcclxuICAgICAgICAgICAgICAgIE0uc3RvcmUoKTsgICAgICAgICAgICAgIC8vIE1bTUFSXSA8LSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5BREQ6ICAgICAgLy8gQUREIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUuYWRkKCk7ICAgICAgICAgICAgICAvLyBBQyA8LSBBQyArIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNVQjogICAgICAvLyBTVUIgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5zdWIoKTsgICAgICAgICAgICAgIC8vIEFDIDwtIEFDIC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuTkFORDogICAgIC8vIE5BTkQgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5uYW5kKCk7ICAgICAgICAgICAgIC8vIEFDIDwtIH4oQUMgJiBNRFIpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU0hGVDogICAgIC8vIFNIRlQ6XHJcbiAgICAgICAgICAgICAgICBBTFUuc2hmdCgpOyAgICAgICAgICAgICAvLyBBQyA8LSBBQyA8PCAxXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuSjogICAgICAgIC8vIEogeDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgICAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpIC0gMTtcclxuICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTURSLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICAgICAgICAgIFBDLndyaXRlKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkJORTogICAgICAvLyBCTkUgeDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChaICE9IDEpIHRoZW4gUEMgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICBpZiAoQUxVLlogIT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSBNRFIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgICAgICAgICAgICAgIFBDLndyaXRlKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBgVW5rbm93biBvcGNvZGU6ICR7b3Bjb2RlfWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8gPT0gUHNldWRvQ1BVIEluc3RydWN0aW9uc1xyXG4vLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbi8vIFNUQSB4OiBNRFIgPC0gQUMsIE1bTUFSXSA8LSBNRFJcclxuLy8gQUREIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDICsgTURSXHJcbi8vIFNVQiB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyAtIE1EUlxyXG4vLyBOQU5EIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIH4oQUMgJiBNRFIpXHJcbi8vIFNIRlQgeDogQUMgPC0gQUMgPDwgMVxyXG4vLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4vLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbmltcG9ydCB7IEluc3RydWN0aW9uIH0gZnJvbSBcIkAvSW5zdHJ1Y3Rpb25cIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NQVSB9IGZyb20gXCIuL1BzZXVkb0NQVVwiO1xyXG5cclxuXHJcbmV4cG9ydCBlbnVtIFBzZXVkb09wQ29kZSB7XHJcbiAgICBMREEgID0gMGIwMDAsXHJcbiAgICBTVEEgID0gMGIwMDEsXHJcbiAgICBBREQgID0gMGIwMTAsXHJcbiAgICBTVUIgID0gMGIwMTEsXHJcbiAgICBOQU5EID0gMGIxMDAsXHJcbiAgICBTSEZUID0gMGIxMDEsXHJcbiAgICBKICAgID0gMGIxMTAsXHJcbiAgICBCTkUgID0gMGIxMTFcclxufVxyXG5cclxuLy8gSW5zdHJ1Y3Rpb24gbWVtb3J5IGZvcm1hdDpcclxuLy8gICAgICBbSW5zdHJ1Y3Rpb246IFdPUkRfU0laRV0gPSBbb3Bjb2RlOiBPUENPREVfU0laRV0gW29wZXJhbmQ6IEFERFJFU1NfU0laRV1cclxuLy8gT3BlcmFuZCB1c2FnZSBpcyBkZWZpbmVkIGJ5IHRoZSBvcGNvZGUuXHJcbi8vIE9wZXJhbmQgYWRkcmVzcyBpcyBsb2FkZWQgaW50byBNQVIgYWZ0ZXIgdGhlIGZldGNoIGFuZCBkZWNvZGUgY3ljbGUuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9JbnN0cnVjdGlvbiBpbXBsZW1lbnRzIEluc3RydWN0aW9uIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBvcGNvZGU6IFBzZXVkb09wQ29kZTtcclxuICAgIHB1YmxpYyByZWFkb25seSBvcGVyYW5kOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgVkFMVUU6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihvcGNvZGU6IFBzZXVkb09wQ29kZSwgb3BlcmFuZDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5vcGNvZGUgPSBvcGNvZGU7XHJcbiAgICAgICAgdGhpcy5vcGVyYW5kID0gb3BlcmFuZDtcclxuICAgICAgICB0aGlzLlZBTFVFID0gKHRoaXMub3Bjb2RlIDw8IFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpICsgdGhpcy5vcGVyYW5kO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgTERBICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5MREEsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU1RBICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5TVEEsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgQUREICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5BREQsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU1VCICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5TVUIsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgTkFORCAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5OQU5ELCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IFNIRlQgICA9ICgpICAgICAgICAgICAgICAgID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuU0hGVCwgMCk7XHJcbmV4cG9ydCBjb25zdCBKICAgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkosICAgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBCTkUgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkJORSwgb3BlcmFuZCk7XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJpbXBvcnQgeyBQc2V1ZG9DUFUgfSBmcm9tIFwiQC9Qc2V1ZG9DUFUvUHNldWRvQ1BVXCI7XHJcbmltcG9ydCB7IFBzZXVkb09wQ29kZSwgTERBLCBTVEEsIEFERCwgU0hGVCwgUHNldWRvSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9Qc2V1ZG9DUFUvUHNldWRvSW5zdHJ1Y3Rpb25cIjtcclxuXHJcbmZ1bmN0aW9uIG1haW4oKSB7XHJcbiAgICAvLyBDb25zdHJ1Y3QgYSBFQ0UzNzUgUHNldWRvIENQVSwgZmFjdG9yeSBuZXchXHJcbiAgICBjb25zdCBDUFUgPSBuZXcgUHNldWRvQ1BVKCk7XHJcblxyXG4gICAgLy8gRGVmaW5lIGxhYmVscyBpbiBEQVRBIG1lbW9yeS5cclxuICAgIGxldCBBID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOO1xyXG4gICAgbGV0IEIgPSBDUFUuREFUQV9NRU1PUllfQkVHSU4gKyAxO1xyXG4gICAgbGV0IEMgPSBDUFUuREFUQV9NRU1PUllfQkVHSU4gKyAyO1xyXG4gICAgLy8gUHJvZ3JhbSwgY29tcHV0ZXMgQyA9IDQqQSArIEJcclxuICAgIGNvbnN0IHByb2dyYW0gPSBbXHJcbiAgICAgICAgTERBKEEpLFxyXG4gICAgICAgIFNIRlQoKSxcclxuICAgICAgICBTSEZUKCksXHJcbiAgICAgICAgQUREKEIpLFxyXG4gICAgICAgIFNUQShDKVxyXG4gICAgXS5tYXAoaW5zdHJ1Y3Rpb24gPT4gaW5zdHJ1Y3Rpb24uVkFMVUUpO1xyXG4gICAgLy8gV3JpdGUgcHJvZ3JhbSB0byBtZW1vcnkuXHJcbiAgICBDUFUud3JpdGVQcm9ncmFtKDAsIC4uLnByb2dyYW0pO1xyXG4gICAgLy8gSW5pdGlhbCB2YWx1ZXM6IEEgPSAyMCwgQiA9IDIwLCBDID0gMC5cclxuICAgIENQVS53cml0ZURhdGEoQSwgMjApO1xyXG4gICAgQ1BVLndyaXRlRGF0YShCLCAyMSk7XHJcblxyXG4gICAgZnVuY3Rpb24gcHJpbnRDUFUoKSB7XHJcbiAgICAgICAgY29uc3QgcHJpbnQgPSAoLi4uYXJnczogQXJyYXk8eyB0b1N0cmluZygpOiBzdHJpbmcgfT4pID0+IGNvbnNvbGUubG9nKC4uLmFyZ3MubWFwKHZhbHVlID0+IHZhbHVlLnRvU3RyaW5nKCkpKTtcclxuICAgICAgICBjb25zdCB7IFBDLCBJUiwgQUMsIE1EUiwgTUFSLCBBTFUsIFBST0csIERBVEEsIE0sIENVIH0gPSBDUFU7XHJcbiAgICAgICAgcHJpbnQoUEMpO1xyXG4gICAgICAgIHByaW50KElSLCBcIj0+XCIsIFBzZXVkb09wQ29kZVtJUi5yZWFkKCldKTtcclxuICAgICAgICBwcmludChBQywgXCI9PlwiLCBBQy5yZWFkKCkpO1xyXG4gICAgICAgIHByaW50KGBaPSR7QUxVLlp9YCk7XHJcbiAgICAgICAgcHJpbnQoTURSLCBcIj0+XCIsIE1EUi5yZWFkKCkpO1xyXG4gICAgICAgIHByaW50KE1BUik7XHJcbiAgICAgICAgcHJpbnQoYD09ICR7UFJPRy5OQU1FfSBtZW1vcnlgKVxyXG4gICAgICAgIHByaW50KFBST0cpO1xyXG4gICAgICAgIHByaW50KGA9PSAke0RBVEEuTkFNRX0gbWVtb3J5YClcclxuICAgICAgICBwcmludChEQVRBKTtcclxuICAgICAgICBjb25zb2xlLmxvZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IFNURVBfQ09VTlQgPSBwcm9ncmFtLmxlbmd0aDtcclxuICAgIGNvbnNvbGUubG9nKFwiPT0gSW5pdGlhbCBTdGF0ZVwiKTtcclxuICAgIHByaW50Q1BVKCk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFNURVBfQ09VTlQ7IGkrKykge1xyXG4gICAgICAgIENQVS5zdGVwSW5zdHJ1Y3Rpb24oKTtcclxuICAgICAgICBwcmludENQVSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tYWluKCk7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9