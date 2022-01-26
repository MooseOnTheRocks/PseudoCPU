/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/architecture/Memory.ts":
/*!************************************!*\
  !*** ./src/architecture/Memory.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.Memory = void 0;\r\nclass Memory {\r\n    constructor(name, size) {\r\n        this.NAME = name;\r\n        this.SIZE = size;\r\n        this._data = new Array(this.SIZE);\r\n        this._data.fill(0);\r\n    }\r\n    write(address, value) {\r\n        this._data[address] = value;\r\n    }\r\n    read(address) {\r\n        return this._data[address];\r\n    }\r\n    toString(withOffset) {\r\n        let lines = [];\r\n        for (let i = 0; i < this.SIZE; i++) {\r\n            let address = withOffset ? i + withOffset : i;\r\n            lines.push(`0x${address.toString(16)}: 0x${this._data[i].toString(16)}`);\r\n        }\r\n        return lines.join(\"\\n\");\r\n    }\r\n}\r\nexports.Memory = Memory;\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/architecture/Memory.ts?");

/***/ }),

/***/ "./src/architecture/MemoryMap.ts":
/*!***************************************!*\
  !*** ./src/architecture/MemoryMap.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.MemoryMap = exports.MemoryAccess = void 0;\r\nvar MemoryAccess;\r\n(function (MemoryAccess) {\r\n    MemoryAccess[MemoryAccess[\"READ\"] = 0] = \"READ\";\r\n    MemoryAccess[MemoryAccess[\"WRITE\"] = 1] = \"WRITE\";\r\n    MemoryAccess[MemoryAccess[\"READ_WRITE\"] = 2] = \"READ_WRITE\";\r\n})(MemoryAccess = exports.MemoryAccess || (exports.MemoryAccess = {}));\r\nclass MemoryMap {\r\n    constructor(mdr, mar) {\r\n        this._mdr = mdr;\r\n        this._mar = mar;\r\n        this.mappings = new Map();\r\n    }\r\n    findAddressMapping(address) {\r\n        let ranges = [...this.mappings.keys()];\r\n        let key = ranges.find(range => address >= range[0] && address <= range[1]);\r\n        let mapping = key ? this.mappings.get(key) : undefined;\r\n        return mapping;\r\n    }\r\n    load() {\r\n        let address = this._mar.read();\r\n        let mapping = this.findAddressMapping(address);\r\n        if (mapping === undefined) {\r\n            throw \"Attempting to load() from unmapped memory\";\r\n        }\r\n        else {\r\n            let data = mapping.read(address);\r\n            this._mdr.write(data);\r\n        }\r\n    }\r\n    store() {\r\n        let address = this._mar.read();\r\n        let mapping = this.findAddressMapping(address);\r\n        if (mapping === undefined) {\r\n            throw \"Attempting to store() to unmapped memory\";\r\n        }\r\n        else {\r\n            let data = this._mdr.read();\r\n            mapping.write(address, data);\r\n        }\r\n    }\r\n    mapExternalMemory(start, length, mode, M) {\r\n        function read(address) {\r\n            if (mode === MemoryAccess.WRITE) {\r\n                throw \"Attempting to read() from WRITE-only memory\";\r\n            }\r\n            return M.read(address - start);\r\n        }\r\n        function write(address, value) {\r\n            if (mode === MemoryAccess.READ) {\r\n                throw \"Attempting to write() to READ-only memory\";\r\n            }\r\n            M.write(address - start, value);\r\n        }\r\n        let range = [start, start + length - 1];\r\n        this.mappings.set(range, { read, write });\r\n    }\r\n    mapRegister(a, R) {\r\n        function read(address) {\r\n            return R.read();\r\n        }\r\n        function write(address, value) {\r\n            R.write(value);\r\n        }\r\n        let range = [a, a];\r\n        this.mappings.set(range, { read, write });\r\n    }\r\n}\r\nexports.MemoryMap = MemoryMap;\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/architecture/MemoryMap.ts?");

/***/ }),

/***/ "./src/architecture/Register.ts":
/*!**************************************!*\
  !*** ./src/architecture/Register.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.Register = void 0;\r\nclass Register {\r\n    constructor(name, size) {\r\n        this.NAME = name;\r\n        this.SIZE = size;\r\n        this._data = 0;\r\n    }\r\n    write(value) {\r\n        this._data = value;\r\n    }\r\n    read() {\r\n        return this._data;\r\n    }\r\n    toString() {\r\n        return `${this.NAME}<0x${this._data.toString(16)}>`;\r\n    }\r\n}\r\nexports.Register = Register;\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/architecture/Register.ts?");

/***/ }),

/***/ "./src/implementations/PseudoCPU/PseudoALU.ts":
/*!****************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoALU.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.PseudoALU = void 0;\r\nconst Register_1 = __webpack_require__(/*! @/Register */ \"./src/architecture/Register.ts\");\r\nclass PseudoALU {\r\n    constructor(ac, mdr, wordSize) {\r\n        this._ac = ac;\r\n        this._mdr = mdr;\r\n        this.WORD_SIZE = wordSize;\r\n        this._z = new Register_1.Register(\"Z\", 1);\r\n    }\r\n    get Z() {\r\n        return this._z.read();\r\n    }\r\n    set Z(value) {\r\n        this._z.write(value);\r\n    }\r\n    add() {\r\n        let WORD_MASK = (1 << this.WORD_SIZE) - 1;\r\n        let sum = (this._ac.read() + this._mdr.read()) & WORD_MASK;\r\n        this._ac.write(sum);\r\n        this.Z = sum === 0 ? 1 : 0;\r\n    }\r\n    sub() {\r\n        let WORD_MASK = (1 << this.WORD_SIZE) - 1;\r\n        let difference = (this._ac.read() - this._mdr.read()) & WORD_MASK;\r\n        this._ac.write(difference);\r\n        this.Z = difference === 0 ? 1 : 0;\r\n    }\r\n    nand() {\r\n        let WORD_MASK = (1 << this.WORD_SIZE) - 1;\r\n        let result = ~(this._ac.read() & this._mdr.read()) & WORD_MASK;\r\n        this._ac.write(result);\r\n        this.Z = result === 0 ? 1 : 0;\r\n    }\r\n    shft() {\r\n        let WORD_MASK = (1 << this.WORD_SIZE) - 1;\r\n        let result = (this._ac.read() << 1) & WORD_MASK;\r\n        this._ac.write(result);\r\n        this.Z = result === 0 ? 1 : 0;\r\n    }\r\n}\r\nexports.PseudoALU = PseudoALU;\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/implementations/PseudoCPU/PseudoALU.ts?");

/***/ }),

/***/ "./src/implementations/PseudoCPU/PseudoCPU.ts":
/*!****************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoCPU.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\r\n// == PseudoISA\r\n// -- Data Transfer Instructions\r\n//      [Load Accumulator]\r\n//          LDA x; x is a memory location\r\n//          Loads a memory word to the AC.\r\n//      [Store Accumulator]\r\n//          STA x; x is a memory location\r\n//          Stores the content of the AC to memory.\r\n// -- Arithmetic and Logical Instructions\r\n//      [Add to Accumulator]\r\n//          ADD x; x points to a memory location.\r\n//          Adds the content of the memory word specified by\r\n//          the effective address to the content in the AC.\r\n//      [Subtract from Accumulator]\r\n//          SUB x; x points to a memory location.\r\n//          Subtracts the content of the memory word specified\r\n//          by the effective address from the content in the AC.\r\n//      [Logical NAND with Accumulator]\r\n//          NAND x; x points to a memory location.\r\n//          Performs logical NAND between the contents of the memory\r\n//          word specified by the effective address and the AC.\r\n//      [Shift]\r\n//          SHFT\r\n//          The content of AC is shifted left by one bit.\r\n//          The bit shifted in is 0.\r\n// -- Control Transfer\r\n//      [Jump]\r\n//          J x; Jump to instruction in memory location x.\r\n//          Transfers the program control to the instruction\r\n//          specified by the target address.\r\n//      [BNE]\r\n//          BNE x; Jump to instruction in memory location x if content of AC is not zero.\r\n//          Transfers the program control to the instruction\r\n//          specified by the target address if Z != 0.\r\n// \r\n// == PseudoCPU Micro-operations\r\n// -- Store/Load memory\r\n//      M[MAR] <- MDR\r\n//      MDR <- M[MAR]\r\n// -- Copy register\r\n//      Ra <- Rb\r\n// -- Register increment/decrement\r\n//      Ra <- Ra + 1\r\n//      Ra <- Ra - 1\r\n//      Ra <- Ra + Rb\r\n//      Ra <- Ra - Rb\r\n//\r\n// == Minimal Components\r\n// [Memory]\r\n// Addressable by Address Line via M[MAR]\r\n// Writable by Address Line & Data Line via M[MAR] <- MDR\r\n// Readable by Address Line & Data Line via MDR <- M[MAR]\r\n// Need two memories: program memory (read only) and data memory (read & write).\r\n//\r\n// [ALU]\r\n// Performs arithmetic operations, often involving the AC register.\r\n// AC <- AC + 1\r\n// AC <- AC + RA\r\n// AC <- AC - 1\r\n// AC <- AC - RA\r\n//\r\n// [Control Unit]\r\n// Executes instructions and sequences microoperations.\r\n//\r\n// [MDR Register]\r\n// Transfer to/from memory via Data Line.\r\n//\r\n// [MAR Register]\r\n// Access memory via Address Line\r\n//\r\n// [PC Register]\r\n// Increment via PC <- PC + 1\r\n//\r\n// [IR Register]\r\n// Holds the opcode of the current instruction.\r\n//\r\n// [AC Register]\r\n// Increment via AC <- AC + 1 or AC <- AC + Ra\r\n// Decrement via AC <- AC - 1 or AC <- AC - Ra\r\n//\r\n// == PseudoCPU Instructions\r\n// LDA x: MDR <- M[MAR], AC <- MDR\r\n// STA x: MDR <- AC, M[MAR] <- MDR\r\n// ADD x: MDR <- M[MAR], AC <- AC + MDR\r\n// J x: PC <- MDR(address)\r\n// BNE x: if (z != 1) then PC <- MAR(address)\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.PseudoCPU = void 0;\r\nconst Register_1 = __webpack_require__(/*! @/Register */ \"./src/architecture/Register.ts\");\r\nconst Memory_1 = __webpack_require__(/*! @/Memory */ \"./src/architecture/Memory.ts\");\r\nconst MemoryMap_1 = __webpack_require__(/*! @/MemoryMap */ \"./src/architecture/MemoryMap.ts\");\r\nconst PseudoCU_1 = __webpack_require__(/*! ./PseudoCU */ \"./src/implementations/PseudoCPU/PseudoCU.ts\");\r\nconst PseudoALU_1 = __webpack_require__(/*! ./PseudoALU */ \"./src/implementations/PseudoCPU/PseudoALU.ts\");\r\nclass PseudoCPU {\r\n    constructor() {\r\n        this.PROGRAM_MEMORY_BEGIN = 0x00; // address of first word of program memory.\r\n        this.DATA_MEMORY_BEGIN = PseudoCPU.PROGRAM_MEMORY_SIZE; // address of first word of data memory.\r\n        this.PC = new Register_1.Register(\"PC\", PseudoCPU.ADDRESS_SIZE);\r\n        this.IR = new Register_1.Register(\"IR\", PseudoCPU.OPCODE_SIZE);\r\n        this.AC = new Register_1.Register(\"AC\", PseudoCPU.WORD_SIZE);\r\n        this.MDR = new Register_1.Register(\"MDR\", PseudoCPU.WORD_SIZE);\r\n        this.MAR = new Register_1.Register(\"MAR\", PseudoCPU.ADDRESS_SIZE);\r\n        this.ALU = new PseudoALU_1.PseudoALU(this.AC, this.MDR, PseudoCPU.WORD_SIZE);\r\n        this.PROG = new Memory_1.Memory(\"PROG\", PseudoCPU.PROGRAM_MEMORY_SIZE);\r\n        this.DATA = new Memory_1.Memory(\"DATA\", PseudoCPU.DATA_MEMORY_SIZE);\r\n        this.M = new MemoryMap_1.MemoryMap(this.MDR, this.MAR);\r\n        this.M.mapExternalMemory(this.PROGRAM_MEMORY_BEGIN, PseudoCPU.PROGRAM_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ, this.PROG);\r\n        this.M.mapExternalMemory(this.DATA_MEMORY_BEGIN, PseudoCPU.DATA_MEMORY_SIZE, MemoryMap_1.MemoryAccess.READ_WRITE, this.DATA);\r\n        this.CU = new PseudoCU_1.PseudoCU(this.IR, this.PC, this.AC, this.MAR, this.MDR, this.ALU, this.M);\r\n    }\r\n    stepInstruction() {\r\n        // == Fetch Cycle\r\n        this.CU.fetchAndDecodeNextInstruction();\r\n        // == Execute Cycle\r\n        this.CU.executeInstruction();\r\n    }\r\n    writeProgram(start, program) {\r\n        program.forEach((instruction, address) => {\r\n            this.PROG.write(start + address - this.PROGRAM_MEMORY_BEGIN, instruction.VALUE);\r\n        });\r\n    }\r\n    writeData(start, ...data) {\r\n        data.forEach((value, address) => {\r\n            this.DATA.write(start + address - this.DATA_MEMORY_BEGIN, value);\r\n        });\r\n    }\r\n}\r\nexports.PseudoCPU = PseudoCPU;\r\nPseudoCPU.WORD_SIZE = 16; // word size in bits.\r\nPseudoCPU.ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.\r\nPseudoCPU.OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.\r\nPseudoCPU.PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.\r\nPseudoCPU.DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/implementations/PseudoCPU/PseudoCPU.ts?");

/***/ }),

/***/ "./src/implementations/PseudoCPU/PseudoCU.ts":
/*!***************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoCU.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.PseudoCU = void 0;\r\nconst PseudoCPU_1 = __webpack_require__(/*! ./PseudoCPU */ \"./src/implementations/PseudoCPU/PseudoCPU.ts\");\r\nconst PseudoInstruction_1 = __webpack_require__(/*! ./PseudoInstruction */ \"./src/implementations/PseudoCPU/PseudoInstruction.ts\");\r\nclass PseudoCU {\r\n    constructor(ir, pc, ac, mar, mdr, alu, memory) {\r\n        this._ir = ir;\r\n        this._pc = pc;\r\n        this._ac = ac;\r\n        this._mar = mar;\r\n        this._mdr = mdr;\r\n        this._alu = alu;\r\n        this._memory = memory;\r\n    }\r\n    // Performs instruction fetch and decode.\r\n    fetchAndDecodeNextInstruction() {\r\n        // MAR <- PC\r\n        this._mar.write(this._pc.read());\r\n        // PC <- PC + 1\r\n        this._pc.write(this._pc.read() + 1);\r\n        // MDR <- M[MAR]\r\n        this._memory.load();\r\n        // IR <- MDR(opcode)\r\n        let OPCODE_SHIFT = PseudoCPU_1.PseudoCPU.WORD_SIZE - PseudoCPU_1.PseudoCPU.OPCODE_SIZE;\r\n        let opcode = this._mdr.read() >> OPCODE_SHIFT;\r\n        this._ir.write(opcode);\r\n        // MAR <- MDR(address)\r\n        let ADDRESS_MASK = (1 << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) - 1;\r\n        let address = this._mdr.read() & ADDRESS_MASK;\r\n        this._mar.write(address);\r\n    }\r\n    // Executes the current instruction loaded into IR.\r\n    executeInstruction() {\r\n        // == PseudoCPU Instructions\r\n        // LDA x: MDR <- M[MAR], AC <- MDR\r\n        // STA x: MDR <- AC, M[MAR] <- MDR\r\n        // ADD x: MDR <- M[MAR], AC <- AC + MDR\r\n        // SUB x: MDR <- M[MAR], AC <- AC - MDR\r\n        // NAND x: MDR <- M[MAR], AC <- ~(AC & MDR)\r\n        // SHFT x: AC <- AC << 1\r\n        // J x: PC <- MDR(address)\r\n        // BNE x: if (z != 1) then PC <- MAR(address)\r\n        const [IR, PC, AC, MAR, MDR, ALU, M] = [this._ir, this._pc, this._ac, this._mar, this._mdr, this._alu, this._memory];\r\n        const copy = (dst, src) => dst.write(src.read());\r\n        let opcode = IR.read();\r\n        switch (opcode) {\r\n            case PseudoInstruction_1.PseudoOpCode.LDA: // LDA x:\r\n                M.load(); // MDR <- M[MAR]\r\n                copy(AC, MDR); // AC <- MDR\r\n                break;\r\n            case PseudoInstruction_1.PseudoOpCode.STA: // STA x:\r\n                copy(MDR, AC); // MDR <- AC\r\n                M.store(); // M[MAR] <- MDR\r\n                break;\r\n            case PseudoInstruction_1.PseudoOpCode.ADD: // ADD x:\r\n                M.load(); // MDR <- M[MAR]\r\n                ALU.add(); // AC <- AC + MDR\r\n                break;\r\n            case PseudoInstruction_1.PseudoOpCode.SUB: // SUB x:\r\n                M.load(); // MDR <- M[MAR]\r\n                ALU.sub(); // AC <- AC - MDR\r\n                break;\r\n            case PseudoInstruction_1.PseudoOpCode.NAND: // NAND x:\r\n                M.load(); // MDR <- M[MAR]\r\n                ALU.nand(); // AC <- ~(AC & MDR)\r\n                break;\r\n            case PseudoInstruction_1.PseudoOpCode.SHFT: // SHFT:\r\n                ALU.shft(); // AC <- AC << 1\r\n                break;\r\n            case PseudoInstruction_1.PseudoOpCode.J: // J x:\r\n                // PC <- MDR(address)\r\n                let ADDRESS_MASK = (1 << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) - 1;\r\n                let address = MDR.read() & ADDRESS_MASK;\r\n                PC.write(address);\r\n                break;\r\n            case PseudoInstruction_1.PseudoOpCode.BNE: // BNE x:\r\n                // if (Z != 1) then PC <- MDR(address)\r\n                if (ALU.Z != 1) {\r\n                    let ADDRESS_MASK = (1 << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) - 1;\r\n                    let address = MDR.read() & ADDRESS_MASK;\r\n                    PC.write(address);\r\n                }\r\n                break;\r\n            default:\r\n                throw `Unknown opcode: ${opcode}`;\r\n        }\r\n    }\r\n}\r\nexports.PseudoCU = PseudoCU;\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/implementations/PseudoCPU/PseudoCU.ts?");

/***/ }),

/***/ "./src/implementations/PseudoCPU/PseudoInstruction.ts":
/*!************************************************************!*\
  !*** ./src/implementations/PseudoCPU/PseudoInstruction.ts ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\r\n// == PseudoCPU Instructions\r\n// LDA x: MDR <- M[MAR], AC <- MDR\r\n// STA x: MDR <- AC, M[MAR] <- MDR\r\n// ADD x: MDR <- M[MAR], AC <- AC + MDR\r\n// SUB x: MDR <- M[MAR], AC <- AC - MDR\r\n// NAND x: MDR <- M[MAR], AC <- ~(AC & MDR)\r\n// SHFT x: AC <- AC << 1\r\n// J x: PC <- MDR(address)\r\n// BNE x: if (z != 1) then PC <- MAR(address)\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nexports.BNE = exports.J = exports.SHFT = exports.NAND = exports.SUB = exports.ADD = exports.STA = exports.LDA = exports.PseudoInstruction = exports.PseudoOpCode = void 0;\r\nconst PseudoCPU_1 = __webpack_require__(/*! ./PseudoCPU */ \"./src/implementations/PseudoCPU/PseudoCPU.ts\");\r\nvar PseudoOpCode;\r\n(function (PseudoOpCode) {\r\n    PseudoOpCode[PseudoOpCode[\"LDA\"] = 0] = \"LDA\";\r\n    PseudoOpCode[PseudoOpCode[\"STA\"] = 1] = \"STA\";\r\n    PseudoOpCode[PseudoOpCode[\"ADD\"] = 2] = \"ADD\";\r\n    PseudoOpCode[PseudoOpCode[\"SUB\"] = 3] = \"SUB\";\r\n    PseudoOpCode[PseudoOpCode[\"NAND\"] = 4] = \"NAND\";\r\n    PseudoOpCode[PseudoOpCode[\"SHFT\"] = 5] = \"SHFT\";\r\n    PseudoOpCode[PseudoOpCode[\"J\"] = 6] = \"J\";\r\n    PseudoOpCode[PseudoOpCode[\"BNE\"] = 7] = \"BNE\";\r\n})(PseudoOpCode = exports.PseudoOpCode || (exports.PseudoOpCode = {}));\r\nclass PseudoInstruction {\r\n    constructor(opcode, operand) {\r\n        this.opcode = opcode;\r\n        this.operand = operand;\r\n    }\r\n    // Instruction memory format:\r\n    //      [Instruction: WORD_SIZE] = [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]\r\n    // Operand usage is defined by the opcode.\r\n    // Operand address is loaded into MAR after the fetch and decode cycle.\r\n    get VALUE() {\r\n        return (this.opcode << PseudoCPU_1.PseudoCPU.ADDRESS_SIZE) + this.operand;\r\n    }\r\n}\r\nexports.PseudoInstruction = PseudoInstruction;\r\nconst LDA = (operand) => new PseudoInstruction(PseudoOpCode.LDA, operand);\r\nexports.LDA = LDA;\r\nconst STA = (operand) => new PseudoInstruction(PseudoOpCode.STA, operand);\r\nexports.STA = STA;\r\nconst ADD = (operand) => new PseudoInstruction(PseudoOpCode.ADD, operand);\r\nexports.ADD = ADD;\r\nconst SUB = (operand) => new PseudoInstruction(PseudoOpCode.SUB, operand);\r\nexports.SUB = SUB;\r\nconst NAND = (operand) => new PseudoInstruction(PseudoOpCode.NAND, operand);\r\nexports.NAND = NAND;\r\nconst SHFT = () => new PseudoInstruction(PseudoOpCode.SHFT, 0);\r\nexports.SHFT = SHFT;\r\nconst J = (operand) => new PseudoInstruction(PseudoOpCode.J, operand);\r\nexports.J = J;\r\nconst BNE = (operand) => new PseudoInstruction(PseudoOpCode.BNE, operand);\r\nexports.BNE = BNE;\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/implementations/PseudoCPU/PseudoInstruction.ts?");

/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nconst PseudoCPU_1 = __webpack_require__(/*! implementations/PseudoCPU/PseudoCPU */ \"./src/implementations/PseudoCPU/PseudoCPU.ts\");\r\nconst PseudoInstruction_1 = __webpack_require__(/*! implementations/PseudoCPU/PseudoInstruction */ \"./src/implementations/PseudoCPU/PseudoInstruction.ts\");\r\nfunction main() {\r\n    // Construct a ECE375 Pseudo CPU, factory new!\r\n    const CPU = new PseudoCPU_1.PseudoCPU();\r\n    // Define labels in DATA memory.\r\n    let A = CPU.DATA_MEMORY_BEGIN;\r\n    let B = CPU.DATA_MEMORY_BEGIN + 1;\r\n    let C = CPU.DATA_MEMORY_BEGIN + 2;\r\n    // Program, computes C = 4*A + B\r\n    const program = [\r\n        (0, PseudoInstruction_1.LDA)(A),\r\n        (0, PseudoInstruction_1.SHFT)(),\r\n        (0, PseudoInstruction_1.SHFT)(),\r\n        (0, PseudoInstruction_1.ADD)(B),\r\n        (0, PseudoInstruction_1.STA)(C)\r\n    ];\r\n    // Write program to memory.\r\n    CPU.writeProgram(0, program);\r\n    // Initial values: A = 20, B = 20, C = 0.\r\n    CPU.writeData(A, 20);\r\n    CPU.writeData(B, 21);\r\n    function printCPU() {\r\n        const print = (...args) => console.log(...args.map(value => value.toString()));\r\n        const { PC, IR, AC, MDR, MAR, ALU, PROG, DATA, M, CU } = CPU;\r\n        print(PC);\r\n        print(IR, \"=>\", PseudoInstruction_1.PseudoOpCode[IR.read()]);\r\n        print(AC, \"=>\", AC.read());\r\n        print(`Z=${ALU.Z}`);\r\n        print(MDR, \"=>\", MDR.read());\r\n        print(MAR);\r\n        print(`== ${PROG.NAME} memory`);\r\n        print(PROG);\r\n        print(`== ${DATA.NAME} memory`);\r\n        print(DATA);\r\n        console.log();\r\n    }\r\n    const STEP_COUNT = program.length;\r\n    console.log(\"== Initial State\");\r\n    printCPU();\r\n    for (let i = 0; i < STEP_COUNT; i++) {\r\n        CPU.stepInstruction();\r\n        printCPU();\r\n    }\r\n}\r\nmain();\r\n\n\n//# sourceURL=webpack://pseudocpu/./src/main.ts?");

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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;