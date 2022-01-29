import {Register} from "@/Register";
import { MemoryMap } from "@/MemoryMap";
import { ControlUnit } from "@/ControlUnit";

import { PseudoOpCode } from "./PseudoInstruction";
import { PseudoALU } from "./PseudoALU";
import { PseudoCPUArchitecture } from "./PseudoCPUArchitecture";

export class PseudoCU implements ControlUnit {
    private readonly _architecture: PseudoCPUArchitecture;
    private readonly _ir: Register;
    private readonly _pc: Register;
    private readonly _ac: Register;
    private readonly _mar: Register;
    private readonly _mdr: Register;
    private readonly _alu: PseudoALU;
    private readonly _memory: MemoryMap;

    constructor(architecture: PseudoCPUArchitecture, ir: Register, pc: Register, ac: Register, mar: Register, mdr: Register, alu: PseudoALU, memory: MemoryMap) {
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
    public fetchAndDecodeNextInstruction() {
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
    public executeInstruction() {
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

        function copy(dst: Register, src: Register) {
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
            case PseudoOpCode.LDA:      // LDA x:
                load();                 // MDR <- M[MAR]
                copy(AC, MDR);          // AC <- MDR
                break;
            case PseudoOpCode.STA:      // STA x:
                copy(MDR, AC);          // MDR <- AC
                store();                // M[MAR] <- MDR
                break;
            case PseudoOpCode.ADD:      // ADD x:
                load();                 // MDR <- M[MAR]
                ALU.add();              // AC <- AC + MDR
                break;
            case PseudoOpCode.SUB:      // SUB x:
                load();                 // MDR <- M[MAR]
                ALU.sub();              // AC <- AC - MDR
                break;
            case PseudoOpCode.NAND:     // NAND x:
                load();                 // MDR <- M[MAR]
                ALU.nand();             // AC <- ~(AC & MDR)
                break;
            case PseudoOpCode.SHFT:     // SHFT:
                ALU.shft();             // AC <- AC << 1
                break;
            case PseudoOpCode.J:        // J x:
                                        // PC <- MDR(address)
                let ADDRESS_MASK = (1 << this._architecture.ADDRESS_SIZE) - 1;
                let address = MDR.read() & ADDRESS_MASK;
                PC.write(address);
                break;
            case PseudoOpCode.BNE:      // BNE x:
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