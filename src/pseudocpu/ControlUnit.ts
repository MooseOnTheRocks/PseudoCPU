import {Register} from "./Register";
import {ArithmeticLogicUnit} from "./ArithmeticLogicUnit";
import { MemoryMap } from "./MemoryMap";
import { OPERAND_SIZE, ADDRESS_SIZE, WORD_SIZE, OPCODE_SIZE } from "./Constants";
import { OpCode } from "./Instruction";

export class ControlUnit {
    private readonly _ir: Register;
    private readonly _pc: Register;
    private readonly _ac: Register;
    private readonly _mar: Register;
    private readonly _mdr: Register;
    private readonly _alu: ArithmeticLogicUnit;
    private readonly _memory: MemoryMap;

    constructor(ir: Register, pc: Register, ac: Register, mar: Register, mdr: Register, alu: ArithmeticLogicUnit, memory: MemoryMap) {
        this._ir = ir;
        this._pc = pc;
        this._ac = ac;
        this._mar = mar;
        this._mdr = mdr;
        this._alu = alu;
        this._memory = memory;
    }

    // Performs instruction fetch and decode.
    public fetchAndDecodeNextInstruction() {
        // MAR <- PC
        this._mar.write(this._pc.read());
        // PC <- PC + 1
        this._pc.write(this._pc.read() + 1);
        // MDR <- M[MAR]
        this._memory.load();
        // IR <- MDR(opcode)
        let OPCODE_SHIFT = WORD_SIZE - OPCODE_SIZE;
        let opcode = this._mdr.read() >> OPCODE_SHIFT;
        this._ir.write(opcode);
        // MAR <- MDR(address)
        let ADDRESS_MASK = (1 << ADDRESS_SIZE) - 1;
        let address = this._mdr.read() & ADDRESS_MASK;
        this._mar.write(address);
    }

    public executeInstruction() {
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

        const copy = (dst: Register, src: Register) => dst.write(src.read());

        let opcode = IR.read();
        switch (opcode) {
            case OpCode.LDA:    // LDA x:
                M.load();       // MDR <- M[MAR]
                copy(AC, MDR);  // AC <- MDR
                break;
            case OpCode.STA:    // STA x:
                copy(MDR, AC);  // MDR <- AC
                M.store();      // M[MAR] <- MDR
                break;
            case OpCode.ADD:    // ADD x:
                M.load();       // MDR <- M[MAR]
                ALU.add();      // AC <- AC + MDR
                break;
            case OpCode.SUB:    // SUB x:
                M.load();       // MDR <- M[MAR]
                ALU.sub();      // AC <- AC - MDR
                break;
            case OpCode.NAND:   // NAND x:
                M.load();       // MDR <- M[MAR]
                ALU.nand();     // AC <- ~(AC & MDR)
                break;
            case OpCode.SHFT:   // SHFT:
                ALU.shft();     // AC <- AC << 1
                break;
            case OpCode.J:      // J x:
                                // PC <- MDR(address)
                let ADDRESS_MASK = (1 << ADDRESS_SIZE) - 1;
                let address = MDR.read() & ADDRESS_MASK;
                PC.write(address);
                break;
            case OpCode.BNE:    // BNE x:
                                // if (Z != 1) then PC <- MDR(address)
                if (ALU.Z != 1) {
                    let ADDRESS_MASK = (1 << ADDRESS_SIZE) - 1;
                    let address = MDR.read() & ADDRESS_MASK;
                    PC.write(address);
                }
                break;
            default:
                throw `Unknown opcode: ${opcode}`;
        }
    }
}