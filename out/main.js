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
    writeProgram(start, program) {
        program.forEach((instruction, address) => {
            this.PROG.write(start + address - this.PROGRAM_MEMORY_BEGIN, instruction.VALUE);
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
    ];
    // Write program to memory.
    CPU.writeProgram(0, program);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQztRQUMvQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ2hDLFFBQVEsRUFBRSxDQUFDO0lBQ1gsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNqQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdEIsUUFBUSxFQUFFLENBQUM7S0FDZDtBQUNMLENBQUM7QUFFRCxJQUFJLEVBQUUsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9hcmNoaXRlY3R1cmUvTWVtb3J5LnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9hcmNoaXRlY3R1cmUvTWVtb3J5TWFwLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9hcmNoaXRlY3R1cmUvUmVnaXN0ZXIudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvQUxVLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0NQVS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9DVS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9JbnN0cnVjdGlvbi50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL21haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIE1lbW9yeSB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTkFNRTogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RhdGE6IEFycmF5PG51bWJlcj47XHJcblxyXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzaXplOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLk5BTUUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuU0laRSA9IHNpemU7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IG5ldyBBcnJheTxudW1iZXI+KHRoaXMuU0laRSk7XHJcbiAgICAgICAgdGhpcy5fZGF0YS5maWxsKDApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZShhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9kYXRhW2FkZHJlc3NdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVthZGRyZXNzXTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcod2l0aE9mZnNldD86IG51bWJlcikge1xyXG4gICAgICAgIGxldCBsaW5lcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5TSVpFOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSB3aXRoT2Zmc2V0ID8gaSArIHdpdGhPZmZzZXQgOiBpO1xyXG4gICAgICAgICAgICBsaW5lcy5wdXNoKGAweCR7YWRkcmVzcy50b1N0cmluZygxNil9OiAweCR7dGhpcy5fZGF0YVtpXS50b1N0cmluZygxNil9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgUmVnaXN0ZXIgfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnkgfSBmcm9tIFwiQC9NZW1vcnlcIjtcclxuXHJcbnR5cGUgTWVtb3J5TWFwcGluZyA9IHtcclxuICAgIHJlYWQ6IChhZGRyZXNzOiBudW1iZXIpID0+IG51bWJlcixcclxuICAgIHdyaXRlOiAoYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSA9PiB2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBlbnVtIE1lbW9yeUFjY2VzcyB7XHJcbiAgICBSRUFELFxyXG4gICAgV1JJVEUsXHJcbiAgICBSRUFEX1dSSVRFXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNZW1vcnlNYXAge1xyXG4gICAgLy8gQSBtYXAgZnJvbSBhZGRyZXNzIHJhbmdlIFtzdGFydCwgZW5kXSB0byBhIHJlYWQvd3JpdGFibGUgbWVtb3J5IGxvY2F0aW9uLlxyXG4gICAgcHJpdmF0ZSBtYXBwaW5nczogTWFwPFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl0sIE1lbW9yeU1hcHBpbmc+O1xyXG4gICAgcHJpdmF0ZSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgX21hcjogUmVnaXN0ZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWRyOiBSZWdpc3RlciwgbWFyOiBSZWdpc3Rlcikge1xyXG4gICAgICAgIHRoaXMuX21kciA9IG1kcjtcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncyA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzOiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgcmFuZ2VzID0gWy4uLnRoaXMubWFwcGluZ3Mua2V5cygpXTtcclxuICAgICAgICBsZXQga2V5ID0gcmFuZ2VzLmZpbmQocmFuZ2UgPT4gYWRkcmVzcyA+PSByYW5nZVswXSAmJiBhZGRyZXNzIDw9IHJhbmdlWzFdKTtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IGtleSA/IHRoaXMubWFwcGluZ3MuZ2V0KGtleSkgOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgcmV0dXJuIG1hcHBpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWQoKSB7XHJcbiAgICAgICAgbGV0IGFkZHJlc3MgPSB0aGlzLl9tYXIucmVhZCgpO1xyXG4gICAgICAgIGxldCBtYXBwaW5nID0gdGhpcy5maW5kQWRkcmVzc01hcHBpbmcoYWRkcmVzcyk7XHJcbiAgICAgICAgaWYgKG1hcHBpbmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gbG9hZCgpIGZyb20gdW5tYXBwZWQgbWVtb3J5XCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgZGF0YSA9IG1hcHBpbmcucmVhZChhZGRyZXNzKTtcclxuICAgICAgICAgICAgdGhpcy5fbWRyLndyaXRlKGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RvcmUoKSB7XHJcbiAgICAgICAgbGV0IGFkZHJlc3MgPSB0aGlzLl9tYXIucmVhZCgpO1xyXG4gICAgICAgIGxldCBtYXBwaW5nID0gdGhpcy5maW5kQWRkcmVzc01hcHBpbmcoYWRkcmVzcyk7XHJcbiAgICAgICAgaWYgKG1hcHBpbmcgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gc3RvcmUoKSB0byB1bm1hcHBlZCBtZW1vcnlcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gdGhpcy5fbWRyLnJlYWQoKTtcclxuICAgICAgICAgICAgbWFwcGluZy53cml0ZShhZGRyZXNzLCBkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hcEV4dGVybmFsTWVtb3J5KHN0YXJ0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBtb2RlOiBNZW1vcnlBY2Nlc3MsIE06IE1lbW9yeSkge1xyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWQoYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICAgICAgaWYgKG1vZGUgPT09IE1lbW9yeUFjY2Vzcy5XUklURSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHJlYWQoKSBmcm9tIFdSSVRFLW9ubHkgbWVtb3J5XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gTS5yZWFkKGFkZHJlc3MgLSBzdGFydCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZShhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICAgICAgaWYgKG1vZGUgPT09IE1lbW9yeUFjY2Vzcy5SRUFEKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gd3JpdGUoKSB0byBSRUFELW9ubHkgbWVtb3J5XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBNLndyaXRlKGFkZHJlc3MgLSBzdGFydCwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgcmFuZ2U6IFtudW1iZXIsIG51bWJlcl0gPSBbc3RhcnQsIHN0YXJ0ICsgbGVuZ3RoIC0gMV07XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncy5zZXQocmFuZ2UsIHtyZWFkLCB3cml0ZX0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXBSZWdpc3RlcihhOiBudW1iZXIsIFI6IFJlZ2lzdGVyKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICByZXR1cm4gUi5yZWFkKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiB3cml0ZShhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICAgICAgUi53cml0ZSh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCByYW5nZTogW251bWJlciwgbnVtYmVyXSA9IFthLCBhXTtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzLnNldChyYW5nZSwge3JlYWQsIHdyaXRlfSk7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY2xhc3MgUmVnaXN0ZXIge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE5BTUU6IHN0cmluZztcclxuICAgIHB1YmxpYyByZWFkb25seSBTSVpFOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kYXRhOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBzaXplOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLk5BTUUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuU0laRSA9IHNpemU7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9kYXRhID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlYWQoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuTkFNRX08MHgke3RoaXMuX2RhdGEudG9TdHJpbmcoMTYpfT5gO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtSZWdpc3Rlcn0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9BTFUge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFdPUkRfU0laRTtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21kcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF96OiBSZWdpc3RlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhYzogUmVnaXN0ZXIsIG1kcjogUmVnaXN0ZXIsIHdvcmRTaXplOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl9hYyA9IGFjO1xyXG4gICAgICAgIHRoaXMuX21kciA9IG1kcjtcclxuICAgICAgICB0aGlzLldPUkRfU0laRSA9IHdvcmRTaXplO1xyXG4gICAgICAgIHRoaXMuX3ogPSBuZXcgUmVnaXN0ZXIoXCJaXCIsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgWigpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl96LnJlYWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IFoodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX3oud3JpdGUodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHN1bSA9ICh0aGlzLl9hYy5yZWFkKCkgKyB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShzdW0pO1xyXG4gICAgICAgIHRoaXMuWiA9IHN1bSA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdWIoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IGRpZmZlcmVuY2UgPSAodGhpcy5fYWMucmVhZCgpIC0gdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUoZGlmZmVyZW5jZSk7XHJcbiAgICAgICAgdGhpcy5aID0gZGlmZmVyZW5jZSA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYW5kKCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB+KHRoaXMuX2FjLnJlYWQoKSAmIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5aID0gcmVzdWx0ID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNoZnQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IHRoaXMuV09SRF9TSVpFKSAtIDE7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9ICh0aGlzLl9hYy5yZWFkKCkgPDwgMSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUocmVzdWx0KTtcclxuICAgICAgICB0aGlzLlogPSByZXN1bHQgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxufSIsIi8vID09IFBzZXVkb0lTQVxyXG4vLyAtLSBEYXRhIFRyYW5zZmVyIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtMb2FkIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBMREEgeDsgeCBpcyBhIG1lbW9yeSBsb2NhdGlvblxyXG4vLyAgICAgICAgICBMb2FkcyBhIG1lbW9yeSB3b3JkIHRvIHRoZSBBQy5cclxuLy8gICAgICBbU3RvcmUgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNUQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIFN0b3JlcyB0aGUgY29udGVudCBvZiB0aGUgQUMgdG8gbWVtb3J5LlxyXG4vLyAtLSBBcml0aG1ldGljIGFuZCBMb2dpY2FsIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtBZGQgdG8gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIEFERCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgQWRkcyB0aGUgY29udGVudCBvZiB0aGUgbWVtb3J5IHdvcmQgc3BlY2lmaWVkIGJ5XHJcbi8vICAgICAgICAgIHRoZSBlZmZlY3RpdmUgYWRkcmVzcyB0byB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW1N1YnRyYWN0IGZyb20gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNVQiB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgU3VidHJhY3RzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWRcclxuLy8gICAgICAgICAgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGZyb20gdGhlIGNvbnRlbnQgaW4gdGhlIEFDLlxyXG4vLyAgICAgIFtMb2dpY2FsIE5BTkQgd2l0aCBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgTkFORCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgUGVyZm9ybXMgbG9naWNhbCBOQU5EIGJldHdlZW4gdGhlIGNvbnRlbnRzIG9mIHRoZSBtZW1vcnlcclxuLy8gICAgICAgICAgd29yZCBzcGVjaWZpZWQgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGFuZCB0aGUgQUMuXHJcbi8vICAgICAgW1NoaWZ0XVxyXG4vLyAgICAgICAgICBTSEZUXHJcbi8vICAgICAgICAgIFRoZSBjb250ZW50IG9mIEFDIGlzIHNoaWZ0ZWQgbGVmdCBieSBvbmUgYml0LlxyXG4vLyAgICAgICAgICBUaGUgYml0IHNoaWZ0ZWQgaW4gaXMgMC5cclxuLy8gLS0gQ29udHJvbCBUcmFuc2ZlclxyXG4vLyAgICAgIFtKdW1wXVxyXG4vLyAgICAgICAgICBKIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHguXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzLlxyXG4vLyAgICAgIFtCTkVdXHJcbi8vICAgICAgICAgIEJORSB4OyBKdW1wIHRvIGluc3RydWN0aW9uIGluIG1lbW9yeSBsb2NhdGlvbiB4IGlmIGNvbnRlbnQgb2YgQUMgaXMgbm90IHplcm8uXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzIGlmIFogIT0gMC5cclxuLy8gXHJcbi8vID09IFBzZXVkb0NQVSBNaWNyby1vcGVyYXRpb25zXHJcbi8vIC0tIFN0b3JlL0xvYWQgbWVtb3J5XHJcbi8vICAgICAgTVtNQVJdIDwtIE1EUlxyXG4vLyAgICAgIE1EUiA8LSBNW01BUl1cclxuLy8gLS0gQ29weSByZWdpc3RlclxyXG4vLyAgICAgIFJhIDwtIFJiXHJcbi8vIC0tIFJlZ2lzdGVyIGluY3JlbWVudC9kZWNyZW1lbnRcclxuLy8gICAgICBSYSA8LSBSYSArIDFcclxuLy8gICAgICBSYSA8LSBSYSAtIDFcclxuLy8gICAgICBSYSA8LSBSYSArIFJiXHJcbi8vICAgICAgUmEgPC0gUmEgLSBSYlxyXG4vL1xyXG4vLyA9PSBNaW5pbWFsIENvbXBvbmVudHNcclxuLy8gW01lbW9yeV1cclxuLy8gQWRkcmVzc2FibGUgYnkgQWRkcmVzcyBMaW5lIHZpYSBNW01BUl1cclxuLy8gV3JpdGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNW01BUl0gPC0gTURSXHJcbi8vIFJlYWRhYmxlIGJ5IEFkZHJlc3MgTGluZSAmIERhdGEgTGluZSB2aWEgTURSIDwtIE1bTUFSXVxyXG4vLyBOZWVkIHR3byBtZW1vcmllczogcHJvZ3JhbSBtZW1vcnkgKHJlYWQgb25seSkgYW5kIGRhdGEgbWVtb3J5IChyZWFkICYgd3JpdGUpLlxyXG4vL1xyXG4vLyBbQUxVXVxyXG4vLyBQZXJmb3JtcyBhcml0aG1ldGljIG9wZXJhdGlvbnMsIG9mdGVuIGludm9sdmluZyB0aGUgQUMgcmVnaXN0ZXIuXHJcbi8vIEFDIDwtIEFDICsgMVxyXG4vLyBBQyA8LSBBQyArIFJBXHJcbi8vIEFDIDwtIEFDIC0gMVxyXG4vLyBBQyA8LSBBQyAtIFJBXHJcbi8vXHJcbi8vIFtDb250cm9sIFVuaXRdXHJcbi8vIEV4ZWN1dGVzIGluc3RydWN0aW9ucyBhbmQgc2VxdWVuY2VzIG1pY3Jvb3BlcmF0aW9ucy5cclxuLy9cclxuLy8gW01EUiBSZWdpc3Rlcl1cclxuLy8gVHJhbnNmZXIgdG8vZnJvbSBtZW1vcnkgdmlhIERhdGEgTGluZS5cclxuLy9cclxuLy8gW01BUiBSZWdpc3Rlcl1cclxuLy8gQWNjZXNzIG1lbW9yeSB2aWEgQWRkcmVzcyBMaW5lXHJcbi8vXHJcbi8vIFtQQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBQQyA8LSBQQyArIDFcclxuLy9cclxuLy8gW0lSIFJlZ2lzdGVyXVxyXG4vLyBIb2xkcyB0aGUgb3Bjb2RlIG9mIHRoZSBjdXJyZW50IGluc3RydWN0aW9uLlxyXG4vL1xyXG4vLyBbQUMgUmVnaXN0ZXJdXHJcbi8vIEluY3JlbWVudCB2aWEgQUMgPC0gQUMgKyAxIG9yIEFDIDwtIEFDICsgUmFcclxuLy8gRGVjcmVtZW50IHZpYSBBQyA8LSBBQyAtIDEgb3IgQUMgPC0gQUMgLSBSYVxyXG4vL1xyXG4vLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG5pbXBvcnQgeyBSZWdpc3RlciB9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IE1lbW9yeSB9IGZyb20gXCJAL01lbW9yeVwiO1xyXG5pbXBvcnQgeyBNZW1vcnlBY2Nlc3MsIE1lbW9yeU1hcCB9IGZyb20gXCJAL01lbW9yeU1hcFwiO1xyXG5pbXBvcnQgeyBDb250cm9sVW5pdCB9IGZyb20gXCJAL0NvbnRyb2xVbml0XCI7XHJcbmltcG9ydCB7IEluc3RydWN0aW9uIH0gZnJvbSBcIkAvSW5zdHJ1Y3Rpb25cIjtcclxuaW1wb3J0IHsgQ2VudHJhbFByb2Nlc3NpbmdVbml0IH0gZnJvbSBcIkAvQ2VudHJhbFByb2Nlc3NpbmdVbml0XCI7XHJcblxyXG5pbXBvcnQgeyBQc2V1ZG9DVSB9IGZyb20gXCIuL1BzZXVkb0NVXCI7XHJcbmltcG9ydCB7IFBzZXVkb0FMVSB9IGZyb20gXCIuL1BzZXVkb0FMVVwiO1xyXG5cclxuZXhwb3J0IHR5cGUgUHNldWRvQ1BVQXJjaGl0ZWN0dXJlID0ge1xyXG4gICAgUEM6IFJlZ2lzdGVyLFxyXG4gICAgSVI6IFJlZ2lzdGVyLFxyXG4gICAgQUM6IFJlZ2lzdGVyLFxyXG4gICAgTURSOiBSZWdpc3RlcixcclxuICAgIE1BUjogUmVnaXN0ZXIsXHJcbiAgICBBTFU6IFBzZXVkb0FMVSxcclxuICAgIFBST0c6IE1lbW9yeSxcclxuICAgIERBVEE6IE1lbW9yeSxcclxuICAgIE06IE1lbW9yeU1hcCxcclxuICAgIENVOiBDb250cm9sVW5pdFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUHNldWRvQ1BVIGltcGxlbWVudHMgUHNldWRvQ1BVQXJjaGl0ZWN0dXJlLCBDZW50cmFsUHJvY2Vzc2luZ1VuaXQge1xyXG4gICAgcHVibGljIHN0YXRpYyBXT1JEX1NJWkUgPSAxNjsgLy8gd29yZCBzaXplIGluIGJpdHMuXHJcbiAgICBwdWJsaWMgc3RhdGljIEFERFJFU1NfU0laRSA9IDEzOyAvLyBhZGRyZXNzIHNpemUgaW4gYml0czsgMioqMTMgPSAweDIwMDAgPSA4MTkyIGFkZHJlc3NhYmxlIHdvcmRzIG1lbW9yeS5cclxuICAgIHB1YmxpYyBzdGF0aWMgT1BDT0RFX1NJWkUgPSAzOyAvLyBvcGNvZGUgc2l6ZSBpbiBiaXRzLCAyKiozID0gOCB1bmlxdWUgb3Bjb2Rlcy5cclxuICAgIHB1YmxpYyBzdGF0aWMgUFJPR1JBTV9NRU1PUllfU0laRSA9IDB4MDg7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIHByb2dyYW0gbWVtb3J5LlxyXG4gICAgcHVibGljIHN0YXRpYyBEQVRBX01FTU9SWV9TSVpFID0gMHgwODsgLy8gYWRkcmVzc2FibGUgd29yZHMgb2YgZGF0YSBtZW1vcnkuXHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0dSQU1fTUVNT1JZX0JFR0lOID0gMHgwMDsgLy8gYWRkcmVzcyBvZiBmaXJzdCB3b3JkIG9mIHByb2dyYW0gbWVtb3J5LlxyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEFfTUVNT1JZX0JFR0lOID0gUHNldWRvQ1BVLlBST0dSQU1fTUVNT1JZX1NJWkU7IC8vIGFkZHJlc3Mgb2YgZmlyc3Qgd29yZCBvZiBkYXRhIG1lbW9yeS5cclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgUEM6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IElSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBBQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTURSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNQVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFMVTogUHNldWRvQUxVO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0c6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBEQVRBOiBNZW1vcnk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTTogTWVtb3J5TWFwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IENVOiBDb250cm9sVW5pdDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLlBDID0gbmV3IFJlZ2lzdGVyKFwiUENcIiwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSlcclxuICAgICAgICB0aGlzLklSID0gbmV3IFJlZ2lzdGVyKFwiSVJcIiwgUHNldWRvQ1BVLk9QQ09ERV9TSVpFKTtcclxuICAgICAgICB0aGlzLkFDID0gbmV3IFJlZ2lzdGVyKFwiQUNcIiwgUHNldWRvQ1BVLldPUkRfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NRFIgPSBuZXcgUmVnaXN0ZXIoXCJNRFJcIiwgUHNldWRvQ1BVLldPUkRfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NQVIgPSBuZXcgUmVnaXN0ZXIoXCJNQVJcIiwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSk7XHJcbiAgICAgICAgdGhpcy5BTFUgPSBuZXcgUHNldWRvQUxVKHRoaXMuQUMsIHRoaXMuTURSLCBQc2V1ZG9DUFUuV09SRF9TSVpFKTtcclxuICAgICAgICB0aGlzLlBST0cgPSBuZXcgTWVtb3J5KFwiUFJPR1wiLCBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRSlcclxuICAgICAgICB0aGlzLkRBVEEgPSBuZXcgTWVtb3J5KFwiREFUQVwiLCBQc2V1ZG9DUFUuREFUQV9NRU1PUllfU0laRSk7XHJcbiAgICAgICAgdGhpcy5NID0gbmV3IE1lbW9yeU1hcCh0aGlzLk1EUiwgdGhpcy5NQVIpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBFeHRlcm5hbE1lbW9yeSh0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBQc2V1ZG9DUFUuUFJPR1JBTV9NRU1PUllfU0laRSwgTWVtb3J5QWNjZXNzLlJFQUQsIHRoaXMuUFJPRyk7XHJcbiAgICAgICAgdGhpcy5NLm1hcEV4dGVybmFsTWVtb3J5KHRoaXMuREFUQV9NRU1PUllfQkVHSU4sIFBzZXVkb0NQVS5EQVRBX01FTU9SWV9TSVpFLCBNZW1vcnlBY2Nlc3MuUkVBRF9XUklURSwgdGhpcy5EQVRBKTtcclxuICAgICAgICB0aGlzLkNVID0gbmV3IFBzZXVkb0NVKHRoaXMuSVIsIHRoaXMuUEMsIHRoaXMuQUMsIHRoaXMuTUFSLCB0aGlzLk1EUiwgdGhpcy5BTFUsIHRoaXMuTSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0ZXBJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyA9PSBGZXRjaCBDeWNsZVxyXG4gICAgICAgIHRoaXMuQ1UuZmV0Y2hBbmREZWNvZGVOZXh0SW5zdHJ1Y3Rpb24oKTtcclxuICAgICAgICAvLyA9PSBFeGVjdXRlIEN5Y2xlXHJcbiAgICAgICAgdGhpcy5DVS5leGVjdXRlSW5zdHJ1Y3Rpb24oKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHdyaXRlUHJvZ3JhbShzdGFydDogbnVtYmVyLCBwcm9ncmFtOiBBcnJheTxJbnN0cnVjdGlvbj4pIHtcclxuICAgICAgICBwcm9ncmFtLmZvckVhY2goKGluc3RydWN0aW9uLCBhZGRyZXNzKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuUFJPRy53cml0ZShzdGFydCArIGFkZHJlc3MgLSB0aGlzLlBST0dSQU1fTUVNT1JZX0JFR0lOLCBpbnN0cnVjdGlvbi5WQUxVRSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlRGF0YShzdGFydDogbnVtYmVyLCAuLi5kYXRhOiBBcnJheTxudW1iZXI+KSB7XHJcbiAgICAgICAgZGF0YS5mb3JFYWNoKCh2YWx1ZSwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLkRBVEEud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5EQVRBX01FTU9SWV9CRUdJTiwgdmFsdWUpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge1JlZ2lzdGVyfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnlNYXAgfSBmcm9tIFwiQC9NZW1vcnlNYXBcIjtcclxuaW1wb3J0IHsgQ29udHJvbFVuaXQgfSBmcm9tIFwiQC9Db250cm9sVW5pdFwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvQ1BVIH0gZnJvbSBcIi4vUHNldWRvQ1BVXCI7XHJcbmltcG9ydCB7IFBzZXVkb09wQ29kZSB9IGZyb20gXCIuL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcbmltcG9ydCB7UHNldWRvQUxVfSBmcm9tIFwiLi9Qc2V1ZG9BTFVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9DVSBpbXBsZW1lbnRzIENvbnRyb2xVbml0IHtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2lyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3BjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FjOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21hcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWx1OiBQc2V1ZG9BTFU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZW1vcnk6IE1lbW9yeU1hcDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpcjogUmVnaXN0ZXIsIHBjOiBSZWdpc3RlciwgYWM6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCBhbHU6IFBzZXVkb0FMVSwgbWVtb3J5OiBNZW1vcnlNYXApIHtcclxuICAgICAgICB0aGlzLl9pciA9IGlyO1xyXG4gICAgICAgIHRoaXMuX3BjID0gcGM7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX2FsdSA9IGFsdTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkgPSBtZW1vcnk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGVyZm9ybXMgaW5zdHJ1Y3Rpb24gZmV0Y2ggYW5kIGRlY29kZS5cclxuICAgIHB1YmxpYyBmZXRjaEFuZERlY29kZU5leHRJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyBNQVIgPC0gUENcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUodGhpcy5fcGMucmVhZCgpKTtcclxuICAgICAgICAvLyBQQyA8LSBQQyArIDFcclxuICAgICAgICB0aGlzLl9wYy53cml0ZSh0aGlzLl9wYy5yZWFkKCkgKyAxKTtcclxuICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgdGhpcy5fbWVtb3J5LmxvYWQoKTtcclxuICAgICAgICAvLyBJUiA8LSBNRFIob3Bjb2RlKVxyXG4gICAgICAgIGxldCBPUENPREVfU0hJRlQgPSBQc2V1ZG9DUFUuV09SRF9TSVpFIC0gUHNldWRvQ1BVLk9QQ09ERV9TSVpFO1xyXG4gICAgICAgIGxldCBvcGNvZGUgPSB0aGlzLl9tZHIucmVhZCgpID4+IE9QQ09ERV9TSElGVDtcclxuICAgICAgICB0aGlzLl9pci53cml0ZShvcGNvZGUpO1xyXG4gICAgICAgIC8vIE1BUiA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWRyLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUoYWRkcmVzcyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIEV4ZWN1dGVzIHRoZSBjdXJyZW50IGluc3RydWN0aW9uIGxvYWRlZCBpbnRvIElSLlxyXG4gICAgcHVibGljIGV4ZWN1dGVJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbiAgICAgICAgLy8gTERBIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIE1EUlxyXG4gICAgICAgIC8vIFNUQSB4OiBNRFIgPC0gQUMsIE1bTUFSXSA8LSBNRFJcclxuICAgICAgICAvLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuICAgICAgICAvLyBTVUIgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgLSBNRFJcclxuICAgICAgICAvLyBOQU5EIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIH4oQUMgJiBNRFIpXHJcbiAgICAgICAgLy8gU0hGVCB4OiBBQyA8LSBBQyA8PCAxXHJcbiAgICAgICAgLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAvLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbiAgICAgICAgY29uc3QgW0lSLCBQQywgQUMsIE1BUiwgTURSLCBBTFUsIE1dID0gW3RoaXMuX2lyLCB0aGlzLl9wYywgdGhpcy5fYWMsIHRoaXMuX21hciwgdGhpcy5fbWRyLCB0aGlzLl9hbHUsIHRoaXMuX21lbW9yeV07XHJcblxyXG4gICAgICAgIGNvbnN0IGNvcHkgPSAoZHN0OiBSZWdpc3Rlciwgc3JjOiBSZWdpc3RlcikgPT4gZHN0LndyaXRlKHNyYy5yZWFkKCkpO1xyXG5cclxuICAgICAgICBsZXQgb3Bjb2RlID0gSVIucmVhZCgpO1xyXG4gICAgICAgIHN3aXRjaCAob3Bjb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkxEQTogICAgICAvLyBMREEgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIGNvcHkoQUMsIE1EUik7ICAgICAgICAgIC8vIEFDIDwtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNUQTogICAgICAvLyBTVEEgeDpcclxuICAgICAgICAgICAgICAgIGNvcHkoTURSLCBBQyk7ICAgICAgICAgIC8vIE1EUiA8LSBBQ1xyXG4gICAgICAgICAgICAgICAgTS5zdG9yZSgpOyAgICAgICAgICAgICAgLy8gTVtNQVJdIDwtIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkFERDogICAgICAvLyBBREQgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5hZGQoKTsgICAgICAgICAgICAgIC8vIEFDIDwtIEFDICsgTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU1VCOiAgICAgIC8vIFNVQiB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLnN1YigpOyAgICAgICAgICAgICAgLy8gQUMgPC0gQUMgLSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5OQU5EOiAgICAgLy8gTkFORCB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgICAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLm5hbmQoKTsgICAgICAgICAgICAgLy8gQUMgPC0gfihBQyAmIE1EUilcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TSEZUOiAgICAgLy8gU0hGVDpcclxuICAgICAgICAgICAgICAgIEFMVS5zaGZ0KCk7ICAgICAgICAgICAgIC8vIEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5KOiAgICAgICAgLy8gSiB4OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUEMgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICBsZXQgQUREUkVTU19NQVNLID0gKDEgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSBNRFIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgICAgICAgICAgUEMud3JpdGUoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuQk5FOiAgICAgIC8vIEJORSB4OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKFogIT0gMSkgdGhlbiBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGlmIChBTFUuWiAhPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE1EUi5yZWFkKCkgJiBBRERSRVNTX01BU0s7XHJcbiAgICAgICAgICAgICAgICAgICAgUEMud3JpdGUoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRocm93IGBVbmtub3duIG9wY29kZTogJHtvcGNvZGV9YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCIvLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gU1VCIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDIC0gTURSXHJcbi8vIE5BTkQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gfihBQyAmIE1EUilcclxuLy8gU0hGVCB4OiBBQyA8LSBBQyA8PCAxXHJcbi8vIEogeDogUEMgPC0gTURSKGFkZHJlc3MpXHJcbi8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuaW1wb3J0IHsgSW5zdHJ1Y3Rpb24gfSBmcm9tIFwiQC9JbnN0cnVjdGlvblwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvQ1BVIH0gZnJvbSBcIi4vUHNldWRvQ1BVXCI7XHJcblxyXG5cclxuZXhwb3J0IGVudW0gUHNldWRvT3BDb2RlIHtcclxuICAgIExEQSAgPSAwYjAwMCxcclxuICAgIFNUQSAgPSAwYjAwMSxcclxuICAgIEFERCAgPSAwYjAxMCxcclxuICAgIFNVQiAgPSAwYjAxMSxcclxuICAgIE5BTkQgPSAwYjEwMCxcclxuICAgIFNIRlQgPSAwYjEwMSxcclxuICAgIEogICAgPSAwYjExMCxcclxuICAgIEJORSAgPSAwYjExMVxyXG59XHJcblxyXG4vLyBJbnN0cnVjdGlvbiBtZW1vcnkgZm9ybWF0OlxyXG4vLyAgICAgIFtJbnN0cnVjdGlvbjogV09SRF9TSVpFXSA9IFtvcGNvZGU6IE9QQ09ERV9TSVpFXSBbb3BlcmFuZDogQUREUkVTU19TSVpFXVxyXG4vLyBPcGVyYW5kIHVzYWdlIGlzIGRlZmluZWQgYnkgdGhlIG9wY29kZS5cclxuLy8gT3BlcmFuZCBhZGRyZXNzIGlzIGxvYWRlZCBpbnRvIE1BUiBhZnRlciB0aGUgZmV0Y2ggYW5kIGRlY29kZSBjeWNsZS5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0luc3RydWN0aW9uIGltcGxlbWVudHMgSW5zdHJ1Y3Rpb24ge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IG9wY29kZTogUHNldWRvT3BDb2RlO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IG9wZXJhbmQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBWQUxVRTogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wY29kZTogUHNldWRvT3BDb2RlLCBvcGVyYW5kOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLm9wY29kZSA9IG9wY29kZTtcclxuICAgICAgICB0aGlzLm9wZXJhbmQgPSBvcGVyYW5kO1xyXG4gICAgICAgIHRoaXMuVkFMVUUgPSAodGhpcy5vcGNvZGUgPDwgUHNldWRvQ1BVLkFERFJFU1NfU0laRSkgKyB0aGlzLm9wZXJhbmQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBMREEgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkxEQSwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBTVEEgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLlNUQSwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBBREQgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkFERCwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBTVUIgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLlNVQiwgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBOQU5EICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLk5BTkQsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU0hGVCAgID0gKCkgICAgICAgICAgICAgICAgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5TSEZULCAwKTtcclxuZXhwb3J0IGNvbnN0IEogICAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuSiwgICBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IEJORSAgICA9IChvcGVyYW5kOiBudW1iZXIpID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuQk5FLCBvcGVyYW5kKTtcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsImltcG9ydCB7IFBzZXVkb0NQVSB9IGZyb20gXCJAL1BzZXVkb0NQVS9Qc2V1ZG9DUFVcIjtcclxuaW1wb3J0IHsgUHNldWRvT3BDb2RlLCBMREEsIFNUQSwgQURELCBTSEZUIH0gZnJvbSBcIkAvUHNldWRvQ1BVL1BzZXVkb0luc3RydWN0aW9uXCI7XHJcblxyXG5mdW5jdGlvbiBtYWluKCkge1xyXG4gICAgLy8gQ29uc3RydWN0IGEgRUNFMzc1IFBzZXVkbyBDUFUsIGZhY3RvcnkgbmV3IVxyXG4gICAgY29uc3QgQ1BVID0gbmV3IFBzZXVkb0NQVSgpO1xyXG5cclxuICAgIC8vIERlZmluZSBsYWJlbHMgaW4gREFUQSBtZW1vcnkuXHJcbiAgICBsZXQgQSA9IENQVS5EQVRBX01FTU9SWV9CRUdJTjtcclxuICAgIGxldCBCID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMTtcclxuICAgIGxldCBDID0gQ1BVLkRBVEFfTUVNT1JZX0JFR0lOICsgMjtcclxuICAgIC8vIFByb2dyYW0sIGNvbXB1dGVzIEMgPSA0KkEgKyBCXHJcbiAgICBjb25zdCBwcm9ncmFtID0gW1xyXG4gICAgICAgIExEQShBKSxcclxuICAgICAgICBTSEZUKCksXHJcbiAgICAgICAgU0hGVCgpLFxyXG4gICAgICAgIEFERChCKSxcclxuICAgICAgICBTVEEoQylcclxuICAgIF07XHJcbiAgICAvLyBXcml0ZSBwcm9ncmFtIHRvIG1lbW9yeS5cclxuICAgIENQVS53cml0ZVByb2dyYW0oMCwgcHJvZ3JhbSk7XHJcbiAgICAvLyBJbml0aWFsIHZhbHVlczogQSA9IDIwLCBCID0gMjAsIEMgPSAwLlxyXG4gICAgQ1BVLndyaXRlRGF0YShBLCAyMCk7XHJcbiAgICBDUFUud3JpdGVEYXRhKEIsIDIxKTtcclxuXHJcbiAgICBmdW5jdGlvbiBwcmludENQVSgpIHtcclxuICAgICAgICBjb25zdCBwcmludCA9ICguLi5hcmdzOiBBcnJheTx7IHRvU3RyaW5nKCk6IHN0cmluZyB9PikgPT4gY29uc29sZS5sb2coLi4uYXJncy5tYXAodmFsdWUgPT4gdmFsdWUudG9TdHJpbmcoKSkpO1xyXG4gICAgICAgIGNvbnN0IHsgUEMsIElSLCBBQywgTURSLCBNQVIsIEFMVSwgUFJPRywgREFUQSwgTSwgQ1UgfSA9IENQVTtcclxuICAgICAgICBwcmludChQQyk7XHJcbiAgICAgICAgcHJpbnQoSVIsIFwiPT5cIiwgUHNldWRvT3BDb2RlW0lSLnJlYWQoKV0pO1xyXG4gICAgICAgIHByaW50KEFDLCBcIj0+XCIsIEFDLnJlYWQoKSk7XHJcbiAgICAgICAgcHJpbnQoYFo9JHtBTFUuWn1gKTtcclxuICAgICAgICBwcmludChNRFIsIFwiPT5cIiwgTURSLnJlYWQoKSk7XHJcbiAgICAgICAgcHJpbnQoTUFSKTtcclxuICAgICAgICBwcmludChgPT0gJHtQUk9HLk5BTUV9IG1lbW9yeWApXHJcbiAgICAgICAgcHJpbnQoUFJPRyk7XHJcbiAgICAgICAgcHJpbnQoYD09ICR7REFUQS5OQU1FfSBtZW1vcnlgKVxyXG4gICAgICAgIHByaW50KERBVEEpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgU1RFUF9DT1VOVCA9IHByb2dyYW0ubGVuZ3RoO1xyXG4gICAgY29uc29sZS5sb2coXCI9PSBJbml0aWFsIFN0YXRlXCIpO1xyXG4gICAgcHJpbnRDUFUoKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgU1RFUF9DT1VOVDsgaSsrKSB7XHJcbiAgICAgICAgQ1BVLnN0ZXBJbnN0cnVjdGlvbigpO1xyXG4gICAgICAgIHByaW50Q1BVKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW4oKTsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=