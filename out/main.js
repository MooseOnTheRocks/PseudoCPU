/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/pseudocpu/ArithmeticLogicUnit.ts":
/*!**********************************************!*\
  !*** ./src/pseudocpu/ArithmeticLogicUnit.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArithmeticLogicUnit = void 0;
const Register_1 = __webpack_require__(/*! ./Register */ "./src/pseudocpu/Register.ts");
const Constants_1 = __webpack_require__(/*! ./Constants */ "./src/pseudocpu/Constants.ts");
class ArithmeticLogicUnit {
    constructor(ac, mdr) {
        this._ac = ac;
        this._mdr = mdr;
        this._z = new Register_1.Register("Z", 1);
    }
    get Z() {
        return this._z.read();
    }
    set Z(value) {
        this._z.write(value);
    }
    add() {
        let WORD_MASK = (1 << Constants_1.WORD_SIZE) - 1;
        let sum = (this._ac.read() + this._mdr.read()) & WORD_MASK;
        this._ac.write(sum);
        this.Z = sum === 0 ? 1 : 0;
    }
    sub() {
        let WORD_MASK = (1 << Constants_1.WORD_SIZE) - 1;
        let difference = (this._ac.read() - this._mdr.read()) & WORD_MASK;
        this._ac.write(difference);
        this.Z = difference === 0 ? 1 : 0;
    }
    nand() {
        let WORD_MASK = (1 << Constants_1.WORD_SIZE) - 1;
        let result = ~(this._ac.read() & this._mdr.read()) & WORD_MASK;
        this._ac.write(result);
        this.Z = result === 0 ? 1 : 0;
    }
    shft() {
        let WORD_MASK = (1 << Constants_1.WORD_SIZE) - 1;
        let result = (this._ac.read() << 1) & WORD_MASK;
        this._ac.write(result);
        this.Z = result === 0 ? 1 : 0;
    }
}
exports.ArithmeticLogicUnit = ArithmeticLogicUnit;


/***/ }),

/***/ "./src/pseudocpu/Constants.ts":
/*!************************************!*\
  !*** ./src/pseudocpu/Constants.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DATA_MEMORY_SIZE = exports.PROGRAM_MEMORY_SIZE = exports.OPERAND_SIZE = exports.OPCODE_SIZE = exports.ADDRESS_SIZE = exports.WORD_SIZE = void 0;
exports.WORD_SIZE = 16; // word size in bits.
exports.ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
exports.OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
exports.OPERAND_SIZE = exports.ADDRESS_SIZE; // operand size in bits.
exports.PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
exports.DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.


/***/ }),

/***/ "./src/pseudocpu/ControlUnit.ts":
/*!**************************************!*\
  !*** ./src/pseudocpu/ControlUnit.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ControlUnit = void 0;
const Constants_1 = __webpack_require__(/*! ./Constants */ "./src/pseudocpu/Constants.ts");
const Instruction_1 = __webpack_require__(/*! ./Instruction */ "./src/pseudocpu/Instruction.ts");
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
    // Performs instruction fetch and decode.
    fetchAndDecodeNextInstruction() {
        // MAR <- PC
        this._mar.write(this._pc.read());
        // PC <- PC + 1
        this._pc.write(this._pc.read() + 1);
        // MDR <- M[MAR]
        this._memory.load();
        // IR <- MDR(opcode)
        let OPCODE_SHIFT = Constants_1.WORD_SIZE - Constants_1.OPCODE_SIZE;
        let opcode = this._mdr.read() >> OPCODE_SHIFT;
        this._ir.write(opcode);
        // MAR <- MDR(address)
        let ADDRESS_MASK = (1 << Constants_1.ADDRESS_SIZE) - 1;
        let address = this._mdr.read() & ADDRESS_MASK;
        this._mar.write(address);
    }
    executeInstruction() {
        // Instruction memory format:
        //      [Instruction: WORD_SIZE] =
        //          [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]
        // Operand usage is defined by the opcode.
        // Operand address is loaded into MAR after the fetch and decode cycle.
        //
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
            case Instruction_1.OpCode.LDA: // LDA x:
                M.load(); // MDR <- M[MAR]
                copy(AC, MDR); // AC <- MDR
                break;
            case Instruction_1.OpCode.STA: // STA x:
                copy(MDR, AC); // MDR <- AC
                M.store(); // M[MAR] <- MDR
                break;
            case Instruction_1.OpCode.ADD: // ADD x:
                M.load(); // MDR <- M[MAR]
                ALU.add(); // AC <- AC + MDR
                break;
            case Instruction_1.OpCode.SUB: // SUB x:
                M.load(); // MDR <- M[MAR]
                ALU.sub(); // AC <- AC - MDR
                break;
            case Instruction_1.OpCode.NAND: // NAND x:
                M.load(); // MDR <- M[MAR]
                ALU.nand(); // AC <- ~(AC & MDR)
                break;
            case Instruction_1.OpCode.SHFT: // SHFT:
                ALU.shft(); // AC <- AC << 1
                break;
            case Instruction_1.OpCode.J: // J x:
                // PC <- MDR(address)
                let ADDRESS_MASK = (1 << Constants_1.ADDRESS_SIZE) - 1;
                let address = MDR.read() & ADDRESS_MASK;
                PC.write(address);
                break;
            case Instruction_1.OpCode.BNE: // BNE x:
                // if (Z != 1) then PC <- MDR(address)
                if (ALU.Z != 1) {
                    let ADDRESS_MASK = (1 << Constants_1.ADDRESS_SIZE) - 1;
                    let address = MDR.read() & ADDRESS_MASK;
                    PC.write(address);
                }
                break;
            default:
                throw `Unknown opcode: ${opcode}`;
        }
    }
}
exports.ControlUnit = ControlUnit;


/***/ }),

/***/ "./src/pseudocpu/ECE375PseudoCPU.ts":
/*!******************************************!*\
  !*** ./src/pseudocpu/ECE375PseudoCPU.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ECE375PseudoCPU = void 0;
class ECE375PseudoCPU {
    constructor(components) {
        this.WORD_SIZE = 16; // word size in bits.
        this.ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
        this.OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
        this.OPERAND_SIZE = this.ADDRESS_SIZE; // operand size in bits.
        this.PC = components.PC;
        this.IR = components.IR;
        this.AC = components.AC;
        this.MDR = components.MDR;
        this.MAR = components.MAR;
        this.ALU = components.ALU;
        this.PROG = components.PROG;
        this.DATA = components.DATA;
        this.M = components.M;
        this.CU = components.CU;
        this.PROGRAM_MEMORY_SIZE = this.PROG.SIZE;
        this.DATA_MEMORY_SIZE = this.DATA.SIZE;
    }
    step() {
        // == Fetch Cycle
        this.CU.fetchAndDecodeNextInstruction();
        // == Execute Cycle
        this.CU.executeInstruction();
    }
    loadProgram(program, start) {
        program.forEach((instruction, address) => {
            address += start ? start : 0;
            this.PROG.write(address, instruction.value);
        });
    }
}
exports.ECE375PseudoCPU = ECE375PseudoCPU;


/***/ }),

/***/ "./src/pseudocpu/Instruction.ts":
/*!**************************************!*\
  !*** ./src/pseudocpu/Instruction.ts ***!
  \**************************************/
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
exports.BNE = exports.J = exports.SHFT = exports.NAND = exports.SUB = exports.ADD = exports.STA = exports.LDA = exports.Instruction = exports.OpCode = void 0;
const Constants_1 = __webpack_require__(/*! ./Constants */ "./src/pseudocpu/Constants.ts");
var OpCode;
(function (OpCode) {
    OpCode[OpCode["LDA"] = 0] = "LDA";
    OpCode[OpCode["STA"] = 1] = "STA";
    OpCode[OpCode["ADD"] = 2] = "ADD";
    OpCode[OpCode["SUB"] = 3] = "SUB";
    OpCode[OpCode["NAND"] = 4] = "NAND";
    OpCode[OpCode["SHFT"] = 5] = "SHFT";
    OpCode[OpCode["J"] = 6] = "J";
    OpCode[OpCode["BNE"] = 7] = "BNE";
})(OpCode = exports.OpCode || (exports.OpCode = {}));
class Instruction {
    constructor(opcode, operand) {
        this.opcode = opcode;
        this.operand = operand;
    }
    get value() {
        return (this.opcode << Constants_1.OPERAND_SIZE) + this.operand;
    }
}
exports.Instruction = Instruction;
const LDA = (operand) => new Instruction(OpCode.LDA, operand);
exports.LDA = LDA;
const STA = (operand) => new Instruction(OpCode.STA, operand);
exports.STA = STA;
const ADD = (operand) => new Instruction(OpCode.ADD, operand);
exports.ADD = ADD;
const SUB = (operand) => new Instruction(OpCode.SUB, operand);
exports.SUB = SUB;
const NAND = (operand) => new Instruction(OpCode.NAND, operand);
exports.NAND = NAND;
const SHFT = () => new Instruction(OpCode.SHFT, 0);
exports.SHFT = SHFT;
const J = (operand) => new Instruction(OpCode.J, operand);
exports.J = J;
const BNE = (operand) => new Instruction(OpCode.BNE, operand);
exports.BNE = BNE;


/***/ }),

/***/ "./src/pseudocpu/Memory.ts":
/*!*********************************!*\
  !*** ./src/pseudocpu/Memory.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Memory = void 0;
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
exports.Memory = Memory;


/***/ }),

/***/ "./src/pseudocpu/MemoryMap.ts":
/*!************************************!*\
  !*** ./src/pseudocpu/MemoryMap.ts ***!
  \************************************/
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

/***/ "./src/pseudocpu/Register.ts":
/*!***********************************!*\
  !*** ./src/pseudocpu/Register.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Register = void 0;
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
exports.Register = Register;


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
const Register_1 = __webpack_require__(/*! @/Register */ "./src/pseudocpu/Register.ts");
const ArithmeticLogicUnit_1 = __webpack_require__(/*! @/ArithmeticLogicUnit */ "./src/pseudocpu/ArithmeticLogicUnit.ts");
const Memory_1 = __webpack_require__(/*! @/Memory */ "./src/pseudocpu/Memory.ts");
const MemoryMap_1 = __webpack_require__(/*! @/MemoryMap */ "./src/pseudocpu/MemoryMap.ts");
const ControlUnit_1 = __webpack_require__(/*! @/ControlUnit */ "./src/pseudocpu/ControlUnit.ts");
const ECE375PseudoCPU_1 = __webpack_require__(/*! @/ECE375PseudoCPU */ "./src/pseudocpu/ECE375PseudoCPU.ts");
const Instruction_1 = __webpack_require__(/*! @/Instruction */ "./src/pseudocpu/Instruction.ts");
const Constants_1 = __webpack_require__(/*! @/Constants */ "./src/pseudocpu/Constants.ts");
function main() {
    const PC = new Register_1.Register("PC", Constants_1.ADDRESS_SIZE);
    const IR = new Register_1.Register("IR", Constants_1.OPCODE_SIZE);
    const AC = new Register_1.Register("AC", Constants_1.WORD_SIZE);
    const MDR = new Register_1.Register("MDR", Constants_1.WORD_SIZE);
    const MAR = new Register_1.Register("MAR", Constants_1.ADDRESS_SIZE);
    const ALU = new ArithmeticLogicUnit_1.ArithmeticLogicUnit(AC, MDR);
    const PROG = new Memory_1.Memory(Constants_1.PROGRAM_MEMORY_SIZE);
    const DATA = new Memory_1.Memory(Constants_1.DATA_MEMORY_SIZE);
    const M = new MemoryMap_1.MemoryMap(MDR, MAR);
    const CU = new ControlUnit_1.ControlUnit(IR, PC, AC, MAR, MDR, ALU, M);
    // Assemble the CPU.
    const CPU = new ECE375PseudoCPU_1.ECE375PseudoCPU({
        PC, IR, AC, MDR, MAR, ALU, PROG, DATA, M, CU
    });
    // Map data and program memory locations onto the MemoryMap.
    // Place 
    const DATA_BEGIN = PROG.SIZE;
    // Place program starting immedietaly after DATA.
    const PROG_BEGIN = 0;
    M.mapExternalMemory(DATA_BEGIN, DATA.SIZE, MemoryMap_1.MemoryAccess.READ_WRITE, DATA);
    M.mapExternalMemory(PROG_BEGIN, PROG.SIZE, MemoryMap_1.MemoryAccess.READ, PROG);
    // Point PC to first program instruction.
    PC.write(PROG_BEGIN);
    // Program to compute the code C = 4*A + B.
    // Labels from perspective of MemoryMap.
    let A = DATA_BEGIN; // Label A = DATA[0]
    let B = DATA_BEGIN + 1; // Label B = DATA[1]
    let C = DATA_BEGIN + 2; // Label C = DATA[2]
    const program = [
        (0, Instruction_1.LDA)(A),
        (0, Instruction_1.SHFT)(),
        (0, Instruction_1.SHFT)(),
        (0, Instruction_1.ADD)(B),
        (0, Instruction_1.STA)(C),
    ];
    // Write the program into program memory.
    CPU.loadProgram(program);
    // Write initial values into data memory.
    // Normalizing labels since I'm writing to Memory (local address) not MemoryMap (mapped address).
    DATA.write(A - DATA_BEGIN, 20); // M[A] = 20
    DATA.write(B - DATA_BEGIN, 20); // M[B] = 20
    function printState() {
        const print = (...args) => console.log(...args.map(value => value.toString()));
        print("==========");
        print("== Registers");
        print(PC);
        print(IR, "=>", Instruction_1.OpCode[IR.read()]);
        print(AC, "|", `Z=${ALU.Z}`);
        print(MDR);
        print(MAR);
        print("== Program Memory");
        print(PROG.toString(PROG_BEGIN));
        print("== Data Memory");
        print(DATA.toString(DATA_BEGIN));
        print("\n");
    }
    // Run every instruction in the program.
    // Print the CPU state after each step.
    console.log("== Initial State");
    printState();
    const NUM_INSTRUCTIONS = program.length;
    for (let i = 0; i < NUM_INSTRUCTIONS; i++) {
        CPU.step();
        console.log(`Step #${i + 1}`);
        printState();
    }
}
main();

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsd0ZBQW9DO0FBQ3BDLDJGQUF3QztBQUV4QyxNQUFhLG1CQUFtQjtJQUs1QixZQUFZLEVBQVksRUFBRSxHQUFhO1FBQ25DLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLG1CQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxJQUFXLENBQUM7UUFDUixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELElBQVcsQ0FBQyxDQUFDLEtBQWE7UUFDdEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVNLEdBQUc7UUFDTixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxxQkFBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQzNELElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVNLEdBQUc7UUFDTixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxxQkFBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVNLElBQUk7UUFDUCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxxQkFBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUM7UUFDL0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sSUFBSTtRQUNQLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLHFCQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztRQUNoRCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7Q0FDSjtBQTlDRCxrREE4Q0M7Ozs7Ozs7Ozs7Ozs7O0FDakRZLGlCQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMscUJBQXFCO0FBQ3JDLG9CQUFZLEdBQUcsRUFBRSxDQUFDLENBQUMsd0VBQXdFO0FBQzNGLG1CQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0RBQWdEO0FBQ2pFLG9CQUFZLEdBQUcsb0JBQVksQ0FBQyxDQUFDLHdCQUF3QjtBQUVyRCwyQkFBbUIsR0FBRyxJQUFJLENBQUMsQ0FBQyx1Q0FBdUM7QUFDbkUsd0JBQWdCLEdBQUcsSUFBSSxDQUFDLENBQUMsb0NBQW9DOzs7Ozs7Ozs7Ozs7OztBQ0gxRSwyRkFBaUY7QUFDakYsaUdBQXVDO0FBRXZDLE1BQWEsV0FBVztJQVNwQixZQUFZLEVBQVksRUFBRSxFQUFZLEVBQUUsRUFBWSxFQUFFLEdBQWEsRUFBRSxHQUFhLEVBQUUsR0FBd0IsRUFBRSxNQUFpQjtRQUMzSCxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNkLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRUQseUNBQXlDO0lBQ2xDLDZCQUE2QjtRQUNoQyxZQUFZO1FBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2pDLGVBQWU7UUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3BCLG9CQUFvQjtRQUNwQixJQUFJLFlBQVksR0FBRyxxQkFBUyxHQUFHLHVCQUFXLENBQUM7UUFDM0MsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxZQUFZLENBQUM7UUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkIsc0JBQXNCO1FBQ3RCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLHdCQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxZQUFZLENBQUM7UUFDOUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVNLGtCQUFrQjtRQUNyQiw2QkFBNkI7UUFDN0Isa0NBQWtDO1FBQ2xDLHlEQUF5RDtRQUN6RCwwQ0FBMEM7UUFDMUMsdUVBQXVFO1FBQ3ZFLEVBQUU7UUFDRiw0QkFBNEI7UUFDNUIsa0NBQWtDO1FBQ2xDLGtDQUFrQztRQUNsQyx1Q0FBdUM7UUFDdkMsdUNBQXVDO1FBQ3ZDLDJDQUEyQztRQUMzQyx3QkFBd0I7UUFDeEIsMEJBQTBCO1FBQzFCLDZDQUE2QztRQUU3QyxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFckgsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFhLEVBQUUsR0FBYSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJFLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixRQUFRLE1BQU0sRUFBRTtZQUNaLEtBQUssb0JBQU0sQ0FBQyxHQUFHLEVBQUssU0FBUztnQkFDekIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQU8sZ0JBQWdCO2dCQUNoQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUUsWUFBWTtnQkFDNUIsTUFBTTtZQUNWLEtBQUssb0JBQU0sQ0FBQyxHQUFHLEVBQUssU0FBUztnQkFDekIsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFFLFlBQVk7Z0JBQzVCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFNLGdCQUFnQjtnQkFDaEMsTUFBTTtZQUNWLEtBQUssb0JBQU0sQ0FBQyxHQUFHLEVBQUssU0FBUztnQkFDekIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQU8sZ0JBQWdCO2dCQUNoQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBTSxpQkFBaUI7Z0JBQ2pDLE1BQU07WUFDVixLQUFLLG9CQUFNLENBQUMsR0FBRyxFQUFLLFNBQVM7Z0JBQ3pCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFPLGdCQUFnQjtnQkFDaEMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQU0saUJBQWlCO2dCQUNqQyxNQUFNO1lBQ1YsS0FBSyxvQkFBTSxDQUFDLElBQUksRUFBSSxVQUFVO2dCQUMxQixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBTyxnQkFBZ0I7Z0JBQ2hDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFLLG9CQUFvQjtnQkFDcEMsTUFBTTtZQUNWLEtBQUssb0JBQU0sQ0FBQyxJQUFJLEVBQUksUUFBUTtnQkFDeEIsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUssZ0JBQWdCO2dCQUNoQyxNQUFNO1lBQ1YsS0FBSyxvQkFBTSxDQUFDLENBQUMsRUFBTyxPQUFPO2dCQUNQLHFCQUFxQjtnQkFDckMsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLElBQUksd0JBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQztnQkFDeEMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbEIsTUFBTTtZQUNWLEtBQUssb0JBQU0sQ0FBQyxHQUFHLEVBQUssU0FBUztnQkFDVCxzQ0FBc0M7Z0JBQ3RELElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ1osSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLElBQUksd0JBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0MsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQztvQkFDeEMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDckI7Z0JBQ0QsTUFBTTtZQUNWO2dCQUNJLE1BQU0sbUJBQW1CLE1BQU0sRUFBRSxDQUFDO1NBQ3pDO0lBQ0wsQ0FBQztDQUNKO0FBckdELGtDQXFHQzs7Ozs7Ozs7Ozs7Ozs7QUN2RkQsTUFBYSxlQUFlO0lBb0J4QixZQUFZLFVBQXVDO1FBbkJuQyxjQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMscUJBQXFCO1FBQ3JDLGlCQUFZLEdBQUcsRUFBRSxDQUFDLENBQUMsd0VBQXdFO1FBQzNGLGdCQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0RBQWdEO1FBQ2pFLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLHdCQUF3QjtRQWlCdEUsSUFBSSxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxFQUFFLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDO1FBQzFCLElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQztRQUMxQixJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUM7UUFDMUIsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO1FBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztRQUM1QixJQUFJLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBRXhCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUMxQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDM0MsQ0FBQztJQUVNLElBQUk7UUFDUCxpQkFBaUI7UUFDakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO1FBQ3hDLG1CQUFtQjtRQUNuQixJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVNLFdBQVcsQ0FBQyxPQUEyQixFQUFFLEtBQWM7UUFDMUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUNyQyxPQUFPLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBakRELDBDQWlEQzs7Ozs7Ozs7Ozs7O0FDckVELDRCQUE0QjtBQUM1QixrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLHVDQUF1QztBQUN2Qyx1Q0FBdUM7QUFDdkMsMkNBQTJDO0FBQzNDLHdCQUF3QjtBQUN4QiwwQkFBMEI7QUFDMUIsNkNBQTZDOzs7QUFFN0MsMkZBQTJDO0FBRTNDLElBQVksTUFTWDtBQVRELFdBQVksTUFBTTtJQUNkLGlDQUFZO0lBQ1osaUNBQVk7SUFDWixpQ0FBWTtJQUNaLGlDQUFZO0lBQ1osbUNBQVk7SUFDWixtQ0FBWTtJQUNaLDZCQUFZO0lBQ1osaUNBQVk7QUFDaEIsQ0FBQyxFQVRXLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQVNqQjtBQUVELE1BQWEsV0FBVztJQUlwQixZQUFZLE1BQWMsRUFBRSxPQUFlO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQzNCLENBQUM7SUFFRCxJQUFXLEtBQUs7UUFDWixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSx3QkFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN4RCxDQUFDO0NBQ0o7QUFaRCxrQ0FZQztBQUVNLE1BQU0sR0FBRyxHQUFNLENBQUMsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQW5FLFdBQUcsT0FBZ0U7QUFDekUsTUFBTSxHQUFHLEdBQU0sQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBbkUsV0FBRyxPQUFnRTtBQUN6RSxNQUFNLEdBQUcsR0FBTSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUFuRSxXQUFHLE9BQWdFO0FBQ3pFLE1BQU0sR0FBRyxHQUFNLENBQUMsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQW5FLFdBQUcsT0FBZ0U7QUFDekUsTUFBTSxJQUFJLEdBQUssQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBcEUsWUFBSSxRQUFnRTtBQUMxRSxNQUFNLElBQUksR0FBSyxHQUFrQixFQUFFLENBQUMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztBQUE5RCxZQUFJLFFBQTBEO0FBQ3BFLE1BQU0sQ0FBQyxHQUFRLENBQUMsT0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFJLE9BQU8sQ0FBQyxDQUFDO0FBQW5FLFNBQUMsS0FBa0U7QUFDekUsTUFBTSxHQUFHLEdBQU0sQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBbkUsV0FBRyxPQUFnRTs7Ozs7Ozs7Ozs7Ozs7QUM1Q2hGLE1BQWEsTUFBTTtJQUlmLFlBQVksSUFBWTtRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxDQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRU0sS0FBSyxDQUFDLE9BQWUsRUFBRSxLQUFhO1FBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLENBQUM7SUFFTSxJQUFJLENBQUMsT0FBZTtRQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVNLFFBQVEsQ0FBQyxVQUFtQjtRQUMvQixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoQyxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUU7UUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztDQUNKO0FBMUJELHdCQTBCQzs7Ozs7Ozs7Ozs7Ozs7QUNsQkQsSUFBWSxZQUlYO0FBSkQsV0FBWSxZQUFZO0lBQ3BCLCtDQUFJO0lBQ0osaURBQUs7SUFDTCwyREFBVTtBQUNkLENBQUMsRUFKVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQUl2QjtBQUVELE1BQWEsU0FBUztJQU1sQixZQUFZLEdBQWEsRUFBRSxHQUFhO1FBQ3BDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRU8sa0JBQWtCLENBQUMsT0FBZTtRQUN0QyxJQUFJLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFO1lBQ3hCLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQUksT0FBTyxJQUFJLEtBQUssSUFBSSxPQUFPLElBQUksR0FBRyxFQUFFO2dCQUNwQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ25DO1NBQ0o7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNyQixDQUFDO0lBRU0sSUFBSTtRQUNQLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtZQUN2QixNQUFNLDJDQUEyQyxDQUFDO1NBQ3JEO2FBQ0k7WUFDRCxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3pCO0lBQ0wsQ0FBQztJQUVNLEtBQUs7UUFDUixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQy9CLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7WUFDdkIsTUFBTSwwQ0FBMEMsQ0FBQztTQUNwRDthQUNJO1lBQ0QsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNoQztJQUNMLENBQUM7SUFFTSxpQkFBaUIsQ0FBQyxLQUFhLEVBQUUsTUFBYyxFQUFFLElBQWtCLEVBQUUsQ0FBUztRQUNqRixTQUFTLElBQUksQ0FBQyxPQUFlO1lBQ3pCLElBQUksSUFBSSxLQUFLLFlBQVksQ0FBQyxLQUFLLEVBQUU7Z0JBQzdCLE1BQU0sNkNBQTZDO2FBQ3REO1lBQ0QsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsU0FBUyxLQUFLLENBQUMsT0FBZSxFQUFFLEtBQWE7WUFDekMsSUFBSSxJQUFJLEtBQUssWUFBWSxDQUFDLElBQUksRUFBRTtnQkFDNUIsTUFBTSwyQ0FBMkM7YUFDcEQ7WUFDRCxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksS0FBSyxHQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFTSxXQUFXLENBQUMsQ0FBUyxFQUFFLENBQVc7UUFDckMsU0FBUyxJQUFJLENBQUMsT0FBZTtZQUN6QixPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBRUQsU0FBUyxLQUFLLENBQUMsT0FBZSxFQUFFLEtBQWE7WUFDekMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRUQsSUFBSSxLQUFLLEdBQXFCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FDSjtBQTlFRCw4QkE4RUM7Ozs7Ozs7Ozs7Ozs7O0FDNUZELE1BQWEsUUFBUTtJQUtqQixZQUFZLElBQVksRUFBRSxJQUFZO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFTSxLQUFLLENBQUMsS0FBYTtRQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBRU0sSUFBSTtRQUNQLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN0QixDQUFDO0lBRU0sUUFBUTtRQUNYLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7SUFDeEQsQ0FBQztDQUNKO0FBdEJELDRCQXNCQzs7Ozs7OztVQ3RCRDtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7Ozs7Ozs7OztBQ3JCQSxlQUFlO0FBQ2YsZ0NBQWdDO0FBQ2hDLDBCQUEwQjtBQUMxQix5Q0FBeUM7QUFDekMsMENBQTBDO0FBQzFDLDJCQUEyQjtBQUMzQix5Q0FBeUM7QUFDekMsbURBQW1EO0FBQ25ELHlDQUF5QztBQUN6Qyw0QkFBNEI7QUFDNUIsaURBQWlEO0FBQ2pELDREQUE0RDtBQUM1RCwyREFBMkQ7QUFDM0QsbUNBQW1DO0FBQ25DLGlEQUFpRDtBQUNqRCw4REFBOEQ7QUFDOUQsZ0VBQWdFO0FBQ2hFLHVDQUF1QztBQUN2QyxrREFBa0Q7QUFDbEQsb0VBQW9FO0FBQ3BFLCtEQUErRDtBQUMvRCxlQUFlO0FBQ2YsZ0JBQWdCO0FBQ2hCLHlEQUF5RDtBQUN6RCxvQ0FBb0M7QUFDcEMsc0JBQXNCO0FBQ3RCLGNBQWM7QUFDZCwwREFBMEQ7QUFDMUQsNERBQTREO0FBQzVELDRDQUE0QztBQUM1QyxhQUFhO0FBQ2IseUZBQXlGO0FBQ3pGLDREQUE0RDtBQUM1RCxzREFBc0Q7QUFDdEQsR0FBRztBQUNILGdDQUFnQztBQUNoQyx1QkFBdUI7QUFDdkIscUJBQXFCO0FBQ3JCLHFCQUFxQjtBQUNyQixtQkFBbUI7QUFDbkIsZ0JBQWdCO0FBQ2hCLGtDQUFrQztBQUNsQyxvQkFBb0I7QUFDcEIsb0JBQW9CO0FBQ3BCLHFCQUFxQjtBQUNyQixxQkFBcUI7QUFDckIsRUFBRTtBQUNGLHdCQUF3QjtBQUN4QixXQUFXO0FBQ1gseUNBQXlDO0FBQ3pDLHlEQUF5RDtBQUN6RCx5REFBeUQ7QUFDekQsZ0ZBQWdGO0FBQ2hGLEVBQUU7QUFDRixRQUFRO0FBQ1IsbUVBQW1FO0FBQ25FLGVBQWU7QUFDZixnQkFBZ0I7QUFDaEIsZUFBZTtBQUNmLGdCQUFnQjtBQUNoQixFQUFFO0FBQ0YsaUJBQWlCO0FBQ2pCLHVEQUF1RDtBQUN2RCxFQUFFO0FBQ0YsaUJBQWlCO0FBQ2pCLHlDQUF5QztBQUN6QyxFQUFFO0FBQ0YsaUJBQWlCO0FBQ2pCLGlDQUFpQztBQUNqQyxFQUFFO0FBQ0YsZ0JBQWdCO0FBQ2hCLDZCQUE2QjtBQUM3QixFQUFFO0FBQ0YsZ0JBQWdCO0FBQ2hCLCtDQUErQztBQUMvQyxFQUFFO0FBQ0YsZ0JBQWdCO0FBQ2hCLDhDQUE4QztBQUM5Qyw4Q0FBOEM7QUFDOUMsRUFBRTtBQUNGLDRCQUE0QjtBQUM1QixrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLHVDQUF1QztBQUN2QywwQkFBMEI7QUFDMUIsNkNBQTZDOztBQUU3Qyx3RkFBc0M7QUFDdEMseUhBQTREO0FBQzVELGtGQUFrQztBQUNsQywyRkFBc0Q7QUFDdEQsaUdBQTRDO0FBQzVDLDZHQUFvRDtBQUNwRCxpR0FBNEY7QUFDNUYsMkZBQTBHO0FBRTFHLFNBQVMsSUFBSTtJQUNULE1BQU0sRUFBRSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLEVBQUUsd0JBQVksQ0FBQyxDQUFDO0lBQzVDLE1BQU0sRUFBRSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLEVBQUUsdUJBQVcsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sRUFBRSxHQUFHLElBQUksbUJBQVEsQ0FBQyxJQUFJLEVBQUUscUJBQVMsQ0FBQyxDQUFDO0lBQ3pDLE1BQU0sR0FBRyxHQUFHLElBQUksbUJBQVEsQ0FBQyxLQUFLLEVBQUUscUJBQVMsQ0FBQyxDQUFDO0lBQzNDLE1BQU0sR0FBRyxHQUFHLElBQUksbUJBQVEsQ0FBQyxLQUFLLEVBQUUsd0JBQVksQ0FBQyxDQUFDO0lBQzlDLE1BQU0sR0FBRyxHQUFHLElBQUkseUNBQW1CLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzdDLE1BQU0sSUFBSSxHQUFHLElBQUksZUFBTSxDQUFDLCtCQUFtQixDQUFDLENBQUM7SUFDN0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxlQUFNLENBQUMsNEJBQWdCLENBQUMsQ0FBQztJQUMxQyxNQUFNLENBQUMsR0FBRyxJQUFJLHFCQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sRUFBRSxHQUFHLElBQUkseUJBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN6RCxvQkFBb0I7SUFDcEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQ0FBZSxDQUFDO1FBQzVCLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7S0FDL0MsQ0FBQyxDQUFDO0lBRUgsNERBQTREO0lBQzVELFNBQVM7SUFDVCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQzdCLGlEQUFpRDtJQUNqRCxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLHdCQUFZLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSx3QkFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRSx5Q0FBeUM7SUFDekMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUVyQiwyQ0FBMkM7SUFDM0Msd0NBQXdDO0lBQ3hDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFLLG9CQUFvQjtJQUM1QyxJQUFJLENBQUMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsb0JBQW9CO0lBQzVDLElBQUksQ0FBQyxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7SUFDNUMsTUFBTSxPQUFPLEdBQXVCO1FBQ2hDLHFCQUFHLEVBQUMsQ0FBQyxDQUFDO1FBQ04sc0JBQUksR0FBRTtRQUNOLHNCQUFJLEdBQUU7UUFDTixxQkFBRyxFQUFDLENBQUMsQ0FBQztRQUNOLHFCQUFHLEVBQUMsQ0FBQyxDQUFDO0tBQ1QsQ0FBQztJQUNGLHlDQUF5QztJQUN6QyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pCLHlDQUF5QztJQUN6QyxpR0FBaUc7SUFDakcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUksWUFBWTtJQUMvQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBSSxZQUFZO0lBRS9DLFNBQVMsVUFBVTtRQUNmLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFpQyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BCLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN0QixLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDVixLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxvQkFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3QixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxLQUFLLENBQUMsbUJBQW1CLENBQUM7UUFDMUIsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNqQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN4QixLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRUQsd0NBQXdDO0lBQ3hDLHVDQUF1QztJQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDaEMsVUFBVSxFQUFFLENBQUM7SUFDYixNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGdCQUFnQixFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDN0IsVUFBVSxFQUFFLENBQUM7S0FDaEI7QUFDTCxDQUFDO0FBRUQsSUFBSSxFQUFFLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvcHNldWRvY3B1L0FyaXRobWV0aWNMb2dpY1VuaXQudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL3BzZXVkb2NwdS9Db25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1Ly4vc3JjL3BzZXVkb2NwdS9Db250cm9sVW5pdC50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvcHNldWRvY3B1L0VDRTM3NVBzZXVkb0NQVS50cyIsIndlYnBhY2s6Ly9wc2V1ZG9jcHUvLi9zcmMvcHNldWRvY3B1L0luc3RydWN0aW9uLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9wc2V1ZG9jcHUvTWVtb3J5LnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9wc2V1ZG9jcHUvTWVtb3J5TWFwLnRzIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9wc2V1ZG9jcHUvUmVnaXN0ZXIudHMiLCJ3ZWJwYWNrOi8vcHNldWRvY3B1L3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3BzZXVkb2NwdS8uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7UmVnaXN0ZXJ9IGZyb20gXCIuL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IFdPUkRfU0laRSB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFyaXRobWV0aWNMb2dpY1VuaXQge1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfYWM6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX3o6IFJlZ2lzdGVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFjOiBSZWdpc3RlciwgbWRyOiBSZWdpc3Rlcikge1xyXG4gICAgICAgIHRoaXMuX2FjID0gYWM7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX3ogPSBuZXcgUmVnaXN0ZXIoXCJaXCIsIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXQgWigpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl96LnJlYWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0IFoodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX3oud3JpdGUodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IFdPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBzdW0gPSAodGhpcy5fYWMucmVhZCgpICsgdGhpcy5fbWRyLnJlYWQoKSkgJiBXT1JEX01BU0s7XHJcbiAgICAgICAgdGhpcy5fYWMud3JpdGUoc3VtKTtcclxuICAgICAgICB0aGlzLlogPSBzdW0gPT09IDAgPyAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3ViKCkge1xyXG4gICAgICAgIGxldCBXT1JEX01BU0sgPSAoMSA8PCBXT1JEX1NJWkUpIC0gMTtcclxuICAgICAgICBsZXQgZGlmZmVyZW5jZSA9ICh0aGlzLl9hYy5yZWFkKCkgLSB0aGlzLl9tZHIucmVhZCgpKSAmIFdPUkRfTUFTSztcclxuICAgICAgICB0aGlzLl9hYy53cml0ZShkaWZmZXJlbmNlKTtcclxuICAgICAgICB0aGlzLlogPSBkaWZmZXJlbmNlID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG5hbmQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IFdPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSB+KHRoaXMuX2FjLnJlYWQoKSAmIHRoaXMuX21kci5yZWFkKCkpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5aID0gcmVzdWx0ID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNoZnQoKSB7XHJcbiAgICAgICAgbGV0IFdPUkRfTUFTSyA9ICgxIDw8IFdPUkRfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCByZXN1bHQgPSAodGhpcy5fYWMucmVhZCgpIDw8IDEpICYgV09SRF9NQVNLO1xyXG4gICAgICAgIHRoaXMuX2FjLndyaXRlKHJlc3VsdCk7XHJcbiAgICAgICAgdGhpcy5aID0gcmVzdWx0ID09PSAwID8gMSA6IDA7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgY29uc3QgV09SRF9TSVpFID0gMTY7IC8vIHdvcmQgc2l6ZSBpbiBiaXRzLlxyXG5leHBvcnQgY29uc3QgQUREUkVTU19TSVpFID0gMTM7IC8vIGFkZHJlc3Mgc2l6ZSBpbiBiaXRzOyAyKioxMyA9IDB4MjAwMCA9IDgxOTIgYWRkcmVzc2FibGUgd29yZHMgbWVtb3J5LlxyXG5leHBvcnQgY29uc3QgT1BDT0RFX1NJWkUgPSAzOyAvLyBvcGNvZGUgc2l6ZSBpbiBiaXRzLCAyKiozID0gOCB1bmlxdWUgb3Bjb2Rlcy5cclxuZXhwb3J0IGNvbnN0IE9QRVJBTkRfU0laRSA9IEFERFJFU1NfU0laRTsgLy8gb3BlcmFuZCBzaXplIGluIGJpdHMuXHJcblxyXG5leHBvcnQgY29uc3QgUFJPR1JBTV9NRU1PUllfU0laRSA9IDB4MDg7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIHByb2dyYW0gbWVtb3J5LlxyXG5leHBvcnQgY29uc3QgREFUQV9NRU1PUllfU0laRSA9IDB4MDg7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIGRhdGEgbWVtb3J5LiIsImltcG9ydCB7UmVnaXN0ZXJ9IGZyb20gXCIuL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7QXJpdGhtZXRpY0xvZ2ljVW5pdH0gZnJvbSBcIi4vQXJpdGhtZXRpY0xvZ2ljVW5pdFwiO1xyXG5pbXBvcnQgeyBNZW1vcnlNYXAgfSBmcm9tIFwiLi9NZW1vcnlNYXBcIjtcclxuaW1wb3J0IHsgT1BFUkFORF9TSVpFLCBBRERSRVNTX1NJWkUsIFdPUkRfU0laRSwgT1BDT0RFX1NJWkUgfSBmcm9tIFwiLi9Db25zdGFudHNcIjtcclxuaW1wb3J0IHsgT3BDb2RlIH0gZnJvbSBcIi4vSW5zdHJ1Y3Rpb25cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb250cm9sVW5pdCB7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9pcjogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9wYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9hYzogUmVnaXN0ZXI7XHJcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9tYXI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSByZWFkb25seSBfbWRyOiBSZWdpc3RlcjtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX2FsdTogQXJpdGhtZXRpY0xvZ2ljVW5pdDtcclxuICAgIHByaXZhdGUgcmVhZG9ubHkgX21lbW9yeTogTWVtb3J5TWFwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlyOiBSZWdpc3RlciwgcGM6IFJlZ2lzdGVyLCBhYzogUmVnaXN0ZXIsIG1hcjogUmVnaXN0ZXIsIG1kcjogUmVnaXN0ZXIsIGFsdTogQXJpdGhtZXRpY0xvZ2ljVW5pdCwgbWVtb3J5OiBNZW1vcnlNYXApIHtcclxuICAgICAgICB0aGlzLl9pciA9IGlyO1xyXG4gICAgICAgIHRoaXMuX3BjID0gcGM7XHJcbiAgICAgICAgdGhpcy5fYWMgPSBhYztcclxuICAgICAgICB0aGlzLl9tYXIgPSBtYXI7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX2FsdSA9IGFsdTtcclxuICAgICAgICB0aGlzLl9tZW1vcnkgPSBtZW1vcnk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGVyZm9ybXMgaW5zdHJ1Y3Rpb24gZmV0Y2ggYW5kIGRlY29kZS5cclxuICAgIHB1YmxpYyBmZXRjaEFuZERlY29kZU5leHRJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyBNQVIgPC0gUENcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUodGhpcy5fcGMucmVhZCgpKTtcclxuICAgICAgICAvLyBQQyA8LSBQQyArIDFcclxuICAgICAgICB0aGlzLl9wYy53cml0ZSh0aGlzLl9wYy5yZWFkKCkgKyAxKTtcclxuICAgICAgICAvLyBNRFIgPC0gTVtNQVJdXHJcbiAgICAgICAgdGhpcy5fbWVtb3J5LmxvYWQoKTtcclxuICAgICAgICAvLyBJUiA8LSBNRFIob3Bjb2RlKVxyXG4gICAgICAgIGxldCBPUENPREVfU0hJRlQgPSBXT1JEX1NJWkUgLSBPUENPREVfU0laRTtcclxuICAgICAgICBsZXQgb3Bjb2RlID0gdGhpcy5fbWRyLnJlYWQoKSA+PiBPUENPREVfU0hJRlQ7XHJcbiAgICAgICAgdGhpcy5faXIud3JpdGUob3Bjb2RlKTtcclxuICAgICAgICAvLyBNQVIgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IEFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgIGxldCBhZGRyZXNzID0gdGhpcy5fbWRyLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICB0aGlzLl9tYXIud3JpdGUoYWRkcmVzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWN1dGVJbnN0cnVjdGlvbigpIHtcclxuICAgICAgICAvLyBJbnN0cnVjdGlvbiBtZW1vcnkgZm9ybWF0OlxyXG4gICAgICAgIC8vICAgICAgW0luc3RydWN0aW9uOiBXT1JEX1NJWkVdID1cclxuICAgICAgICAvLyAgICAgICAgICBbb3Bjb2RlOiBPUENPREVfU0laRV0gW29wZXJhbmQ6IEFERFJFU1NfU0laRV1cclxuICAgICAgICAvLyBPcGVyYW5kIHVzYWdlIGlzIGRlZmluZWQgYnkgdGhlIG9wY29kZS5cclxuICAgICAgICAvLyBPcGVyYW5kIGFkZHJlc3MgaXMgbG9hZGVkIGludG8gTUFSIGFmdGVyIHRoZSBmZXRjaCBhbmQgZGVjb2RlIGN5Y2xlLlxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gPT0gUHNldWRvQ1BVIEluc3RydWN0aW9uc1xyXG4gICAgICAgIC8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuICAgICAgICAvLyBTVEEgeDogTURSIDwtIEFDLCBNW01BUl0gPC0gTURSXHJcbiAgICAgICAgLy8gQUREIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDICsgTURSXHJcbiAgICAgICAgLy8gU1VCIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDIC0gTURSXHJcbiAgICAgICAgLy8gTkFORCB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSB+KEFDICYgTURSKVxyXG4gICAgICAgIC8vIFNIRlQgeDogQUMgPC0gQUMgPDwgMVxyXG4gICAgICAgIC8vIEogeDogUEMgPC0gTURSKGFkZHJlc3MpXHJcbiAgICAgICAgLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG4gICAgICAgIGNvbnN0IFtJUiwgUEMsIEFDLCBNQVIsIE1EUiwgQUxVLCBNXSA9IFt0aGlzLl9pciwgdGhpcy5fcGMsIHRoaXMuX2FjLCB0aGlzLl9tYXIsIHRoaXMuX21kciwgdGhpcy5fYWx1LCB0aGlzLl9tZW1vcnldO1xyXG5cclxuICAgICAgICBjb25zdCBjb3B5ID0gKGRzdDogUmVnaXN0ZXIsIHNyYzogUmVnaXN0ZXIpID0+IGRzdC53cml0ZShzcmMucmVhZCgpKTtcclxuXHJcbiAgICAgICAgbGV0IG9wY29kZSA9IElSLnJlYWQoKTtcclxuICAgICAgICBzd2l0Y2ggKG9wY29kZSkge1xyXG4gICAgICAgICAgICBjYXNlIE9wQ29kZS5MREE6ICAgIC8vIExEQSB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIGNvcHkoQUMsIE1EUik7ICAvLyBBQyA8LSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIE9wQ29kZS5TVEE6ICAgIC8vIFNUQSB4OlxyXG4gICAgICAgICAgICAgICAgY29weShNRFIsIEFDKTsgIC8vIE1EUiA8LSBBQ1xyXG4gICAgICAgICAgICAgICAgTS5zdG9yZSgpOyAgICAgIC8vIE1bTUFSXSA8LSBNRFJcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIE9wQ29kZS5BREQ6ICAgIC8vIEFERCB4OlxyXG4gICAgICAgICAgICAgICAgTS5sb2FkKCk7ICAgICAgIC8vIE1EUiA8LSBNW01BUl1cclxuICAgICAgICAgICAgICAgIEFMVS5hZGQoKTsgICAgICAvLyBBQyA8LSBBQyArIE1EUlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgT3BDb2RlLlNVQjogICAgLy8gU1VCIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLnN1YigpOyAgICAgIC8vIEFDIDwtIEFDIC0gTURSXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBPcENvZGUuTkFORDogICAvLyBOQU5EIHg6XHJcbiAgICAgICAgICAgICAgICBNLmxvYWQoKTsgICAgICAgLy8gTURSIDwtIE1bTUFSXVxyXG4gICAgICAgICAgICAgICAgQUxVLm5hbmQoKTsgICAgIC8vIEFDIDwtIH4oQUMgJiBNRFIpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBPcENvZGUuU0hGVDogICAvLyBTSEZUOlxyXG4gICAgICAgICAgICAgICAgQUxVLnNoZnQoKTsgICAgIC8vIEFDIDwtIEFDIDw8IDFcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIE9wQ29kZS5KOiAgICAgIC8vIEogeDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGxldCBBRERSRVNTX01BU0sgPSAoMSA8PCBBRERSRVNTX1NJWkUpIC0gMTtcclxuICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTURSLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICAgICAgICAgIFBDLndyaXRlKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgT3BDb2RlLkJORTogICAgLy8gQk5FIHg6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKFogIT0gMSkgdGhlbiBQQyA8LSBNRFIoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgIGlmIChBTFUuWiAhPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IEFERFJFU1NfTUFTSyA9ICgxIDw8IEFERFJFU1NfU0laRSkgLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTURSLnJlYWQoKSAmIEFERFJFU1NfTUFTSztcclxuICAgICAgICAgICAgICAgICAgICBQQy53cml0ZShhZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhyb3cgYFVua25vd24gb3Bjb2RlOiAke29wY29kZX1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IFJlZ2lzdGVyIH0gZnJvbSBcIi4vUmVnaXN0ZXJcIjtcclxuaW1wb3J0IHsgQXJpdGhtZXRpY0xvZ2ljVW5pdCB9IGZyb20gXCIuL0FyaXRobWV0aWNMb2dpY1VuaXRcIjtcclxuaW1wb3J0IHsgTWVtb3J5IH0gZnJvbSBcIi4vTWVtb3J5XCI7XHJcbmltcG9ydCB7IE1lbW9yeU1hcCB9IGZyb20gXCIuL01lbW9yeU1hcFwiO1xyXG5pbXBvcnQgeyBDb250cm9sVW5pdCB9IGZyb20gXCIuL0NvbnRyb2xVbml0XCI7XHJcbmltcG9ydCB7IEluc3RydWN0aW9uIH0gZnJvbSBcIi4vSW5zdHJ1Y3Rpb25cIjtcclxuXHJcbmV4cG9ydCB0eXBlIEVDRTM3NVBzZXVkb0NQVUFyY2hpdGVjdHVyZSA9IHtcclxuICAgIFBDOiBSZWdpc3RlcixcclxuICAgIElSOiBSZWdpc3RlcixcclxuICAgIEFDOiBSZWdpc3RlcixcclxuICAgIE1EUjogUmVnaXN0ZXIsXHJcbiAgICBNQVI6IFJlZ2lzdGVyLFxyXG4gICAgQUxVOiBBcml0aG1ldGljTG9naWNVbml0LFxyXG4gICAgUFJPRzogTWVtb3J5LFxyXG4gICAgREFUQTogTWVtb3J5LFxyXG4gICAgTTogTWVtb3J5TWFwLFxyXG4gICAgQ1U6IENvbnRyb2xVbml0XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBFQ0UzNzVQc2V1ZG9DUFUgaW1wbGVtZW50cyBFQ0UzNzVQc2V1ZG9DUFVBcmNoaXRlY3R1cmUge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFdPUkRfU0laRSA9IDE2OyAvLyB3b3JkIHNpemUgaW4gYml0cy5cclxuICAgIHB1YmxpYyByZWFkb25seSBBRERSRVNTX1NJWkUgPSAxMzsgLy8gYWRkcmVzcyBzaXplIGluIGJpdHM7IDIqKjEzID0gMHgyMDAwID0gODE5MiBhZGRyZXNzYWJsZSB3b3JkcyBtZW1vcnkuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgT1BDT0RFX1NJWkUgPSAzOyAvLyBvcGNvZGUgc2l6ZSBpbiBiaXRzLCAyKiozID0gOCB1bmlxdWUgb3Bjb2Rlcy5cclxuICAgIHB1YmxpYyByZWFkb25seSBPUEVSQU5EX1NJWkUgPSB0aGlzLkFERFJFU1NfU0laRTsgLy8gb3BlcmFuZCBzaXplIGluIGJpdHMuXHJcblxyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0dSQU1fTUVNT1JZX1NJWkU7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIHByb2dyYW0gbWVtb3J5LlxyXG4gICAgcHVibGljIHJlYWRvbmx5IERBVEFfTUVNT1JZX1NJWkU7IC8vIGFkZHJlc3NhYmxlIHdvcmRzIG9mIGRhdGEgbWVtb3J5LlxyXG5cclxuICAgIHB1YmxpYyByZWFkb25seSBQQzogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgSVI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IEFDOiBSZWdpc3RlcjtcclxuICAgIHB1YmxpYyByZWFkb25seSBNRFI6IFJlZ2lzdGVyO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IE1BUjogUmVnaXN0ZXI7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgQUxVOiBBcml0aG1ldGljTG9naWNVbml0O1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFBST0c6IE1lbW9yeTtcclxuICAgIHB1YmxpYyByZWFkb25seSBEQVRBOiBNZW1vcnk7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgTTogTWVtb3J5TWFwO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IENVOiBDb250cm9sVW5pdDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRzOiBFQ0UzNzVQc2V1ZG9DUFVBcmNoaXRlY3R1cmUpIHtcclxuICAgICAgICB0aGlzLlBDID0gY29tcG9uZW50cy5QQztcclxuICAgICAgICB0aGlzLklSID0gY29tcG9uZW50cy5JUjtcclxuICAgICAgICB0aGlzLkFDID0gY29tcG9uZW50cy5BQztcclxuICAgICAgICB0aGlzLk1EUiA9IGNvbXBvbmVudHMuTURSO1xyXG4gICAgICAgIHRoaXMuTUFSID0gY29tcG9uZW50cy5NQVI7XHJcbiAgICAgICAgdGhpcy5BTFUgPSBjb21wb25lbnRzLkFMVTtcclxuICAgICAgICB0aGlzLlBST0cgPSBjb21wb25lbnRzLlBST0c7XHJcbiAgICAgICAgdGhpcy5EQVRBID0gY29tcG9uZW50cy5EQVRBO1xyXG4gICAgICAgIHRoaXMuTSA9IGNvbXBvbmVudHMuTTtcclxuICAgICAgICB0aGlzLkNVID0gY29tcG9uZW50cy5DVTtcclxuXHJcbiAgICAgICAgdGhpcy5QUk9HUkFNX01FTU9SWV9TSVpFID0gdGhpcy5QUk9HLlNJWkU7XHJcbiAgICAgICAgdGhpcy5EQVRBX01FTU9SWV9TSVpFID0gdGhpcy5EQVRBLlNJWkU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0ZXAoKSB7XHJcbiAgICAgICAgLy8gPT0gRmV0Y2ggQ3ljbGVcclxuICAgICAgICB0aGlzLkNVLmZldGNoQW5kRGVjb2RlTmV4dEluc3RydWN0aW9uKCk7XHJcbiAgICAgICAgLy8gPT0gRXhlY3V0ZSBDeWNsZVxyXG4gICAgICAgIHRoaXMuQ1UuZXhlY3V0ZUluc3RydWN0aW9uKCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBsb2FkUHJvZ3JhbShwcm9ncmFtOiBBcnJheTxJbnN0cnVjdGlvbj4sIHN0YXJ0PzogbnVtYmVyKSB7XHJcbiAgICAgICAgcHJvZ3JhbS5mb3JFYWNoKChpbnN0cnVjdGlvbiwgYWRkcmVzcykgPT4ge1xyXG4gICAgICAgICAgICBhZGRyZXNzICs9IHN0YXJ0ID8gc3RhcnQgOiAwO1xyXG4gICAgICAgICAgICB0aGlzLlBST0cud3JpdGUoYWRkcmVzcywgaW5zdHJ1Y3Rpb24udmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwiLy8gPT0gUHNldWRvQ1BVIEluc3RydWN0aW9uc1xyXG4vLyBMREEgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gTURSXHJcbi8vIFNUQSB4OiBNRFIgPC0gQUMsIE1bTUFSXSA8LSBNRFJcclxuLy8gQUREIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIEFDICsgTURSXHJcbi8vIFNVQiB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBBQyAtIE1EUlxyXG4vLyBOQU5EIHg6IE1EUiA8LSBNW01BUl0sIEFDIDwtIH4oQUMgJiBNRFIpXHJcbi8vIFNIRlQgeDogQUMgPC0gQUMgPDwgMVxyXG4vLyBKIHg6IFBDIDwtIE1EUihhZGRyZXNzKVxyXG4vLyBCTkUgeDogaWYgKHogIT0gMSkgdGhlbiBQQyA8LSBNQVIoYWRkcmVzcylcclxuXHJcbmltcG9ydCB7IE9QRVJBTkRfU0laRSB9IGZyb20gXCIuL0NvbnN0YW50c1wiO1xyXG5cclxuZXhwb3J0IGVudW0gT3BDb2RlIHtcclxuICAgIExEQSAgPSAwYjAwMCxcclxuICAgIFNUQSAgPSAwYjAwMSxcclxuICAgIEFERCAgPSAwYjAxMCxcclxuICAgIFNVQiAgPSAwYjAxMSxcclxuICAgIE5BTkQgPSAwYjEwMCxcclxuICAgIFNIRlQgPSAwYjEwMSxcclxuICAgIEogICAgPSAwYjExMCxcclxuICAgIEJORSAgPSAwYjExMVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSW5zdHJ1Y3Rpb24ge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IG9wY29kZTogT3BDb2RlO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IG9wZXJhbmQ6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihvcGNvZGU6IE9wQ29kZSwgb3BlcmFuZDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5vcGNvZGUgPSBvcGNvZGU7XHJcbiAgICAgICAgdGhpcy5vcGVyYW5kID0gb3BlcmFuZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0IHZhbHVlKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLm9wY29kZSA8PCBPUEVSQU5EX1NJWkUpICsgdGhpcy5vcGVyYW5kO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgTERBICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IEluc3RydWN0aW9uKE9wQ29kZS5MREEsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU1RBICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IEluc3RydWN0aW9uKE9wQ29kZS5TVEEsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgQUREICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IEluc3RydWN0aW9uKE9wQ29kZS5BREQsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgU1VCICAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IEluc3RydWN0aW9uKE9wQ29kZS5TVUIsIG9wZXJhbmQpO1xyXG5leHBvcnQgY29uc3QgTkFORCAgID0gKG9wZXJhbmQ6IG51bWJlcikgPT4gbmV3IEluc3RydWN0aW9uKE9wQ29kZS5OQU5ELCBvcGVyYW5kKTtcclxuZXhwb3J0IGNvbnN0IFNIRlQgICA9ICgpICAgICAgICAgICAgICAgID0+IG5ldyBJbnN0cnVjdGlvbihPcENvZGUuU0hGVCwgMCk7XHJcbmV4cG9ydCBjb25zdCBKICAgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgSW5zdHJ1Y3Rpb24oT3BDb2RlLkosICAgb3BlcmFuZCk7XHJcbmV4cG9ydCBjb25zdCBCTkUgICAgPSAob3BlcmFuZDogbnVtYmVyKSA9PiBuZXcgSW5zdHJ1Y3Rpb24oT3BDb2RlLkJORSwgb3BlcmFuZCk7XHJcbiIsImV4cG9ydCBjbGFzcyBNZW1vcnkge1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RhdGE6IEFycmF5PG51bWJlcj47XHJcblxyXG4gICAgY29uc3RydWN0b3Ioc2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gbmV3IEFycmF5PG51bWJlcj4odGhpcy5TSVpFKTtcclxuICAgICAgICB0aGlzLl9kYXRhLmZpbGwoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RhdGFbYWRkcmVzc10gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2FkZHJlc3NdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZyh3aXRoT2Zmc2V0PzogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IGxpbmVzID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNJWkU7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgYWRkcmVzcyA9IHdpdGhPZmZzZXQgPyBpICsgd2l0aE9mZnNldCA6IGk7XHJcbiAgICAgICAgICAgIGxpbmVzLnB1c2goYDB4JHthZGRyZXNzLnRvU3RyaW5nKDE2KX06IDB4JHt0aGlzLl9kYXRhW2ldLnRvU3RyaW5nKDE2KX1gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBSZWdpc3RlciB9IGZyb20gXCIuL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IE1lbW9yeSB9IGZyb20gXCIuL01lbW9yeVwiO1xyXG5cclxudHlwZSBNZW1vcnlNYXBwaW5nID0ge1xyXG4gICAgcmVhZDogKGFkZHJlc3M6IG51bWJlcikgPT4gbnVtYmVyLFxyXG4gICAgd3JpdGU6IChhZGRyZXNzOiBudW1iZXIsIHZhbHVlOiBudW1iZXIpID0+IHZvaWRcclxufVxyXG5cclxuZXhwb3J0IGVudW0gTWVtb3J5QWNjZXNzIHtcclxuICAgIFJFQUQsXHJcbiAgICBXUklURSxcclxuICAgIFJFQURfV1JJVEVcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1lbW9yeU1hcCB7XHJcbiAgICAvLyBBIG1hcCBmcm9tIGFkZHJlc3MgcmFuZ2UgW3N0YXJ0LCBlbmRdIHRvIGEgcmVhZC93cml0YWJsZSBtZW1vcnkgbG9jYXRpb24uXHJcbiAgICBwcml2YXRlIG1hcHBpbmdzOiBNYXA8W3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyXSwgTWVtb3J5TWFwcGluZz47XHJcbiAgICBwcml2YXRlIF9tZHI6IFJlZ2lzdGVyO1xyXG4gICAgcHJpdmF0ZSBfbWFyOiBSZWdpc3RlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtZHI6IFJlZ2lzdGVyLCBtYXI6IFJlZ2lzdGVyKSB7XHJcbiAgICAgICAgdGhpcy5fbWRyID0gbWRyO1xyXG4gICAgICAgIHRoaXMuX21hciA9IG1hcjtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZmluZEFkZHJlc3NNYXBwaW5nKGFkZHJlc3M6IG51bWJlcikge1xyXG4gICAgICAgIGxldCByYW5nZXMgPSBbLi4udGhpcy5tYXBwaW5ncy5rZXlzKCldO1xyXG4gICAgICAgIGZvciAoY29uc3QgcmFuZ2Ugb2YgcmFuZ2VzKSB7XHJcbiAgICAgICAgICAgIGxldCBbc3RhcnQsIGVuZF0gPSByYW5nZTtcclxuICAgICAgICAgICAgaWYgKGFkZHJlc3MgPj0gc3RhcnQgJiYgYWRkcmVzcyA8PSBlbmQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcHBpbmdzLmdldChyYW5nZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbG9hZCgpIHtcclxuICAgICAgICBsZXQgYWRkcmVzcyA9IHRoaXMuX21hci5yZWFkKCk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBsb2FkKCkgZnJvbSB1bm1hcHBlZCBtZW1vcnlcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBkYXRhID0gbWFwcGluZy5yZWFkKGFkZHJlc3MpO1xyXG4gICAgICAgICAgICB0aGlzLl9tZHIud3JpdGUoZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdG9yZSgpIHtcclxuICAgICAgICBsZXQgYWRkcmVzcyA9IHRoaXMuX21hci5yZWFkKCk7XHJcbiAgICAgICAgbGV0IG1hcHBpbmcgPSB0aGlzLmZpbmRBZGRyZXNzTWFwcGluZyhhZGRyZXNzKTtcclxuICAgICAgICBpZiAobWFwcGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byBzdG9yZSgpIHRvIHVubWFwcGVkIG1lbW9yeVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGRhdGEgPSB0aGlzLl9tZHIucmVhZCgpO1xyXG4gICAgICAgICAgICBtYXBwaW5nLndyaXRlKGFkZHJlc3MsIGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbWFwRXh0ZXJuYWxNZW1vcnkoc3RhcnQ6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIG1vZGU6IE1lbW9yeUFjY2VzcywgTTogTWVtb3J5KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gcmVhZChhZGRyZXNzOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLldSSVRFKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcIkF0dGVtcHRpbmcgdG8gcmVhZCgpIGZyb20gV1JJVEUtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBNLnJlYWQoYWRkcmVzcyAtIHN0YXJ0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gTWVtb3J5QWNjZXNzLlJFQUQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IFwiQXR0ZW1wdGluZyB0byB3cml0ZSgpIHRvIFJFQUQtb25seSBtZW1vcnlcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE0ud3JpdGUoYWRkcmVzcyAtIHN0YXJ0LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCByYW5nZTogW251bWJlciwgbnVtYmVyXSA9IFtzdGFydCwgc3RhcnQgKyBsZW5ndGggLSAxXTtcclxuICAgICAgICB0aGlzLm1hcHBpbmdzLnNldChyYW5nZSwge3JlYWQsIHdyaXRlfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIG1hcFJlZ2lzdGVyKGE6IG51bWJlciwgUjogUmVnaXN0ZXIpIHtcclxuICAgICAgICBmdW5jdGlvbiByZWFkKGFkZHJlc3M6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiBSLnJlYWQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHdyaXRlKGFkZHJlc3M6IG51bWJlciwgdmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgICAgICBSLndyaXRlKHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHJhbmdlOiBbbnVtYmVyLCBudW1iZXJdID0gW2EsIGFdO1xyXG4gICAgICAgIHRoaXMubWFwcGluZ3Muc2V0KHJhbmdlLCB7cmVhZCwgd3JpdGV9KTtcclxuICAgIH1cclxufSIsImV4cG9ydCBjbGFzcyBSZWdpc3RlciB7XHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgbmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IFNJWkU6IG51bWJlcjtcclxuICAgIHByaXZhdGUgX2RhdGE6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHNpemU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5TSVpFID0gc2l6ZTtcclxuICAgICAgICB0aGlzLl9kYXRhID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgd3JpdGUodmFsdWU6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuX2RhdGEgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVhZCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0b1N0cmluZygpIHtcclxuICAgICAgICByZXR1cm4gYCR7dGhpcy5uYW1lfTwweCR7dGhpcy5fZGF0YS50b1N0cmluZygxNil9PmA7XHJcbiAgICB9XHJcbn0iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXHJcbi8vID09IFBzZXVkb0lTQVxyXG4vLyAtLSBEYXRhIFRyYW5zZmVyIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtMb2FkIEFjY3VtdWxhdG9yXVxyXG4vLyAgICAgICAgICBMREEgeDsgeCBpcyBhIG1lbW9yeSBsb2NhdGlvblxyXG4vLyAgICAgICAgICBMb2FkcyBhIG1lbW9yeSB3b3JkIHRvIHRoZSBBQy5cclxuLy8gICAgICBbU3RvcmUgQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNUQSB4OyB4IGlzIGEgbWVtb3J5IGxvY2F0aW9uXHJcbi8vICAgICAgICAgIFN0b3JlcyB0aGUgY29udGVudCBvZiB0aGUgQUMgdG8gbWVtb3J5LlxyXG4vLyAtLSBBcml0aG1ldGljIGFuZCBMb2dpY2FsIEluc3RydWN0aW9uc1xyXG4vLyAgICAgIFtBZGQgdG8gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIEFERCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgQWRkcyB0aGUgY29udGVudCBvZiB0aGUgbWVtb3J5IHdvcmQgc3BlY2lmaWVkIGJ5XHJcbi8vICAgICAgICAgIHRoZSBlZmZlY3RpdmUgYWRkcmVzcyB0byB0aGUgY29udGVudCBpbiB0aGUgQUMuXHJcbi8vICAgICAgW1N1YnRyYWN0IGZyb20gQWNjdW11bGF0b3JdXHJcbi8vICAgICAgICAgIFNVQiB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgU3VidHJhY3RzIHRoZSBjb250ZW50IG9mIHRoZSBtZW1vcnkgd29yZCBzcGVjaWZpZWRcclxuLy8gICAgICAgICAgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGZyb20gdGhlIGNvbnRlbnQgaW4gdGhlIEFDLlxyXG4vLyAgICAgIFtMb2dpY2FsIE5BTkQgd2l0aCBBY2N1bXVsYXRvcl1cclxuLy8gICAgICAgICAgTkFORCB4OyB4IHBvaW50cyB0byBhIG1lbW9yeSBsb2NhdGlvbi5cclxuLy8gICAgICAgICAgUGVyZm9ybXMgbG9naWNhbCBOQU5EIGJldHdlZW4gdGhlIGNvbnRlbnRzIG9mIHRoZSBtZW1vcnlcclxuLy8gICAgICAgICAgd29yZCBzcGVjaWZpZWQgYnkgdGhlIGVmZmVjdGl2ZSBhZGRyZXNzIGFuZCB0aGUgQUMuXHJcbi8vICAgICAgW1NoaWZ0XVxyXG4vLyAgICAgICAgICBTSEZUXHJcbi8vICAgICAgICAgIFRoZSBjb250ZW50IG9mIEFDIGlzIHNoaWZ0ZWQgbGVmdCBieSBvbmUgYml0LlxyXG4vLyAgICAgICAgICBUaGUgYml0IHNoaWZ0ZWQgaW4gaXMgMC5cclxuLy8gLS0gQ29udHJvbCBUcmFuc2ZlclxyXG4vLyAgICAgIFtKdW1wXVxyXG4vLyAgICAgICAgICBKIHg7IEp1bXAgdG8gaW5zdHJ1Y3Rpb24gaW4gbWVtb3J5IGxvY2F0aW9uIHguXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzLlxyXG4vLyAgICAgIFtCTkVdXHJcbi8vICAgICAgICAgIEJORSB4OyBKdW1wIHRvIGluc3RydWN0aW9uIGluIG1lbW9yeSBsb2NhdGlvbiB4IGlmIGNvbnRlbnQgb2YgQUMgaXMgbm90IHplcm8uXHJcbi8vICAgICAgICAgIFRyYW5zZmVycyB0aGUgcHJvZ3JhbSBjb250cm9sIHRvIHRoZSBpbnN0cnVjdGlvblxyXG4vLyAgICAgICAgICBzcGVjaWZpZWQgYnkgdGhlIHRhcmdldCBhZGRyZXNzIGlmIFogIT0gMC5cclxuLy8gXHJcbi8vID09IFBzZXVkb0NQVSBNaWNyby1vcGVyYXRpb25zXHJcbi8vIC0tIFN0b3JlL0xvYWQgbWVtb3J5XHJcbi8vICAgICAgTVtNQVJdIDwtIE1EUlxyXG4vLyAgICAgIE1EUiA8LSBNW01BUl1cclxuLy8gLS0gQ29weSByZWdpc3RlclxyXG4vLyAgICAgIFJhIDwtIFJiXHJcbi8vIC0tIFJlZ2lzdGVyIGluY3JlbWVudC9kZWNyZW1lbnRcclxuLy8gICAgICBSYSA8LSBSYSArIDFcclxuLy8gICAgICBSYSA8LSBSYSAtIDFcclxuLy8gICAgICBSYSA8LSBSYSArIFJiXHJcbi8vICAgICAgUmEgPC0gUmEgLSBSYlxyXG4vL1xyXG4vLyA9PSBNaW5pbWFsIENvbXBvbmVudHNcclxuLy8gW01lbW9yeV1cclxuLy8gQWRkcmVzc2FibGUgYnkgQWRkcmVzcyBMaW5lIHZpYSBNW01BUl1cclxuLy8gV3JpdGFibGUgYnkgQWRkcmVzcyBMaW5lICYgRGF0YSBMaW5lIHZpYSBNW01BUl0gPC0gTURSXHJcbi8vIFJlYWRhYmxlIGJ5IEFkZHJlc3MgTGluZSAmIERhdGEgTGluZSB2aWEgTURSIDwtIE1bTUFSXVxyXG4vLyBOZWVkIHR3byBtZW1vcmllczogcHJvZ3JhbSBtZW1vcnkgKHJlYWQgb25seSkgYW5kIGRhdGEgbWVtb3J5IChyZWFkICYgd3JpdGUpLlxyXG4vL1xyXG4vLyBbQUxVXVxyXG4vLyBQZXJmb3JtcyBhcml0aG1ldGljIG9wZXJhdGlvbnMsIG9mdGVuIGludm9sdmluZyB0aGUgQUMgcmVnaXN0ZXIuXHJcbi8vIEFDIDwtIEFDICsgMVxyXG4vLyBBQyA8LSBBQyArIFJBXHJcbi8vIEFDIDwtIEFDIC0gMVxyXG4vLyBBQyA8LSBBQyAtIFJBXHJcbi8vXHJcbi8vIFtDb250cm9sIFVuaXRdXHJcbi8vIEV4ZWN1dGVzIGluc3RydWN0aW9ucyBhbmQgc2VxdWVuY2VzIG1pY3Jvb3BlcmF0aW9ucy5cclxuLy9cclxuLy8gW01EUiBSZWdpc3Rlcl1cclxuLy8gVHJhbnNmZXIgdG8vZnJvbSBtZW1vcnkgdmlhIERhdGEgTGluZS5cclxuLy9cclxuLy8gW01BUiBSZWdpc3Rlcl1cclxuLy8gQWNjZXNzIG1lbW9yeSB2aWEgQWRkcmVzcyBMaW5lXHJcbi8vXHJcbi8vIFtQQyBSZWdpc3Rlcl1cclxuLy8gSW5jcmVtZW50IHZpYSBQQyA8LSBQQyArIDFcclxuLy9cclxuLy8gW0lSIFJlZ2lzdGVyXVxyXG4vLyBIb2xkcyB0aGUgb3Bjb2RlIG9mIHRoZSBjdXJyZW50IGluc3RydWN0aW9uLlxyXG4vL1xyXG4vLyBbQUMgUmVnaXN0ZXJdXHJcbi8vIEluY3JlbWVudCB2aWEgQUMgPC0gQUMgKyAxIG9yIEFDIDwtIEFDICsgUmFcclxuLy8gRGVjcmVtZW50IHZpYSBBQyA8LSBBQyAtIDEgb3IgQUMgPC0gQUMgLSBSYVxyXG4vL1xyXG4vLyA9PSBQc2V1ZG9DUFUgSW5zdHJ1Y3Rpb25zXHJcbi8vIExEQSB4OiBNRFIgPC0gTVtNQVJdLCBBQyA8LSBNRFJcclxuLy8gU1RBIHg6IE1EUiA8LSBBQywgTVtNQVJdIDwtIE1EUlxyXG4vLyBBREQgeDogTURSIDwtIE1bTUFSXSwgQUMgPC0gQUMgKyBNRFJcclxuLy8gSiB4OiBQQyA8LSBNRFIoYWRkcmVzcylcclxuLy8gQk5FIHg6IGlmICh6ICE9IDEpIHRoZW4gUEMgPC0gTUFSKGFkZHJlc3MpXHJcblxyXG5pbXBvcnQgeyBSZWdpc3RlciB9IGZyb20gXCJAL1JlZ2lzdGVyXCI7XHJcbmltcG9ydCB7IEFyaXRobWV0aWNMb2dpY1VuaXQgfSBmcm9tIFwiQC9Bcml0aG1ldGljTG9naWNVbml0XCI7XHJcbmltcG9ydCB7IE1lbW9yeSB9IGZyb20gXCJAL01lbW9yeVwiO1xyXG5pbXBvcnQgeyBNZW1vcnlNYXAsIE1lbW9yeUFjY2VzcyB9IGZyb20gXCJAL01lbW9yeU1hcFwiO1xyXG5pbXBvcnQgeyBDb250cm9sVW5pdCB9IGZyb20gXCJAL0NvbnRyb2xVbml0XCI7XHJcbmltcG9ydCB7IEVDRTM3NVBzZXVkb0NQVSB9IGZyb20gXCJAL0VDRTM3NVBzZXVkb0NQVVwiO1xyXG5pbXBvcnQgeyBJbnN0cnVjdGlvbiwgT3BDb2RlLCBMREEsIFNUQSwgQURELCBTVUIsIFNIRlQsIE5BTkQsIEosIEJORSB9IGZyb20gXCJAL0luc3RydWN0aW9uXCI7XHJcbmltcG9ydCB7IEFERFJFU1NfU0laRSwgT1BDT0RFX1NJWkUsIFdPUkRfU0laRSwgREFUQV9NRU1PUllfU0laRSwgUFJPR1JBTV9NRU1PUllfU0laRSB9IGZyb20gXCJAL0NvbnN0YW50c1wiO1xyXG5cclxuZnVuY3Rpb24gbWFpbigpIHtcclxuICAgIGNvbnN0IFBDID0gbmV3IFJlZ2lzdGVyKFwiUENcIiwgQUREUkVTU19TSVpFKTtcclxuICAgIGNvbnN0IElSID0gbmV3IFJlZ2lzdGVyKFwiSVJcIiwgT1BDT0RFX1NJWkUpO1xyXG4gICAgY29uc3QgQUMgPSBuZXcgUmVnaXN0ZXIoXCJBQ1wiLCBXT1JEX1NJWkUpO1xyXG4gICAgY29uc3QgTURSID0gbmV3IFJlZ2lzdGVyKFwiTURSXCIsIFdPUkRfU0laRSk7XHJcbiAgICBjb25zdCBNQVIgPSBuZXcgUmVnaXN0ZXIoXCJNQVJcIiwgQUREUkVTU19TSVpFKTtcclxuICAgIGNvbnN0IEFMVSA9IG5ldyBBcml0aG1ldGljTG9naWNVbml0KEFDLCBNRFIpO1xyXG4gICAgY29uc3QgUFJPRyA9IG5ldyBNZW1vcnkoUFJPR1JBTV9NRU1PUllfU0laRSk7XHJcbiAgICBjb25zdCBEQVRBID0gbmV3IE1lbW9yeShEQVRBX01FTU9SWV9TSVpFKTtcclxuICAgIGNvbnN0IE0gPSBuZXcgTWVtb3J5TWFwKE1EUiwgTUFSKTtcclxuICAgIGNvbnN0IENVID0gbmV3IENvbnRyb2xVbml0KElSLCBQQywgQUMsIE1BUiwgTURSLCBBTFUsIE0pO1xyXG4gICAgLy8gQXNzZW1ibGUgdGhlIENQVS5cclxuICAgIGNvbnN0IENQVSA9IG5ldyBFQ0UzNzVQc2V1ZG9DUFUoe1xyXG4gICAgICAgIFBDLCBJUiwgQUMsIE1EUiwgTUFSLCBBTFUsIFBST0csIERBVEEsIE0sIENVXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBNYXAgZGF0YSBhbmQgcHJvZ3JhbSBtZW1vcnkgbG9jYXRpb25zIG9udG8gdGhlIE1lbW9yeU1hcC5cclxuICAgIC8vIFBsYWNlIFxyXG4gICAgY29uc3QgREFUQV9CRUdJTiA9IFBST0cuU0laRTtcclxuICAgIC8vIFBsYWNlIHByb2dyYW0gc3RhcnRpbmcgaW1tZWRpZXRhbHkgYWZ0ZXIgREFUQS5cclxuICAgIGNvbnN0IFBST0dfQkVHSU4gPSAwO1xyXG4gICAgTS5tYXBFeHRlcm5hbE1lbW9yeShEQVRBX0JFR0lOLCBEQVRBLlNJWkUsIE1lbW9yeUFjY2Vzcy5SRUFEX1dSSVRFLCBEQVRBKTtcclxuICAgIE0ubWFwRXh0ZXJuYWxNZW1vcnkoUFJPR19CRUdJTiwgUFJPRy5TSVpFLCBNZW1vcnlBY2Nlc3MuUkVBRCwgUFJPRyk7XHJcbiAgICAvLyBQb2ludCBQQyB0byBmaXJzdCBwcm9ncmFtIGluc3RydWN0aW9uLlxyXG4gICAgUEMud3JpdGUoUFJPR19CRUdJTik7XHJcblxyXG4gICAgLy8gUHJvZ3JhbSB0byBjb21wdXRlIHRoZSBjb2RlIEMgPSA0KkEgKyBCLlxyXG4gICAgLy8gTGFiZWxzIGZyb20gcGVyc3BlY3RpdmUgb2YgTWVtb3J5TWFwLlxyXG4gICAgbGV0IEEgPSBEQVRBX0JFR0lOOyAgICAgLy8gTGFiZWwgQSA9IERBVEFbMF1cclxuICAgIGxldCBCID0gREFUQV9CRUdJTiArIDE7IC8vIExhYmVsIEIgPSBEQVRBWzFdXHJcbiAgICBsZXQgQyA9IERBVEFfQkVHSU4gKyAyOyAvLyBMYWJlbCBDID0gREFUQVsyXVxyXG4gICAgY29uc3QgcHJvZ3JhbTogQXJyYXk8SW5zdHJ1Y3Rpb24+ID0gW1xyXG4gICAgICAgIExEQShBKSxcclxuICAgICAgICBTSEZUKCksXHJcbiAgICAgICAgU0hGVCgpLFxyXG4gICAgICAgIEFERChCKSxcclxuICAgICAgICBTVEEoQyksXHJcbiAgICBdO1xyXG4gICAgLy8gV3JpdGUgdGhlIHByb2dyYW0gaW50byBwcm9ncmFtIG1lbW9yeS5cclxuICAgIENQVS5sb2FkUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgIC8vIFdyaXRlIGluaXRpYWwgdmFsdWVzIGludG8gZGF0YSBtZW1vcnkuXHJcbiAgICAvLyBOb3JtYWxpemluZyBsYWJlbHMgc2luY2UgSSdtIHdyaXRpbmcgdG8gTWVtb3J5IChsb2NhbCBhZGRyZXNzKSBub3QgTWVtb3J5TWFwIChtYXBwZWQgYWRkcmVzcykuXHJcbiAgICBEQVRBLndyaXRlKEEgLSBEQVRBX0JFR0lOLCAyMCk7ICAgIC8vIE1bQV0gPSAyMFxyXG4gICAgREFUQS53cml0ZShCIC0gREFUQV9CRUdJTiwgMjApOyAgICAvLyBNW0JdID0gMjBcclxuXHJcbiAgICBmdW5jdGlvbiBwcmludFN0YXRlKCkge1xyXG4gICAgICAgIGNvbnN0IHByaW50ID0gKC4uLmFyZ3M6IEFycmF5PHt0b1N0cmluZygpOiBTdHJpbmd9PikgPT4gY29uc29sZS5sb2coLi4uYXJncy5tYXAodmFsdWUgPT4gdmFsdWUudG9TdHJpbmcoKSkpO1xyXG4gICAgICAgIHByaW50KFwiPT09PT09PT09PVwiKTtcclxuICAgICAgICBwcmludChcIj09IFJlZ2lzdGVyc1wiKTtcclxuICAgICAgICBwcmludChQQyk7XHJcbiAgICAgICAgcHJpbnQoSVIsIFwiPT5cIiwgT3BDb2RlW0lSLnJlYWQoKV0pO1xyXG4gICAgICAgIHByaW50KEFDLCBcInxcIiwgYFo9JHtBTFUuWn1gKTtcclxuICAgICAgICBwcmludChNRFIpO1xyXG4gICAgICAgIHByaW50KE1BUik7XHJcbiAgICAgICAgcHJpbnQoXCI9PSBQcm9ncmFtIE1lbW9yeVwiKVxyXG4gICAgICAgIHByaW50KFBST0cudG9TdHJpbmcoUFJPR19CRUdJTikpO1xyXG4gICAgICAgIHByaW50KFwiPT0gRGF0YSBNZW1vcnlcIik7XHJcbiAgICAgICAgcHJpbnQoREFUQS50b1N0cmluZyhEQVRBX0JFR0lOKSk7XHJcbiAgICAgICAgcHJpbnQoXCJcXG5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUnVuIGV2ZXJ5IGluc3RydWN0aW9uIGluIHRoZSBwcm9ncmFtLlxyXG4gICAgLy8gUHJpbnQgdGhlIENQVSBzdGF0ZSBhZnRlciBlYWNoIHN0ZXAuXHJcbiAgICBjb25zb2xlLmxvZyhcIj09IEluaXRpYWwgU3RhdGVcIik7XHJcbiAgICBwcmludFN0YXRlKCk7XHJcbiAgICBjb25zdCBOVU1fSU5TVFJVQ1RJT05TID0gcHJvZ3JhbS5sZW5ndGg7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE5VTV9JTlNUUlVDVElPTlM7IGkrKykge1xyXG4gICAgICAgIENQVS5zdGVwKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFN0ZXAgIyR7aSArIDF9YClcclxuICAgICAgICBwcmludFN0YXRlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW4oKTsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=