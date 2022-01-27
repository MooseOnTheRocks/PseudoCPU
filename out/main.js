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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUM7UUFDWixLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNoQyxRQUFRLEVBQUUsQ0FBQztJQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDakMsR0FBRyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3RCLFFBQVEsRUFBRSxDQUFDO0tBQ2Q7QUFDTCxDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL01lbW9yeS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL01lbW9yeU1hcC50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvYXJjaGl0ZWN0dXJlL1JlZ2lzdGVyLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9pbXBsZW1lbnRhdGlvbnMvUHNldWRvQ1BVL1BzZXVkb0FMVS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvaW1wbGVtZW50YXRpb25zL1BzZXVkb0NQVS9Qc2V1ZG9DUFUudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvQ1UudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL2ltcGxlbWVudGF0aW9ucy9Qc2V1ZG9DUFUvUHNldWRvSW5zdHJ1Y3Rpb24udHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBNZW1vcnkge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE5BTUU6IHN0cmluZztcclxuICAgIHB1YmxpYyByZWFkb25seSBTSVpFOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIF9kYXRhOiBBcnJheTxudW1iZXI+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5OQU1FID0gbmFtZTtcclxuICAgICAgICB0aGlzLlNJWkUgPSBzaXplO1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSBuZXcgQXJyYXk8bnVtYmVyPih0aGlzLlNJWkUpO1xyXG4gICAgICAgIHRoaXMuX2RhdGEuZmlsbCgwKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUoYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YVthZGRyZXNzXSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFbYWRkcmVzc107XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvU3RyaW5nKHdpdGhPZmZzZXQ/OiBudW1iZXIpIHtcclxuICAgICAgICBsZXQgbGluZXMgPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU0laRTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBhZGRyZXNzID0gd2l0aE9mZnNldCA/IGkgKyB3aXRoT2Zmc2V0IDogaTtcclxuICAgICAgICAgICAgbGluZXMucHVzaChgMHgke2FkZHJlc3MudG9TdHJpbmcoMTYpfTogMHgke3RoaXMuX2RhdGFbaV0udG9TdHJpbmcoMTYpfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIkAvTWVtb3J5XCI7XHJcblxyXG50eXBlIE1lbW9yeU1hcHBpbmcgPSB7XHJcbiAgICByZWFkOiAoYWRkcmVzczogbnVtYmVyKSA9PiBudW1iZXIsXHJcbiAgICB3cml0ZTogKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikgPT4gdm9pZFxyXG59XHJcblxyXG5leHBvcnQgZW51bSBNZW1vcnlBY2Nlc3Mge1xyXG4gICAgUkVBRCxcclxuICAgIFdSSVRFLFxyXG4gICAgUkVBRF9XUklURVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWVtb3J5TWFwIHtcclxuICAgIC8vIEEgbWFwIGZyb20gYWRkcmVzcyByYW5nZSBbc3RhcnQsIGVuZF0gdG8gYSByZWFkL3dyaXRhYmxlIG1lbW9yeSBsb2NhdGlvbi5cclxuICAgIHByaXZhdGUgbWFwcGluZ3M6IE1hcDxbc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXJdLCBNZW1vcnlNYXBwaW5nPjtcclxuICAgIHByaXZhdGUgX21kcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIF9tYXI6IFJlZ2lzdGVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1kcjogUmVnaXN0ZXIsIG1hcjogUmVnaXN0ZXIpIHtcclxuICAgICAgICB0aGlzLl9tZHIgPSBtZHI7XHJcbiAgICAgICAgdGhpcy5fbWFyID0gbWFyO1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3MgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBmaW5kQWRkcmVzc01hcHBpbmcoYWRkcmVzczogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IHJhbmdlcyA9IFsuLi50aGlzLm1hcHBpbmdzLmtleXMoKV07XHJcbiAgICAgICAgbGV0IGtleSA9IHJhbmdlcy5maW5kKHJhbmdlID0+IGFkZHJlc3MgPj0gcmFuZ2VbMF0gJiYgYWRkcmVzcyA8PSByYW5nZVsxXSk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSBrZXkgPyB0aGlzLm1hcHBpbmdzLmdldChrZXkpIDogdW5kZWZpbmVkO1xyXG4gICAgICAgIHJldHVybiBtYXBwaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsb2FkKCkge1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWFyLnJlYWQoKTtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIGxvYWQoKSBmcm9tIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSBtYXBwaW5nLnJlYWQoYWRkcmVzcyk7XHJcbiAgICAgICAgICAgIHRoaXMuX21kci53cml0ZShkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0b3JlKCkge1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWFyLnJlYWQoKTtcclxuICAgICAgICBsZXQgbWFwcGluZyA9IHRoaXMuZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3MpO1xyXG4gICAgICAgIGlmIChtYXBwaW5nID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHN0b3JlKCkgdG8gdW5tYXBwZWQgbWVtb3J5XCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgZGF0YSA9IHRoaXMuX21kci5yZWFkKCk7XHJcbiAgICAgICAgICAgIG1hcHBpbmcud3JpdGUoYWRkcmVzcywgZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBtYXBFeHRlcm5hbE1lbW9yeShzdGFydDogbnVtYmVyLCBsZW5ndGg6IG51bWJlciwgbW9kZTogTWVtb3J5QWNjZXNzLCBNOiBNZW1vcnkpIHtcclxuICAgICAgICBmdW5jdGlvbiByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgICAgIGlmIChtb2RlID09PSBNZW1vcnlBY2Nlc3MuV1JJVEUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byByZWFkKCkgZnJvbSBXUklURS1vbmx5IG1lbW9yeVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIE0ucmVhZChhZGRyZXNzIC0gc3RhcnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGUoYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2RlID09PSBNZW1vcnlBY2Nlc3MuUkVBRCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgXCJBdHRlbXB0aW5nIHRvIHdyaXRlKCkgdG8gUkVBRC1vbmx5IG1lbW9yeVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgTS53cml0ZShhZGRyZXNzIC0gc3RhcnQsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdID0gW3N0YXJ0LCBzdGFydCArIGxlbmd0aCAtIDFdO1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3Muc2V0KHJhbmdlLCB7cmVhZCwgd3JpdGV9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWFwUmVnaXN0ZXIoYTogbnVtYmVyLCBSOiBSZWdpc3Rlcikge1xyXG4gICAgICAgIGZ1bmN0aW9uIHJlYWQoYWRkcmVzczogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgICAgICAgICAgcmV0dXJuIFIucmVhZCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gd3JpdGUoYWRkcmVzczogbnVtYmVyLCB2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIFIud3JpdGUodmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgcmFuZ2U6IFtudW1iZXIsIG51bWJlcl0gPSBbYSwgYV07XHJcbiAgICAgICAgdGhpcy5tYXBwaW5ncy5zZXQocmFuZ2UsIHtyZWFkLCB3cml0ZX0pO1xyXG4gICAgfVxyXG59IiwiZXhwb3J0IGNsYXNzIFJlZ2lzdGVyIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBOQU1FOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgU0laRTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBfZGF0YTogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgc2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5OQU1FID0gbmFtZTtcclxuICAgICAgICB0aGlzLlNJWkUgPSBzaXplO1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fZGF0YSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWFkKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRvU3RyaW5nKCkge1xyXG4gICAgICAgIHJldHVybiBgJHt0aGlzLk5BTUV9PDB4JHt0aGlzLl9kYXRhLnRvU3RyaW5nKDE2KX0+YDtcclxuICAgIH1cclxufSIsImltcG9ydCB7UmVnaXN0ZXJ9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUHNldWRvQUxVIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBXT1JEX1NJWkU7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfejogUmVnaXN0ZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYWM6IFJlZ2lzdGVyLCBtZHI6IFJlZ2lzdGVyLCB3b3JkU2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tZHIgPSBtZHI7XHJcbiAgICAgICAgdGhpcy5XT1JEX1NJWkUgPSB3b3JkU2l6ZTtcclxuICAgICAgICB0aGlzLl96ID0gbmV3IFJlZ2lzdGVyKFwiWlwiLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IFooKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fei5yZWFkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNldCBaKHZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLl96LndyaXRlKHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkKCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBzdW0gPSAodGhpcy5fYWMucmVhZCgpICsgdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUoc3VtKTtcclxuICAgICAgICB0aGlzLlogPSBzdW0gPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3ViKCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBkaWZmZXJlbmNlID0gKHRoaXMuX2FjLnJlYWQoKSAtIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKGRpZmZlcmVuY2UpO1xyXG4gICAgICAgIHRoaXMuWiA9IGRpZmZlcmVuY2UgPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmFuZCgpIHtcclxuICAgICAgICBsZXQgV09SRF9NQVNLID0gKDEgPDwgdGhpcy5XT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gfih0aGlzLl9hYy5yZWFkKCkgJiB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShyZXN1bHQpO1xyXG4gICAgICAgIHRoaXMuWiA9IHJlc3VsdCA9PT0gMCA/IDEgOiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzaGZ0KCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCB0aGlzLldPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSAodGhpcy5fYWMucmVhZCgpIDw8IDEpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5aID0gcmVzdWx0ID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcbn0iLCIvLyA9PSBQc2V1ZG9JU0FcclxuLy8gLS0gRGF0YSBUcmFuc2ZlciBJbnN0cnVjdGlvbnNcclxuLy8gICAgICBbTG9hZCBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgTERBIHg7IHggaXMgYSBtZW1vcnkgbG9jYXRpb25cclxuLy8gICAgICAgICAgTG9hZHMgYSBtZW1vcnkgd29yZCB0byB0aGUgQUMuXHJcbi8vICAgICAgW1N0b3JlIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBTVEEgeDsgeCBpcyBhIG1lbW9yeSBsb2NhdGlvblxyXG4vLyAgICAgICAgICBTdG9yZXMgdGhlIGNvbnRlbnQgb2YgdGhlIEFDIHRvIG1lbW9yeS5cclxuLy8gLS0gQXJpdGhtZXRpYyBhbmQgTG9naWNhbCBJbnN0cnVjdGlvbnNcclxuLy8gICAgICBbQWRkIHRvIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBBREQgeDsgeCBwb2ludHMgdG8gYSBtZW1vcnkgbG9jYXRpb24uXHJcbi8vICAgICAgICAgIEFkZHMgdGhlIGNvbnRlbnQgb2YgdGhlIG1lbW9yeSB3b3JkIHNwZWNpZmllZCBieVxyXG4vLyAgICAgICAgICB0aGUgZWZmZWN0aXZlIGFkZHJlc3MgdG8gdGhlIGNvbnRlbnQgaW4gdGhlIEFDLlxyXG4vLyAgICAgIFtTdWJ0cmFjdCBmcm9tIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBTVUIgeDsgeCBwb2ludHMgdG8gYSBtZW1vcnkgbG9jYXRpb24uXHJcbi8vICAgICAgICAgIFN1YnRyYWN0cyB0aGUgY29udGVudCBvZiB0aGUgbWVtb3J5IHdvcmQgc3BlY2lmaWVkXHJcbi8vICAgICAgICAgIGJ5IHRoZSBlZmZlY3RpdmUgYWRkcmVzcyBmcm9tIHRoZSBjb250ZW50IGluIHRoZSBBQy5cclxuLy8gICAgICBbTG9naWNhbCBOQU5EIHdpdGggQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIE5BTkQgeDsgeCBwb2ludHMgdG8gYSBtZW1vcnkgbG9jYXRpb24uXHJcbi8vICAgICAgICAgIFBlcmZvcm1zIGxvZ2ljYWwgTkFORCBiZXR3ZWVuIHRoZSBjb250ZW50cyBvZiB0aGUgbWVtb3J5XHJcbi8vICAgICAgICAgIHdvcmQgc3BlY2lmaWVkIGJ5IHRoZSBlZmZlY3RpdmUgYWRkcmVzcyBhbmQgdGhlIEFDLlxyXG4vLyAgICAgIFtTaGlmdF1cclxuLy8gICAgICAgICAgU0hGVFxyXG4vLyAgICAgICAgICBUaGUgY29udGVudCBvZiBBQyBpcyBzaGlmdGVkIGxlZnQgYnkgb25lIGJpdC5cclxuLy8gICAgICAgICAgVGhlIGJpdCBzaGlmdGVkIGluIGlzIDAuXHJcbi8vIC0tIENvbnRyb2wgVHJhbnNmZXJcclxuLy8gICAgICBbSnVtcF1cclxuLy8gICAgICAgICAgSiB4OyBKdW1wIHRvIGluc3RydWN0aW9uIGluIG1lbW9yeSBsb2NhdGlvbiB4LlxyXG4vLyAgICAgICAgICBUcmFuc2ZlcnMgdGhlIHByb2dyYW0gY29udHJvbCB0byB0aGUgaW5zdHJ1Y3Rpb25cclxuLy8gICAgICAgICAgc3BlY2lmaWVkIGJ5IHRoZSB0YXJnZXQgYWRkcmVzcy5cclxuLy8gICAgICBbQk5FXVxyXG4vLyAgICAgICAgICBCTkUgeDsgSnVtcCB0byBpbnN0cnVjdGlvbiBpbiBtZW1vcnkgbG9jYXRpb24geCBpZiBjb250ZW50IG9mIEFDIGlzIG5vdCB6ZXJvLlxyXG4vLyAgICAgICAgICBUcmFuc2ZlcnMgdGhlIHByb2dyYW0gY29udHJvbCB0byB0aGUgaW5zdHJ1Y3Rpb25cclxuLy8gICAgICAgICAgc3BlY2lmaWVkIGJ5IHRoZSB0YXJnZXQgYWRkcmVzcyBpZiBaICE9IDAuXHJcbi8vIFxyXG4vLyA9PSBQc2V1ZG9DUFUgTWljcm8tb3BlcmF0aW9uc1xyXG4vLyAtLSBTdG9yZS9Mb2FkIG1lbW9yeVxyXG4vLyAgICAgIE1bTUFSXSA8LSBNRFJcclxuLy8gICAgICBNRFIgPC0gTVtNQVJdXHJcbi8vIC0tIENvcHkgcmVnaXN0ZXJcclxuLy8gICAgICBSYSA8LSBSYlxyXG4vLyAtLSBSZWdpc3RlciBpbmNyZW1lbnQvZGVjcmVtZW50XHJcbi8vICAgICAgUmEgPC0gUmEgKyAxXHJcbi8vICAgICAgUmEgPC0gUmEgLSAxXHJcbi8vICAgICAgUmEgPC0gUmEgKyBSYlxyXG4vLyAgICAgIFJhIDwtIFJhIC0gUmJcclxuLy9cclxuLy8gPT0gTWluaW1hbCBDb21wb25lbnRzXHJcbi8vIFtNZW1vcnldXHJcbi8vIEFkZHJlc3NhYmxlIGJ5IEFkZHJlc3MgTGluZSB2aWEgTVtNQVJdXHJcbi8vIFdyaXRhYmxlIGJ5IEFkZHJlc3MgTGluZSAmIERhdGEgTGluZSB2aWEgTVtNQVJdIDwtIE1EUlxyXG4vLyBSZWFkYWJsZSBieSBBZGRyZXNzIExpbmUgJiBEYXRhIExpbmUgdmlhIE1EUiA8LSBNW01BUl1cclxuLy8gTmVlZCB0d28gbWVtb3JpZXM6IHByb2dyYW0gbWVtb3J5IChyZWFkIG9ubHkpIGFuZCBkYXRhIG1lbW9yeSAocmVhZCAmIHdyaXRlKS5cclxuLy9cclxuLy8gW0FMVV1cclxuLy8gUGVyZm9ybXMgYXJpdGhtZXRpYyBvcGVyYXRpb25zLCBvZnRlbiBpbnZvbHZpbmcgdGhlIEFDIHJlZ2lzdGVyLlxyXG4vLyBBQyA8LSBBQyArIDFcclxuLy8gQUMgPC0gQUMgKyBSQVxyXG4vLyBBQyA8LSBBQyAtIDFcclxuLy8gQUMgPC0gQUMgLSBSQVxyXG4vL1xyXG4vLyBbQ29udHJvbCBVbml0XVxyXG4vLyBFeGVjdXRlcyBpbnN0cnVjdGlvbnMgYW5kIHNlcXVlbmNlcyBtaWNyb29wZXJhdGlvbnMuXHJcbi8vXHJcbi8vIFtNRFIgUmVnaXN0ZXJdXHJcbi8vIFRyYW5zZmVyIHRvL2Zyb20gbWVtb3J5IHZpYSBEYXRhIExpbmUuXHJcbi8vXHJcbi8vIFtNQVIgUmVnaXN0ZXJdXHJcbi8vIEFjY2VzcyBtZW1vcnkgdmlhIEFkZHJlc3MgTGluZVxyXG4vL1xyXG4vLyBbUEMgUmVnaXN0ZXJdXHJcbi8vIEluY3JlbWVudCB2aWEgUEMgPC0gUEMgKyAxXHJcbi8vXHJcbi8vIFtJUiBSZWdpc3Rlcl1cclxuLy8gSG9sZHMgdGhlIG9wY29kZSBvZiB0aGUgY3VycmVudCBpbnN0cnVjdGlvbi5cclxuLy9cclxuLy8gW0FDIFJlZ2lzdGVyXVxyXG4vLyBJbmNyZW1lbnQgdmlhIEFDIDwtIEFDICsgMSBvciBBQyA8LSBBQyArIFJhXHJcbi8vIERlY3JlbWVudCB2aWEgQUMgPC0gQUMgLSAxIG9yIEFDIDwtIEFDIC0gUmFcclxuLy9cclxuLy8gPT0gUHNldWRvQ1BVIEluc3RydWN0aW9uc1xyXG4vLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbi8vIFNUQSB4OiBNRFIgPC0gQUMsIE1bTUFSXSA8LSBNRFJcclxuLy8gQUREIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDICsgTURSXHJcbi8vIEogeDogUEMgPC0gTURSKGFkZHJlc3MpXHJcbi8vIEJORSB4OiBpZiAoeiAhPSAxKSB0aGVuIFBDIDwtIE1BUihhZGRyZXNzKVxyXG5cclxuaW1wb3J0IHsgUmVnaXN0ZXIgfSBmcm9tIFwiQC9SZWdpc3RlclwiO1xyXG5pbXBvcnQgeyBNZW1vcnkgfSBmcm9tIFwiQC9NZW1vcnlcIjtcclxuaW1wb3J0IHsgTWVtb3J5QWNjZXNzLCBNZW1vcnlNYXAgfSBmcm9tIFwiQC9NZW1vcnlNYXBcIjtcclxuaW1wb3J0IHsgQ29udHJvbFVuaXQgfSBmcm9tIFwiQC9Db250cm9sVW5pdFwiO1xyXG5pbXBvcnQgeyBJbnN0cnVjdGlvbiB9IGZyb20gXCJAL0luc3RydWN0aW9uXCI7XHJcbmltcG9ydCB7IENlbnRyYWxQcm9jZXNzaW5nVW5pdCB9IGZyb20gXCJAL0NlbnRyYWxQcm9jZXNzaW5nVW5pdFwiO1xyXG5cclxuaW1wb3J0IHsgUHNldWRvQ1UgfSBmcm9tIFwiLi9Qc2V1ZG9DVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9BTFUgfSBmcm9tIFwiLi9Qc2V1ZG9BTFVcIjtcclxuXHJcbmV4cG9ydCB0eXBlIFBzZXVkb0NQVUFyY2hpdGVjdHVyZSA9IHtcclxuICAgIFBDOiBSZWdpc3RlcixcclxuICAgIElSOiBSZWdpc3RlcixcclxuICAgIEFDOiBSZWdpc3RlcixcclxuICAgIE1EUjogUmVnaXN0ZXIsXHJcbiAgICBNQVI6IFJlZ2lzdGVyLFxyXG4gICAgQUxVOiBQc2V1ZG9BTFUsXHJcbiAgICBQUk9HOiBNZW1vcnksXHJcbiAgICBEQVRBOiBNZW1vcnksXHJcbiAgICBNOiBNZW1vcnlNYXAsXHJcbiAgICBDVTogQ29udHJvbFVuaXRcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBzZXVkb0NQVSBpbXBsZW1lbnRzIFBzZXVkb0NQVUFyY2hpdGVjdHVyZSwgQ2VudHJhbFByb2Nlc3NpbmdVbml0IHtcclxuICAgIHB1YmxpYyBzdGF0aWMgV09SRF9TSVpFID0gMTY7IC8vIHdvcmQgc2l6ZSBpbiBiaXRzLlxyXG4gICAgcHVibGljIHN0YXRpYyBBRERSRVNTX1NJWkUgPSAxMzsgLy8gYWRkcmVzcyBzaXplIGluIGJpdHM7IDIqKjEzID0gMHgyMDAwID0gODE5MiBhZGRyZXNzYWJsZSB3b3JkcyBtZW1vcnkuXHJcbiAgICBwdWJsaWMgc3RhdGljIE9QQ09ERV9TSVpFID0gMzsgLy8gb3Bjb2RlIHNpemUgaW4gYml0cywgMioqMyA9IDggdW5pcXVlIG9wY29kZXMuXHJcbiAgICBwdWJsaWMgc3RhdGljIFBST0dSQU1fTUVNT1JZX1NJWkUgPSAweDA4OyAvLyBhZGRyZXNzYWJsZSB3b3JkcyBvZiBwcm9ncmFtIG1lbW9yeS5cclxuICAgIHB1YmxpYyBzdGF0aWMgREFUQV9NRU1PUllfU0laRSA9IDB4MDg7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIGRhdGEgbWVtb3J5LlxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBQUk9HUkFNX01FTU9SWV9CRUdJTiA9IDB4MDA7IC8vIGFkZHJlc3Mgb2YgZmlyc3Qgd29yZCBvZiBwcm9ncmFtIG1lbW9yeS5cclxuICAgIHB1YmxpYyByZWFkb25seSBEQVRBX01FTU9SWV9CRUdJTiA9IFBzZXVkb0NQVS5QUk9HUkFNX01FTU9SWV9TSVpFOyAvLyBhZGRyZXNzIG9mIGZpcnN0IHdvcmQgb2YgZGF0YSBtZW1vcnkuXHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IFBDOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBJUjogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQUM6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE1EUjogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTUFSOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBBTFU6IFBzZXVkb0FMVTtcclxuICAgIHB1YmxpYyByZWFkb25seSBQUk9HOiBNZW1vcnk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgREFUQTogTWVtb3J5O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE06IE1lbW9yeU1hcDtcclxuICAgIHB1YmxpYyByZWFkb25seSBDVTogQ29udHJvbFVuaXQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5QQyA9IG5ldyBSZWdpc3RlcihcIlBDXCIsIFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpXHJcbiAgICAgICAgdGhpcy5JUiA9IG5ldyBSZWdpc3RlcihcIklSXCIsIFBzZXVkb0NQVS5PUENPREVfU0laRSk7XHJcbiAgICAgICAgdGhpcy5BQyA9IG5ldyBSZWdpc3RlcihcIkFDXCIsIFBzZXVkb0NQVS5XT1JEX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuTURSID0gbmV3IFJlZ2lzdGVyKFwiTURSXCIsIFBzZXVkb0NQVS5XT1JEX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuTUFSID0gbmV3IFJlZ2lzdGVyKFwiTUFSXCIsIFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuQUxVID0gbmV3IFBzZXVkb0FMVSh0aGlzLkFDLCB0aGlzLk1EUiwgUHNldWRvQ1BVLldPUkRfU0laRSk7XHJcbiAgICAgICAgdGhpcy5QUk9HID0gbmV3IE1lbW9yeShcIlBST0dcIiwgUHNldWRvQ1BVLlBST0dSQU1fTUVNT1JZX1NJWkUpXHJcbiAgICAgICAgdGhpcy5EQVRBID0gbmV3IE1lbW9yeShcIkRBVEFcIiwgUHNldWRvQ1BVLkRBVEFfTUVNT1JZX1NJWkUpO1xyXG4gICAgICAgIHRoaXMuTSA9IG5ldyBNZW1vcnlNYXAodGhpcy5NRFIsIHRoaXMuTUFSKTtcclxuICAgICAgICB0aGlzLk0ubWFwRXh0ZXJuYWxNZW1vcnkodGhpcy5QUk9HUkFNX01FTU9SWV9CRUdJTiwgUHNldWRvQ1BVLlBST0dSQU1fTUVNT1JZX1NJWkUsIE1lbW9yeUFjY2Vzcy5SRUFELCB0aGlzLlBST0cpO1xyXG4gICAgICAgIHRoaXMuTS5tYXBFeHRlcm5hbE1lbW9yeSh0aGlzLkRBVEFfTUVNT1JZX0JFR0lOLCBQc2V1ZG9DUFUuREFUQV9NRU1PUllfU0laRSwgTWVtb3J5QWNjZXNzLlJFQURfV1JJVEUsIHRoaXMuREFUQSk7XHJcbiAgICAgICAgdGhpcy5DVSA9IG5ldyBQc2V1ZG9DVSh0aGlzLklSLCB0aGlzLlBDLCB0aGlzLkFDLCB0aGlzLk1BUiwgdGhpcy5NRFIsIHRoaXMuQUxVLCB0aGlzLk0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGVwSW5zdHJ1Y3Rpb24oKSB7XHJcbiAgICAgICAgLy8gPT0gRmV0Y2ggQ3ljbGVcclxuICAgICAgICB0aGlzLkNVLmZldGNoQW5kRGVjb2RlTmV4dEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgLy8gPT0gRXhlY3V0ZSBDeWNsZVxyXG4gICAgICAgIHRoaXMuQ1UuZXhlY3V0ZUluc3RydWN0aW9uKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyB3cml0ZVByb2dyYW0oc3RhcnQ6IG51bWJlciwgLi4ucHJvZ3JhbTogQXJyYXk8SW5zdHJ1Y3Rpb24+KSB7XHJcbiAgICAgICAgcHJvZ3JhbS5mb3JFYWNoKChpbnN0cnVjdGlvbiwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLlBST0cud3JpdGUoc3RhcnQgKyBhZGRyZXNzIC0gdGhpcy5QUk9HUkFNX01FTU9SWV9CRUdJTiwgaW5zdHJ1Y3Rpb24uVkFMVUUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3cml0ZURhdGEoc3RhcnQ6IG51bWJlciwgLi4uZGF0YTogQXJyYXk8bnVtYmVyPikge1xyXG4gICAgICAgIGRhdGEuZm9yRWFjaCgodmFsdWUsIGFkZHJlc3MpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5EQVRBLndyaXRlKHN0YXJ0ICsgYWRkcmVzcyAtIHRoaXMuREFUQV9NRU1PUllfQkVHSU4sIHZhbHVlKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHtSZWdpc3Rlcn0gZnJvbSBcIkAvUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgTWVtb3J5TWFwIH0gZnJvbSBcIkAvTWVtb3J5TWFwXCI7XHJcbmltcG9ydCB7IENvbnRyb2xVbml0IH0gZnJvbSBcIkAvQ29udHJvbFVuaXRcIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NQVSB9IGZyb20gXCIuL1BzZXVkb0NQVVwiO1xyXG5pbXBvcnQgeyBQc2V1ZG9PcENvZGUgfSBmcm9tIFwiLi9Qc2V1ZG9JbnN0cnVjdGlvblwiO1xyXG5pbXBvcnQge1BzZXVkb0FMVX0gZnJvbSBcIi4vUHNldWRvQUxVXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUHNldWRvQ1UgaW1wbGVtZW50cyBDb250cm9sVW5pdCB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9pcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9wYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tYXI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FsdTogUHNldWRvQUxVO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWVtb3J5OiBNZW1vcnlNYXA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaXI6IFJlZ2lzdGVyLCBwYzogUmVnaXN0ZXIsIGFjOiBSZWdpc3RlciwgbWFyOiBSZWdpc3RlciwgbWRyOiBSZWdpc3RlciwgYWx1OiBQc2V1ZG9BTFUsIG1lbW9yeTogTWVtb3J5TWFwKSB7XHJcbiAgICAgICAgdGhpcy5faXIgPSBpcjtcclxuICAgICAgICB0aGlzLl9wYyA9IHBjO1xyXG4gICAgICAgIHRoaXMuX2FjID0gYWM7XHJcbiAgICAgICAgdGhpcy5fbWFyID0gbWFyO1xyXG4gICAgICAgIHRoaXMuX21kciA9IG1kcjtcclxuICAgICAgICB0aGlzLl9hbHUgPSBhbHU7XHJcbiAgICAgICAgdGhpcy5fbWVtb3J5ID0gbWVtb3J5O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFBlcmZvcm1zIGluc3RydWN0aW9uIGZldGNoIGFuZCBkZWNvZGUuXHJcbiAgICBwdWJsaWMgZmV0Y2hBbmREZWNvZGVOZXh0SW5zdHJ1Y3Rpb24oKSB7XHJcbiAgICAgICAgLy8gTUFSIDwtIFBDXHJcbiAgICAgICAgdGhpcy5fbWFyLndyaXRlKHRoaXMuX3BjLnJlYWQoKSk7XHJcbiAgICAgICAgLy8gUEMgPC0gUEMgKyAxXHJcbiAgICAgICAgdGhpcy5fcGMud3JpdGUodGhpcy5fcGMucmVhZCgpICsgMSk7XHJcbiAgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgIHRoaXMuX21lbW9yeS5sb2FkKCk7XHJcbiAgICAgICAgLy8gSVIgPC0gTURSKG9wY29kZSlcclxuICAgICAgICBsZXQgT1BDT0RFX1NISUZUID0gUHNldWRvQ1BVLldPUkRfU0laRSAtIFBzZXVkb0NQVS5PUENPREVfU0laRTtcclxuICAgICAgICBsZXQgb3Bjb2RlID0gdGhpcy5fbWRyLnJlYWQoKSA+PiBPUENPREVfU0hJRlQ7XHJcbiAgICAgICAgdGhpcy5faXIud3JpdGUob3Bjb2RlKTtcclxuICAgICAgICAvLyBNQVIgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgYWRkcmVzcyA9IHRoaXMuX21kci5yZWFkKCkgJiBBRERSRVNTX01BU0s7XHJcbiAgICAgICAgdGhpcy5fbWFyLndyaXRlKGFkZHJlc3MpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFeGVjdXRlcyB0aGUgY3VycmVudCBpbnN0cnVjdGlvbiBsb2FkZWQgaW50byBJUi5cclxuICAgIHB1YmxpYyBleGVjdXRlSW5zdHJ1Y3Rpb24oKSB7XHJcbiAgICAgICAgLy8gPT0gUHNldWRvQ1BVIEluc3RydWN0aW9uc1xyXG4gICAgICAgIC8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuICAgICAgICAvLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbiAgICAgICAgLy8gQUREIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDICsgTURSXHJcbiAgICAgICAgLy8gU1VCIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDIC0gTURSXHJcbiAgICAgICAgLy8gTkFORCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSB+KEFDICYgTURSKVxyXG4gICAgICAgIC8vIFNIRlQgeDogQUMgPC0gQUMgPDwgMVxyXG4gICAgICAgIC8vIEogeDogUEMgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG4gICAgICAgIGNvbnN0IFtJUiwgUEMsIEFDLCBNQVIsIE1EUiwgQUxVLCBNXSA9IFt0aGlzLl9pciwgdGhpcy5fcGMsIHRoaXMuX2FjLCB0aGlzLl9tYXIsIHRoaXMuX21kciwgdGhpcy5fYWx1LCB0aGlzLl9tZW1vcnldO1xyXG5cclxuICAgICAgICBjb25zdCBjb3B5ID0gKGRzdDogUmVnaXN0ZXIsIHNyYzogUmVnaXN0ZXIpID0+IGRzdC53cml0ZShzcmMucmVhZCgpKTtcclxuXHJcbiAgICAgICAgbGV0IG9wY29kZSA9IElSLnJlYWQoKTtcclxuICAgICAgICBzd2l0Y2ggKG9wY29kZSkge1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5MREE6ICAgICAgLy8gTERBIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBjb3B5KEFDLCBNRFIpOyAgICAgICAgICAvLyBBQyA8LSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5TVEE6ICAgICAgLy8gU1RBIHg6XHJcbiAgICAgICAgICAgICAgICBjb3B5KE1EUiwgQUMpOyAgICAgICAgICAvLyBNRFIgPC0gQUNcclxuICAgICAgICAgICAgICAgIE0uc3RvcmUoKTsgICAgICAgICAgICAgIC8vIE1bTUFSXSA8LSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFBzZXVkb09wQ29kZS5BREQ6ICAgICAgLy8gQUREIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgICAgICAgICBBTFUuYWRkKCk7ICAgICAgICAgICAgICAvLyBBQyA8LSBBQyArIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLlNVQjogICAgICAvLyBTVUIgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5zdWIoKTsgICAgICAgICAgICAgIC8vIEFDIDwtIEFDIC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuTkFORDogICAgIC8vIE5BTkQgeDpcclxuICAgICAgICAgICAgICAgIE0ubG9hZCgpOyAgICAgICAgICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5uYW5kKCk7ICAgICAgICAgICAgIC8vIEFDIDwtIH4oQUMgJiBNRFIpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuU0hGVDogICAgIC8vIFNIRlQ6XHJcbiAgICAgICAgICAgICAgICBBTFUuc2hmdCgpOyAgICAgICAgICAgICAvLyBBQyA8LSBBQyA8PCAxXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBQc2V1ZG9PcENvZGUuSjogICAgICAgIC8vIEogeDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBDIDwtIE1EUihhZGRyZXNzKVxyXG4gICAgICAgICAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpIC0gMTtcclxuICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTURSLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICAgICAgICAgIFBDLndyaXRlKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgUHNldWRvT3BDb2RlLkJORTogICAgICAvLyBCTkUgeDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChaICE9IDEpIHRoZW4gUEMgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICBpZiAoQUxVLlogIT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBQc2V1ZG9DUFUuQUREUkVTU19TSVpFKSAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSBNRFIucmVhZCgpICYgQUREUkVTU19NQVNLO1xyXG4gICAgICAgICAgICAgICAgICAgIFBDLndyaXRlKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBgVW5rbm93biBvcGNvZGU6ICR7b3Bjb2RlfWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiLy8gPT0gUHNldWRvQ1BVIEluc3RydWN0aW9uc1xyXG4vLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbi8vIFNUQSB4OiBNRFIgPC0gQUMsIE1bTUFSXSA8LSBNRFJcclxuLy8gQUREIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDICsgTURSXHJcbi8vIFNVQiB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyAtIE1EUlxyXG4vLyBOQU5EIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIH4oQUMgJiBNRFIpXHJcbi8vIFNIRlQgeDogQUMgPC0gQUMgPDwgMVxyXG4vLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4vLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbmltcG9ydCB7IEluc3RydWN0aW9uIH0gZnJvbSBcIkAvSW5zdHJ1Y3Rpb25cIjtcclxuXHJcbmltcG9ydCB7IFBzZXVkb0NQVSB9IGZyb20gXCIuL1BzZXVkb0NQVVwiO1xyXG5cclxuXHJcbmV4cG9ydCBlbnVtIFBzZXVkb09wQ29kZSB7XHJcbiAgICBMREEgID0gMGIwMDAsXHJcbiAgICBTVEEgID0gMGIwMDEsXHJcbiAgICBBREQgID0gMGIwMTAsXHJcbiAgICBTVUIgID0gMGIwMTEsXHJcbiAgICBOQU5EID0gMGIxMDAsXHJcbiAgICBTSEZUID0gMGIxMDEsXHJcbiAgICBKICAgID0gMGIxMTAsXHJcbiAgICBCTkUgID0gMGIxMTFcclxufVxyXG5cclxuLy8gSW5zdHJ1Y3Rpb24gbWVtb3J5IGZvcm1hdDpcclxuLy8gICAgICBbSW5zdHJ1Y3Rpb246IFdPUkRfU0laRV0gPSBbb3Bjb2RlOiBPUENPREVfU0laRV0gW29wZXJhbmQ6IEFERFJFU1NfU0laRV1cclxuLy8gT3BlcmFuZCB1c2FnZSBpcyBkZWZpbmVkIGJ5IHRoZSBvcGNvZGUuXHJcbi8vIE9wZXJhbmQgYWRkcmVzcyBpcyBsb2FkZWQgaW50byBNQVIgYWZ0ZXIgdGhlIGZldGNoIGFuZCBkZWNvZGUgY3ljbGUuXHJcbmV4cG9ydCBjbGFzcyBQc2V1ZG9JbnN0cnVjdGlvbiBpbXBsZW1lbnRzIEluc3RydWN0aW9uIHtcclxuICAgIHB1YmxpYyByZWFkb25seSBvcGNvZGU6IFBzZXVkb09wQ29kZTtcclxuICAgIHB1YmxpYyByZWFkb25seSBvcGVyYW5kOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgVkFMVUU6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihvcGNvZGU6IFBzZXVkb09wQ29kZSwgb3BlcmFuZDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5vcGNvZGUgPSBvcGNvZGU7XHJcbiAgICAgICAgdGhpcy5vcGVyYW5kID0gb3BlcmFuZDtcclxuICAgICAgICB0aGlzLlZBTFVFID0gKHRoaXMub3Bjb2RlIDw8IFBzZXVkb0NQVS5BRERSRVNTX1NJWkUpICsgdGhpcy5vcGVyYW5kO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgTERBICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5MREEsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU1RBICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5TVEEsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgQUREICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5BREQsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU1VCICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5TVUIsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgTkFORCAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IFBzZXVkb0luc3RydWN0aW9uKFBzZXVkb09wQ29kZS5OQU5ELCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IFNIRlQgICA9ICgpICAgICAgICAgICAgICAgID0+IG5ldyBQc2V1ZG9JbnN0cnVjdGlvbihQc2V1ZG9PcENvZGUuU0hGVCwgMCk7XHJcbmV4cG9ydCBjb25zdCBKICAgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkosICAgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBCTkUgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgUHNldWRvSW5zdHJ1Y3Rpb24oUHNldWRvT3BDb2RlLkJORSwgb3BlcmFuZCk7XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJpbXBvcnQgeyBQc2V1ZG9DUFUgfSBmcm9tIFwiQC9Qc2V1ZG9DUFUvUHNldWRvQ1BVXCI7XHJcbmltcG9ydCB7IFBzZXVkb09wQ29kZSwgTERBLCBTVEEsIEFERCwgU0hGVCB9IGZyb20gXCJAL1BzZXVkb0NQVS9Qc2V1ZG9JbnN0cnVjdGlvblwiO1xyXG5cclxuZnVuY3Rpb24gbWFpbigpIHtcclxuICAgIC8vIENvbnN0cnVjdCBhIEVDRTM3NSBQc2V1ZG8gQ1BVLCBmYWN0b3J5IG5ldyFcclxuICAgIGNvbnN0IENQVSA9IG5ldyBQc2V1ZG9DUFUoKTtcclxuXHJcbiAgICAvLyBEZWZpbmUgbGFiZWxzIGluIERBVEEgbWVtb3J5LlxyXG4gICAgbGV0IEEgPSBDUFUuREFUQV9NRU1PUllfQkVHSU47XHJcbiAgICBsZXQgQiA9IENQVS5EQVRBX01FTU9SWV9CRUdJTiArIDE7XHJcbiAgICBsZXQgQyA9IENQVS5EQVRBX01FTU9SWV9CRUdJTiArIDI7XHJcbiAgICAvLyBQcm9ncmFtLCBjb21wdXRlcyBDID0gNCpBICsgQlxyXG4gICAgY29uc3QgcHJvZ3JhbSA9IFtcclxuICAgICAgICBMREEoQSksXHJcbiAgICAgICAgU0hGVCgpLFxyXG4gICAgICAgIFNIRlQoKSxcclxuICAgICAgICBBREQoQiksXHJcbiAgICAgICAgU1RBKEMpXHJcbiAgICBdO1xyXG4gICAgLy8gV3JpdGUgcHJvZ3JhbSB0byBtZW1vcnkuXHJcbiAgICBDUFUud3JpdGVQcm9ncmFtKDAsIC4uLnByb2dyYW0pO1xyXG4gICAgLy8gSW5pdGlhbCB2YWx1ZXM6IEEgPSAyMCwgQiA9IDIwLCBDID0gMC5cclxuICAgIENQVS53cml0ZURhdGEoQSwgMjApO1xyXG4gICAgQ1BVLndyaXRlRGF0YShCLCAyMSk7XHJcblxyXG4gICAgZnVuY3Rpb24gcHJpbnRDUFUoKSB7XHJcbiAgICAgICAgY29uc3QgcHJpbnQgPSAoLi4uYXJnczogQXJyYXk8eyB0b1N0cmluZygpOiBzdHJpbmcgfT4pID0+IGNvbnNvbGUubG9nKC4uLmFyZ3MubWFwKHZhbHVlID0+IHZhbHVlLnRvU3RyaW5nKCkpKTtcclxuICAgICAgICBjb25zdCB7IFBDLCBJUiwgQUMsIE1EUiwgTUFSLCBBTFUsIFBST0csIERBVEEsIE0sIENVIH0gPSBDUFU7XHJcbiAgICAgICAgcHJpbnQoUEMpO1xyXG4gICAgICAgIHByaW50KElSLCBcIj0+XCIsIFBzZXVkb09wQ29kZVtJUi5yZWFkKCldKTtcclxuICAgICAgICBwcmludChBQywgXCI9PlwiLCBBQy5yZWFkKCkpO1xyXG4gICAgICAgIHByaW50KGBaPSR7QUxVLlp9YCk7XHJcbiAgICAgICAgcHJpbnQoTURSLCBcIj0+XCIsIE1EUi5yZWFkKCkpO1xyXG4gICAgICAgIHByaW50KE1BUik7XHJcbiAgICAgICAgcHJpbnQoYD09ICR7UFJPRy5OQU1FfSBtZW1vcnlgKVxyXG4gICAgICAgIHByaW50KFBST0cpO1xyXG4gICAgICAgIHByaW50KGA9PSAke0RBVEEuTkFNRX0gbWVtb3J5YClcclxuICAgICAgICBwcmludChEQVRBKTtcclxuICAgICAgICBjb25zb2xlLmxvZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IFNURVBfQ09VTlQgPSBwcm9ncmFtLmxlbmd0aDtcclxuICAgIGNvbnNvbGUubG9nKFwiPT0gSW5pdGlhbCBTdGF0ZVwiKTtcclxuICAgIHByaW50Q1BVKCk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFNURVBfQ09VTlQ7IGkrKykge1xyXG4gICAgICAgIENQVS5zdGVwSW5zdHJ1Y3Rpb24oKTtcclxuICAgICAgICBwcmludENQVSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tYWluKCk7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9