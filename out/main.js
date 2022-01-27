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
        // == Fetch Cycle
        this.CU.fetchAndDecodeNextInstruction();
        // == Execute Cycle
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUMsSUFBSSxTQUFTLENBQUM7UUFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO1FBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNaLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDaEMsUUFBUSxFQUFFLENBQUM7SUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN0QixRQUFRLEVBQUUsQ0FBQztLQUNkO0FBQ0wsQ0FBQztBQUVELElBQUksRUFBRSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnkudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9NZW1vcnlNYXAudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2FyY2hpdGVjdHVyZS9SZWdpc3Rlci50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9BTFUudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvQ1BVLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0NVLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0luc3RydWN0aW9uLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgTWVtb3J5IHtcclxuICAgIHB1YmxpYyByZWFkb25seSBOQU1FOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgU0laRTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZGF0YTogQXJyYXk8bnVtYmVyPjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gbmV3IEFycmF5PG51bWJlcj4odGhpcy5TSVpFKTtcclxuICAgICAgICB0aGlzLl9kYXRhLmZpbGwoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RhdGFbYWRkcmVzc10gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2FkZHJlc3NdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZyh3aXRoT2Zmc2V0PzogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IGxpbmVzID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNJWkU7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgYWRkcmVzcyA9IHdpdGhPZmZzZXQgPyBpICsgd2l0aE9mZnNldCA6IGk7XHJcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYDB4JHthZGRyZXNzLnRvU3RyaW5nKDE2KX06IDB4JHt0aGlzLl9kYXRhW2ldLnRvU3RyaW5nKDE2KX1gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBSZWdpc3RlciB9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IE1lbW9yeSB9IGZyb20gXCJAL01lbW9yeVwiO1xyXG5cclxudHlwZSBNZW1vcnlNYXBwaW5nID0ge1xyXG4gICAgcmVhZDogKGFkZHJlc3M6IG51bWJlcikgPT4gbnVtYmVyLFxyXG4gICAgd3JpdGU6IChhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IHZvaWRcclxufVxyXG5cclxuZXhwb3J0IGVudW0gTWVtb3J5QWNjZXNzIHtcclxuICAgIFJFQUQsXHJcbiAgICBXUklURSxcclxuICAgIFJFQURfV1JJVEVcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1lbW9yeU1hcCB7XHJcbiAgICAvLyBBIG1hcCBmcm9tIGFkZHJlc3MgcmFuZ2UgW3N0YXJ0LCBlbmRdIHRvIGEgcmVhZC93cml0YWJsZSBtZW1vcnkgbG9jYXRpb24uXHJcbiAgICBwcml2YXRlIG1hcHBpbmdzOiBNYXA8W3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyXSwgTWVtb3J5TWFwcGluZz47XHJcbiAgICBwcml2YXRlIF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSBfbWFyOiBSZWdpc3RlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtZHI6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyKSB7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX21hciA9IG1hcjtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3M6IG51bWJlcikge1xyXG4gICAgICAgIGxldCByYW5nZXMgPSBbLi4udGhpcy5tYXBwaW5ncy5rZXlzKCldO1xyXG4gICAgICAgIGxldCBrZXkgPSByYW5nZXMuZmluZChyYW5nZSA9PiBhZGRyZXNzID49IHJhbmdlWzBdICYmIGFkZHJlc3MgPD0gcmFuZ2VbMV0pO1xyXG4gICAgICAgIGxldCBtYXBwaW5nID0ga2V5ID8gdGhpcy5tYXBwaW5ncy5nZXQoa2V5KSA6IHVuZGVmaW5lZDtcclxuICAgICAgICByZXR1cm4gbWFwcGluZztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbG9hZCgpIHtcclxuICAgICAgICBsZXQgYWRkcmVzcyA9IHRoaXMuX21hci5yZWFkKCk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBsb2FkKCkgZnJvbSB1bm1hcHBlZCBtZW1vcnlcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gbWFwcGluZy5yZWFkKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICB0aGlzLl9tZHIud3JpdGUoZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdG9yZSgpIHtcclxuICAgICAgICBsZXQgYWRkcmVzcyA9IHRoaXMuX21hci5yZWFkKCk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBzdG9yZSgpIHRvIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSB0aGlzLl9tZHIucmVhZCgpO1xyXG4gICAgICAgICAgICBtYXBwaW5nLndyaXRlKGFkZHJlc3MsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWFwRXh0ZXJuYWxNZW1vcnkoc3RhcnQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIG1vZGU6IE1lbW9yeUFjY2VzcywgTTogTWVtb3J5KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLldSSVRFKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gcmVhZCgpIGZyb20gV1JJVEUtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBNLnJlYWQoYWRkcmVzcyAtIHN0YXJ0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLlJFQUQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byB3cml0ZSgpIHRvIFJFQUQtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE0ud3JpdGUoYWRkcmVzcyAtIHN0YXJ0LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCByYW5nZTogW251bWJlciwgbnVtYmVyXSA9IFtzdGFydCwgc3RhcnQgKyBsZW5ndGggLSAxXTtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzLnNldChyYW5nZSwge3JlYWQsIHdyaXRlfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hcFJlZ2lzdGVyKGE6IG51bWJlciwgUjogUmVnaXN0ZXIpIHtcclxuICAgICAgICBmdW5jdGlvbiByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiBSLnJlYWQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgICAgICBSLndyaXRlKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdID0gW2EsIGFdO1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3Muc2V0KHJhbmdlLCB7cmVhZCwgd3JpdGV9KTtcclxuICAgIH1cclxufSIsImV4cG9ydCBjbGFzcyBSZWdpc3RlciB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTkFNRTogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RhdGE6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuTkFNRSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpIHtcclxuICAgICAgICByZXR1cm4gYCR7dGhpcy5OQU1FfTwweCR7dGhpcy5fZGF0YS50b1N0cmluZygxNil9PmA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0FMVSB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgV09SRF9TSVpFO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWM6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3o6IFJlZ2lzdGVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFjOiBSZWdpc3RlciwgbWRyOiBSZWdpc3Rlciwgd29yZFNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2FjID0gYWM7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuV09SRF9TSVpFID0gd29yZFNpemU7XHJcbiAgICAgICAgdGhpcy5feiA9IG5ldyBSZWdpc3RlcihcIlpcIiwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBaKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3oucmVhZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQgWih2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fei53cml0ZSh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgc3VtID0gKHRoaXMuX2FjLnJlYWQoKSArIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHN1bSk7XHJcbiAgICAgICAgdGhpcy5aID0gc3VtID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN1YigpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgZGlmZmVyZW5jZSA9ICh0aGlzLl9hYy5yZWFkKCkgLSB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShkaWZmZXJlbmNlKTtcclxuICAgICAgICB0aGlzLlogPSBkaWZmZXJlbmNlID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hbmQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IH4odGhpcy5fYWMucmVhZCgpICYgdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUocmVzdWx0KTtcclxuICAgICAgICB0aGlzLlogPSByZXN1bHQgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2hmdCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gKHRoaXMuX2FjLnJlYWQoKSA8PCAxKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuWiA9IHJlc3VsdCA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG59IiwiLy8gPT0gUHNldWRvSVNBXHJcbi8vIC0tIERhdGEgVHJhbnNmZXIgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0xvYWQgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIExEQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIExvYWRzIGEgbWVtb3J5IHdvcmQgdG8gdGhlIEFDLlxyXG4vLyAgICAgIFtTdG9yZSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1RBIHg7IHggaXMgYSBtZW1vcnkgbG9jYXRpb25cclxuLy8gICAgICAgICAgU3RvcmVzIHRoZSBjb250ZW50IG9mIHRoZSBBQyB0byBtZW1vcnkuXHJcbi8vIC0tIEFyaXRobWV0aWMgYW5kIExvZ2ljYWwgSW5zdHJ1Y3Rpb25zXHJcbi8vICAgICAgW0FkZCB0byBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgQUREIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBBZGRzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWQgYnlcclxuLy8gICAgICAgICAgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIHRvIHRoZSBjb250ZW50IGluIHRoZSBBQy5cclxuLy8gICAgICBbU3VidHJhY3QgZnJvbSBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgU1VCIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBTdWJ0cmFjdHMgdGhlIGNvbnRlbnQgb2YgdGhlIG1lbW9yeSB3b3JkIHNwZWNpZmllZFxyXG4vLyAgICAgICAgICBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgZnJvbSB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW0xvZ2ljYWwgTkFORCB3aXRoIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBOQU5EIHg7IHggcG9pbnRzIHRvIGEgbWVtb3J5IGxvY2F0aW9uLlxyXG4vLyAgICAgICAgICBQZXJmb3JtcyBsb2dpY2FsIE5BTkQgYmV0d2VlbiB0aGUgY29udGVudHMgb2YgdGhlIG1lbW9yeVxyXG4vLyAgICAgICAgICB3b3JkIHNwZWNpZmllZCBieSB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgYW5kIHRoZSBBQy5cclxuLy8gICAgICBbU2hpZnRdXHJcbi8vICAgICAgICAgIFNIRlRcclxuLy8gICAgICAgICAgVGhlIGNvbnRlbnQgb2YgQUMgaXMgc2hpZnRlZCBsZWZ0IGJ5IG9uZSBiaXQuXHJcbi8vICAgICAgICAgIFRoZSBiaXQgc2hpZnRlZCBpbiBpcyAwLlxyXG4vLyAtLSBDb250cm9sIFRyYW5zZmVyXHJcbi8vICAgICAgW0p1bXBdXHJcbi8vICAgICAgICAgIEogeDsgSnVtcCB0byBpbnN0cnVjdGlvbiBpbiBtZW1vcnkgbG9jYXRpb24geC5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MuXHJcbi8vICAgICAgW0JORV1cclxuLy8gICAgICAgICAgQk5FIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHggaWYgY29udGVudCBvZiBBQyBpcyBub3QgemVyby5cclxuLy8gICAgICAgICAgVHJhbnNmZXJzIHRoZSBwcm9ncmFtIGNvbnRyb2wgdG8gdGhlIGluc3RydWN0aW9uXHJcbi8vICAgICAgICAgIHNwZWNpZmllZCBieSB0aGUgdGFyZ2V0IGFkZHJlc3MgaWYgWiAhPSAwLlxyXG4vLyBcclxuLy8gPT0gUHNldWRvQ1BVIE1pY3JvLW9wZXJhdGlvbnNcclxuLy8gLS0gU3RvcmUvTG9hZCBtZW1vcnlcclxuLy8gICAgICBNW01BUl0gPC0gTURSXHJcbi8vICAgICAgTURSIDwtIE1bTUFSXVxyXG4vLyAtLSBDb3B5IHJlZ2lzdGVyXHJcbi8vICAgICAgUmEgPC0gUmJcclxuLy8gLS0gUmVnaXN0ZXIgaW5jcmVtZW50L2RlY3JlbWVudFxyXG4vLyAgICAgIFJhIDwtIFJhICsgMVxyXG4vLyAgICAgIFJhIDwtIFJhIC0gMVxyXG4vLyAgICAgIFJhIDwtIFJhICsgUmJcclxuLy8gICAgICBSYSA8LSBSYSAtIFJiXHJcbi8vXHJcbi8vID09IE1pbmltYWwgQ29tcG9uZW50c1xyXG4vLyBbTWVtb3J5XVxyXG4vLyBBZGRyZXNzYWJsZSBieSBBZGRyZXNzIExpbmUgdmlhIE1bTUFSXVxyXG4vLyBXcml0YWJsZSBieSBBZGRyZXNzIExpbmUgJiBEYXRhIExpbmUgdmlhIE1bTUFSXSA8LSBNRFJcclxuLy8gUmVhZGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNRFIgPC0gTVtNQVJdXHJcbi8vIE5lZWQgdHdvIG1lbW9yaWVzOiBwcm9ncmFtIG1lbW9yeSAocmVhZCBvbmx5KSBhbmQgZGF0YSBtZW1vcnkgKHJlYWQgJiB3cml0ZSkuXHJcbi8vXHJcbi8vIFtBTFVdXHJcbi8vIFBlcmZvcm1zIGFyaXRobWV0aWMgb3BlcmF0aW9ucywgb2Z0ZW4gaW52b2x2aW5nIHRoZSBBQyByZWdpc3Rlci5cclxuLy8gQUMgPC0gQUMgKyAxXHJcbi8vIEFDIDwtIEFDICsgUkFcclxuLy8gQUMgPC0gQUMgLSAxXHJcbi8vIEFDIDwtIEFDIC0gUkFcclxuLy9cclxuLy8gW0NvbnRyb2wgVW5pdF1cclxuLy8gRXhlY3V0ZXMgaW5zdHJ1Y3Rpb25zIGFuZCBzZXF1ZW5jZXMgbWljcm9vcGVyYXRpb25zLlxyXG4vL1xyXG4vLyBbTURSIFJlZ2lzdGVyXVxyXG4vLyBUcmFuc2ZlciB0by9mcm9tIG1lbW9yeSB2aWEgRGF0YSBMaW5lLlxyXG4vL1xyXG4vLyBbTUFSIFJlZ2lzdGVyXVxyXG4vLyBBY2Nlc3MgbWVtb3J5IHZpYSBBZGRyZXNzIExpbmVcclxuLy9cclxuLy8gW1BDIFJlZ2lzdGVyXVxyXG4vLyBJbmNyZW1lbnQgdmlhIFBDIDwtIFBDICsgMVxyXG4vL1xyXG4vLyBbSVIgUmVnaXN0ZXJdXHJcbi8vIEhvbGRzIHRoZSBvcGNvZGUgb2YgdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24uXHJcbi8vXHJcbi8vIFtBQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBBQyA8LSBBQyArIDEgb3IgQUMgPC0gQUMgKyBSYVxyXG4vLyBEZWNyZW1lbnQgdmlhIEFDIDwtIEFDIC0gMSBvciBBQyA8LSBBQyAtIFJhXHJcbi8vXHJcbi8vID09IFBzZXVkb0NQVSBJbnN0cnVjdGlvbnNcclxuLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4vLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbi8vIEFERCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyArIE1EUlxyXG4vLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4vLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbmltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIkAvTWVtb3J5XCI7XHJcbmltcG9ydCB7IE1lbW9yeUFjY2VzcywgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuaW1wb3J0IHsgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQgeyBDZW50cmFsUHJvY2Vzc2luZ1VuaXQgfSBmcm9tIFwiQC9DZW50cmFsUHJvY2Vzc2luZ1VuaXRcIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NVIH0gZnJvbSBcIi4vUHNldWRvQ1VcIjtcclxuaW1wb3J0IHsgUHNldWRvQUxVIH0gZnJvbSBcIi4vUHNldWRvQUxVXCI7XHJcblxyXG5leHBvcnQgdHlwZSBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUgPSB7XHJcbiAgICBQQzogUmVnaXN0ZXIsXHJcbiAgICBJUjogUmVnaXN0ZXIsXHJcbiAgICBBQzogUmVnaXN0ZXIsXHJcbiAgICBNRFI6IFJlZ2lzdGVyLFxyXG4gICAgTUFSOiBSZWdpc3RlcixcclxuICAgIEFMVTogUHNldWRvQUxVLFxyXG4gICAgUFJPRzogTWVtb3J5LFxyXG4gICAgREFUQTogTWVtb3J5LFxyXG4gICAgTTogTWVtb3J5TWFwLFxyXG4gICAgQ1U6IENvbnRyb2xVbml0XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DUFUgaW1wbGVtZW50cyBQc2V1ZG9DUFVBcmNoaXRlY3R1cmUsIENlbnRyYWxQcm9jZXNzaW5nVW5pdCB7XHJcbiAgICBwdWJsaWMgc3RhdGljIFdPUkRfU0laRSA9IDE2OyAvLyB3b3JkIHNpemUgaW4gYml0cy5cclxuICAgIHB1YmxpYyBzdGF0aWMgQUREUkVTU19TSVpFID0gMTM7IC8vIGFkZHJlc3Mgc2l6ZSBpbiBiaXRzOyAyKioxMyA9IDB4MjAwMCA9IDgxOTIgYWRkcmVzc2FibGUgd29yZHMgbWVtb3J5LlxyXG4gICAgcHVibGljIHN0YXRpYyBPUENPREVfU0laRSA9IDM7IC8vIG9wY29kZSBzaXplIGluIGJpdHMsIDIqKjMgPSA4IHVuaXF1ZSBvcGNvZGVzLlxyXG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkFNX01FTU9SWV9TSVpFID0gMHgwODsgLy8gYWRkcmVzc2FibGUgd29yZHMgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgc3RhdGljIERBVEFfTUVNT1JZX1NJWkUgPSAweDA4OyAvLyBhZGRyZXNzYWJsZSB3b3JkcyBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPR1JBTV9NRU1PUllfQkVHSU4gPSAweDAwOyAvLyBhZGRyZXNzIG9mIGZpcnN0IHdvcmQgb2YgcHJvZ3JhbSBtZW1vcnkuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgREFUQV9NRU1PUllfQkVHSU4gPSBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRTsgLy8gYWRkcmVzcyBvZiBmaXJzdCB3b3JkIG9mIGRhdGEgbWVtb3J5LlxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBQQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgSVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFDOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNRFI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE1BUjogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQUxVOiBQc2V1ZG9BTFU7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUFJPRzogTWVtb3J5O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEE6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBNOiBNZW1vcnlNYXA7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQ1U6IENvbnRyb2xVbml0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuUEMgPSBuZXcgUmVnaXN0ZXIoXCJQQ1wiLCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKVxyXG4gICAgICAgIHRoaXMuSVIgPSBuZXcgUmVnaXN0ZXIoXCJJUlwiLCBQc2V1ZG9DUFUuT1BDT0RFX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuQUMgPSBuZXcgUmVnaXN0ZXIoXCJBQ1wiLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLk1EUiA9IG5ldyBSZWdpc3RlcihcIk1EUlwiLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLk1BUiA9IG5ldyBSZWdpc3RlcihcIk1BUlwiLCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKTtcclxuICAgICAgICB0aGlzLkFMVSA9IG5ldyBQc2V1ZG9BTFUodGhpcy5BQywgdGhpcy5NRFIsIFBzZXVkb0NQVS5XT1JEX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuUFJPRyA9IG5ldyBNZW1vcnkoXCJQUk9HXCIsIFBzZXVkb0NQVS5QUk9HUkFNX01FTU9SWV9TSVpFKVxyXG4gICAgICAgIHRoaXMuREFUQSA9IG5ldyBNZW1vcnkoXCJEQVRBXCIsIFBzZXVkb0NQVS5EQVRBX01FTU9SWV9TSVpFKTtcclxuICAgICAgICB0aGlzLk0gPSBuZXcgTWVtb3J5TWFwKHRoaXMuTURSLCB0aGlzLk1BUik7XHJcbiAgICAgICAgdGhpcy5NLm1hcEV4dGVybmFsTWVtb3J5KHRoaXMuUFJPR1JBTV9NRU1PUllfQkVHSU4sIFBzZXVkb0NQVS5QUk9HUkFNX01FTU9SWV9TSVpFLCBNZW1vcnlBY2Nlc3MuUkVBRCwgdGhpcy5QUk9HKTtcclxuICAgICAgICB0aGlzLk0ubWFwRXh0ZXJuYWxNZW1vcnkodGhpcy5EQVRBX01FTU9SWV9CRUdJTiwgUHNldWRvQ1BVLkRBVEFfTUVNT1JZX1NJWkUsIE1lbW9yeUFjY2Vzcy5SRUFEX1dSSVRFLCB0aGlzLkRBVEEpO1xyXG4gICAgICAgIHRoaXMuQ1UgPSBuZXcgUHNldWRvQ1UodGhpcy5JUiwgdGhpcy5QQywgdGhpcy5BQywgdGhpcy5NQVIsIHRoaXMuTURSLCB0aGlzLkFMVSwgdGhpcy5NKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RlcEluc3RydWN0aW9uKCkge1xyXG4gICAgICAgIC8vID09IEZldGNoIEN5Y2xlXHJcbiAgICAgICAgdGhpcy5DVS5mZXRjaEFuZERlY29kZU5leHRJbnN0cnVjdGlvbigpO1xyXG4gICAgICAgIC8vID09IEV4ZWN1dGUgQ3ljbGVcclxuICAgICAgICB0aGlzLkNVLmV4ZWN1dGVJbnN0cnVjdGlvbigpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBwdWJsaWMgd3JpdGVQcm9ncmFtKHN0YXJ0OiBudW1iZXIsIC4uLnByb2dyYW06IEFycmF5PG51bWJlcj4pIHtcclxuICAgICAgICBwcm9ncmFtLmZvckVhY2goKGluc3RydWN0aW9uLCBhZGRyZXNzKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuUFJPRy53cml0ZShzdGFydCArIGFkZHJlc3MgLSB0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBpbnN0cnVjdGlvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlRGF0YShzdGFydDogbnVtYmVyLCAuLi5kYXRhOiBBcnJheTxudW1iZXI+KSB7XHJcbiAgICAgICAgZGF0YS5mb3JFYWNoKCh2YWx1ZSwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLkRBVEEud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5EQVRBX01FTU9SWV9CRUdJTiwgdmFsdWUpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnlNYXAgfSBmcm9tIFwiQC9NZW1vcnlNYXBcIjtcclxuaW1wb3J0IHsgQ29udHJvbFVuaXQgfSBmcm9tIFwiQC9Db250cm9sVW5pdFwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvQ1BVIH0gZnJvbSBcIi4vUHNldWRvQ1BVXCI7XHJcbmltcG9ydCB7IFBzZXVkb09wQ29kZSB9IGZyb20gXCIuL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcbmltcG9ydCB7UHNldWRvQUxVfSBmcm9tIFwiLi9Qc2V1ZG9BTFVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DVSBpbXBsZW1lbnRzIENvbnRyb2xVbml0IHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2lyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3BjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21hcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWx1OiBQc2V1ZG9BTFU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZW1vcnk6IE1lbW9yeU1hcDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpcjogUmVnaXN0ZXIsIHBjOiBSZWdpc3RlciwgYWM6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCBhbHU6IFBzZXVkb0FMVSwgbWVtb3J5OiBNZW1vcnlNYXApIHtcclxuICAgICAgICB0aGlzLl9pciA9IGlyO1xyXG4gICAgICAgIHRoaXMuX3BjID0gcGM7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX2FsdSA9IGFsdTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkgPSBtZW1vcnk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGVyZm9ybXMgaW5zdHJ1Y3Rpb24gZmV0Y2ggYW5kIGRlY29kZS5cclxuICAgIHB1YmxpYyBmZXRjaEFuZERlY29kZU5leHRJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyBNQVIgPC0gUENcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUodGhpcy5fcGMucmVhZCgpKTtcclxuICAgICAgICAvLyBQQyA8LSBQQyArIDFcclxuICAgICAgICB0aGlzLl9wYy53cml0ZSh0aGlzLl9wYy5yZWFkKCkgKyAxKTtcclxuICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgdGhpcy5fbWVtb3J5LmxvYWQoKTtcclxuICAgICAgICAvLyBJUiA8LSBNRFIob3Bjb2RlKVxyXG4gICAgICAgIGxldCBPUENPREVfU0hJRlQgPSBQc2V1ZG9DUFUuV09SRF9TSVpFIC0gUHNldWRvQ1BVLk9QQ09ERV9TSVpFO1xyXG4gICAgICAgIGxldCBvcGNvZGUgPSB0aGlzLl9tZHIucmVhZCgpID4+IE9QQ09ERV9TSElGVDtcclxuICAgICAgICB0aGlzLl9pci53cml0ZShvcGNvZGUpO1xyXG4gICAgICAgIC8vIE1BUiA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWRyLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUoYWRkcmVzcyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEV4ZWN1dGVzIHRoZSBjdXJyZW50IGluc3RydWN0aW9uIGxvYWRlZCBpbnRvIElSLlxyXG4gICAgcHVibGljIGV4ZWN1dGVJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbiAgICAgICAgLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4gICAgICAgIC8vIFNUQSB4OiBNRFIgPC0gQUMsIE1bTUFSXSA8LSBNRFJcclxuICAgICAgICAvLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuICAgICAgICAvLyBTVUIgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgLSBNRFJcclxuICAgICAgICAvLyBOQU5EIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIH4oQUMgJiBNRFIpXHJcbiAgICAgICAgLy8gU0hGVCB4OiBBQyA8LSBBQyA8PCAxXHJcbiAgICAgICAgLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAvLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbiAgICAgICAgY29uc3QgW0lSLCBQQywgQUMsIE1BUiwgTURSLCBBTFUsIE1dID0gW3RoaXMuX2lyLCB0aGlzLl9wYywgdGhpcy5fYWMsIHRoaXMuX21hciwgdGhpcy5fbWRyLCB0aGlzLl9hbHUsIHRoaXMuX21lbW9yeV07XHJcblxyXG4gICAgICAgIGNvbnN0IGNvcHkgPSAoZHN0OiBSZWdpc3Rlciwgc3JjOiBSZWdpc3RlcikgPT4gZHN0LndyaXRlKHNyYy5yZWFkKCkpO1xyXG5cclxuICAgICAgICBsZXQgb3Bjb2RlID0gSVIucmVhZCgpO1xyXG4gICAgICAgIHN3aXRjaCAob3Bjb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkxEQTogICAgICAvLyBMREEgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIGNvcHkoQUMsIE1EUik7ICAgICAgICAgIC8vIEFDIDwtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNUQTogICAgICAvLyBTVEEgeDpcclxuICAgICAgICAgICAgICAgIGNvcHkoTURSLCBBQyk7ICAgICAgICAgIC8vIE1EUiA8LSBBQ1xyXG4gICAgICAgICAgICAgICAgTS5zdG9yZSgpOyAgICAgICAgICAgICAgLy8gTVtNQVJdIDwtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkFERDogICAgICAvLyBBREQgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5hZGQoKTsgICAgICAgICAgICAgIC8vIEFDIDwtIEFDICsgTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU1VCOiAgICAgIC8vIFNVQiB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLnN1YigpOyAgICAgICAgICAgICAgLy8gQUMgPC0gQUMgLSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5OQU5EOiAgICAgLy8gTkFORCB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLm5hbmQoKTsgICAgICAgICAgICAgLy8gQUMgPC0gfihBQyAmIE1EUilcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TSEZUOiAgICAgLy8gU0hGVDpcclxuICAgICAgICAgICAgICAgIEFMVS5zaGZ0KCk7ICAgICAgICAgICAgIC8vIEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5KOiAgICAgICAgLy8gSiB4OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUEMgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSBNRFIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgICAgICAgICAgUEMud3JpdGUoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuQk5FOiAgICAgIC8vIEJORSB4OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKFogIT0gMSkgdGhlbiBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGlmIChBTFUuWiAhPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE1EUi5yZWFkKCkgJiBBRERSRVNTX01BU0s7XHJcbiAgICAgICAgICAgICAgICAgICAgUEMud3JpdGUoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRocm93IGBVbmtub3duIG9wY29kZTogJHtvcGNvZGV9YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gU1VCIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDIC0gTURSXHJcbi8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuLy8gU0hGVCB4OiBBQyA8LSBBQyA8PCAxXHJcbi8vIEogeDogUEMgPC0gTURSKGFkZHJlc3MpXHJcbi8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuaW1wb3J0IHsgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9JbnN0cnVjdGlvblwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvQ1BVIH0gZnJvbSBcIi4vUHNldWRvQ1BVXCI7XHJcblxyXG5cclxuZXhwb3J0IGVudW0gUHNldWRvT3BDb2RlIHtcclxuICAgIExEQSAgPSAwYjAwMCxcclxuICAgIFNUQSAgPSAwYjAwMSxcclxuICAgIEFERCAgPSAwYjAxMCxcclxuICAgIFNVQiAgPSAwYjAxMSxcclxuICAgIE5BTkQgPSAwYjEwMCxcclxuICAgIFNIRlQgPSAwYjEwMSxcclxuICAgIEogICAgPSAwYjExMCxcclxuICAgIEJORSAgPSAwYjExMVxyXG59XHJcblxyXG4vLyBJbnN0cnVjdGlvbiBtZW1vcnkgZm9ybWF0OlxyXG4vLyAgICAgIFtJbnN0cnVjdGlvbjogV09SRF9TSVpFXSA9IFtvcGNvZGU6IE9QQ09ERV9TSVpFXSBbb3BlcmFuZDogQUREUkVTU19TSVpFXVxyXG4vLyBPcGVyYW5kIHVzYWdlIGlzIGRlZmluZWQgYnkgdGhlIG9wY29kZS5cclxuLy8gT3BlcmFuZCBhZGRyZXNzIGlzIGxvYWRlZCBpbnRvIE1BUiBhZnRlciB0aGUgZmV0Y2ggYW5kIGRlY29kZSBjeWNsZS5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0luc3RydWN0aW9uIGltcGxlbWVudHMgSW5zdHJ1Y3Rpb24ge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IG9wY29kZTogUHNldWRvT3BDb2RlO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IG9wZXJhbmQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBWQUxVRTogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wY29kZTogUHNldWRvT3BDb2RlLCBvcGVyYW5kOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLm9wY29kZSA9IG9wY29kZTtcclxuICAgICAgICB0aGlzLm9wZXJhbmQgPSBvcGVyYW5kO1xyXG4gICAgICAgIHRoaXMuVkFMVUUgPSAodGhpcy5vcGNvZGUgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgKyB0aGlzLm9wZXJhbmQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBMREEgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkxEQSwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBTVEEgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLlNUQSwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBBREQgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkFERCwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBTVUIgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLlNVQiwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBOQU5EICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLk5BTkQsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU0hGVCAgID0gKCkgICAgICAgICAgICAgICAgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5TSEZULCAwKTtcclxuZXhwb3J0IGNvbnN0IEogICAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuSiwgICBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IEJORSAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuQk5FLCBvcGVyYW5kKTtcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsImltcG9ydCB7IFBzZXVkb0NQVSB9IGZyb20gXCJAL1BzZXVkb0NQVS9Qc2V1ZG9DUFVcIjtcclxuaW1wb3J0IHsgUHNldWRvT3BDb2RlLCBMREEsIFNUQSwgQURELCBTSEZULCBQc2V1ZG9JbnN0cnVjdGlvbiB9IGZyb20gXCJAL1BzZXVkb0NQVS9Qc2V1ZG9JbnN0cnVjdGlvblwiO1xyXG5cclxuZnVuY3Rpb24gbWFpbigpIHtcclxuICAgIC8vIENvbnN0cnVjdCBhIEVDRTM3NSBQc2V1ZG8gQ1BVLCBmYWN0b3J5IG5ldyFcclxuICAgIGNvbnN0IENQVSA9IG5ldyBQc2V1ZG9DUFUoKTtcclxuXHJcbiAgICAvLyBEZWZpbmUgbGFiZWxzIGluIERBVEEgbWVtb3J5LlxyXG4gICAgbGV0IEEgPSBDUFUuREFUQV9NRU1PUllfQkVHSU47XHJcbiAgICBsZXQgQiA9IENQVS5EQVRBX01FTU9SWV9CRUdJTiArIDE7XHJcbiAgICBsZXQgQyA9IENQVS5EQVRBX01FTU9SWV9CRUdJTiArIDI7XHJcbiAgICAvLyBQcm9ncmFtLCBjb21wdXRlcyBDID0gNCpBICsgQlxyXG4gICAgY29uc3QgcHJvZ3JhbSA9IFtcclxuICAgICAgICBMREEoQSksXHJcbiAgICAgICAgU0hGVCgpLFxyXG4gICAgICAgIFNIRlQoKSxcclxuICAgICAgICBBREQoQiksXHJcbiAgICAgICAgU1RBKEMpXHJcbiAgICBdLm1hcChpbnN0cnVjdGlvbiA9PiBpbnN0cnVjdGlvbi5WQUxVRSk7XHJcbiAgICAvLyBXcml0ZSBwcm9ncmFtIHRvIG1lbW9yeS5cclxuICAgIENQVS53cml0ZVByb2dyYW0oMCwgLi4ucHJvZ3JhbSk7XHJcbiAgICAvLyBJbml0aWFsIHZhbHVlczogQSA9IDIwLCBCID0gMjAsIEMgPSAwLlxyXG4gICAgQ1BVLndyaXRlRGF0YShBLCAyMCk7XHJcbiAgICBDUFUud3JpdGVEYXRhKEIsIDIxKTtcclxuXHJcbiAgICBmdW5jdGlvbiBwcmludENQVSgpIHtcclxuICAgICAgICBjb25zdCBwcmludCA9ICguLi5hcmdzOiBBcnJheTx7IHRvU3RyaW5nKCk6IHN0cmluZyB9PikgPT4gY29uc29sZS5sb2coLi4uYXJncy5tYXAodmFsdWUgPT4gdmFsdWUudG9TdHJpbmcoKSkpO1xyXG4gICAgICAgIGNvbnN0IHsgUEMsIElSLCBBQywgTURSLCBNQVIsIEFMVSwgUFJPRywgREFUQSwgTSwgQ1UgfSA9IENQVTtcclxuICAgICAgICBwcmludChQQyk7XHJcbiAgICAgICAgcHJpbnQoSVIsIFwiPT5cIiwgUHNldWRvT3BDb2RlW0lSLnJlYWQoKV0pO1xyXG4gICAgICAgIHByaW50KEFDLCBcIj0+XCIsIEFDLnJlYWQoKSk7XHJcbiAgICAgICAgcHJpbnQoYFo9JHtBTFUuWn1gKTtcclxuICAgICAgICBwcmludChNRFIsIFwiPT5cIiwgTURSLnJlYWQoKSk7XHJcbiAgICAgICAgcHJpbnQoTUFSKTtcclxuICAgICAgICBwcmludChgPT0gJHtQUk9HLk5BTUV9IG1lbW9yeWApXHJcbiAgICAgICAgcHJpbnQoUFJPRyk7XHJcbiAgICAgICAgcHJpbnQoYD09ICR7REFUQS5OQU1FfSBtZW1vcnlgKVxyXG4gICAgICAgIHByaW50KERBVEEpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgU1RFUF9DT1VOVCA9IHByb2dyYW0ubGVuZ3RoO1xyXG4gICAgY29uc29sZS5sb2coXCI9PSBJbml0aWFsIFN0YXRlXCIpO1xyXG4gICAgcHJpbnRDUFUoKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgU1RFUF9DT1VOVDsgaSsrKSB7XHJcbiAgICAgICAgQ1BVLnN0ZXBJbnN0cnVjdGlvbigpO1xyXG4gICAgICAgIHByaW50Q1BVKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW4oKTsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=