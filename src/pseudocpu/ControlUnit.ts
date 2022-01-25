namespace PseudoCPU {
    export class ControlUnit {
        private readonly _ir: Register;
        private readonly _pc: Register;
        private readonly _ac: Register;
        private readonly _mar: Register;
        private readonly _mdr: Register;
        private readonly _alu: ArithmeticLogicUnit;
        private readonly _progMem: Memory;
        private readonly _dataMem: Memory;

        constructor(ir: Register, pc: Register, ac: Register, mar: Register, mdr: Register, alu: ArithmeticLogicUnit, programMemory: Memory, dataMemory: Memory) {
            this._ir = ir;
            this._pc = pc;
            this._ac = ac;
            this._mar = mar;
            this._mdr = mdr;
            this._alu = alu;
            this._progMem = programMemory;
            this._dataMem = dataMemory;
        }

        // Fetches, decodes, and executes the current instruction.
        // PC <- PC + 1 unless branch or jump occurs.
        public step(): void {
            this.fetchAndDecodeNextInstruction();
            this.executeInstruction();
        }

        private executeInstruction() {
            // Instruction memory format:
            //      [Instruction: WORD_SIZE] =
            //          [opcode: OPCODE_SIZE] [operand: ADDRESS_SIZE]
            // Operand usage is defined by the opcode.
            // Operand address is loaded into MAR after the fetch and decode cycle.
            //
            // Notation:
            // ```
            // OPCODE x:
            // Register Transactions
            // ```
            // Example:
            // ```
            // ADD x:
            // MDR <- M[MAR]
            // AC <- AC + MDR
            // ```

            const [ IR, PC, AC, MAR, MDR, ALU, PROG, DATA ] = [ this._ir, this._pc, this._ac, this._mar, this._mdr, this._alu, this._progMem, this._dataMem ];

            const copy = (dst: Register, src: Register) => dst.write(src.read());

            let opcode = this._ir.read();
            switch (opcode) {
                case OpCode.LDA:    // LDA x:
                    DATA.load();    // MDR <- M[MAR]
                    copy(AC, MDR);  // AC <- MDR
                    break;
                case OpCode.STA:    // STA x:
                    copy(MDR, AC);  // MDR <- AC
                    DATA.store();   // M[MAR] <- MDR
                    break;
                case OpCode.ADD:    // ADD x:
                    DATA.load();    // MDR <- M[MAR]
                    ALU.add();      // AC <- AC + MDR
                    break;
                case OpCode.J:      // J x:
                                    // PC <- MDR(address)
                    let ADDRESS_MASK = (1 << ADDRESS_SIZE) - 1;
                    let address = MDR.read() & ADDRESS_MASK;
                    PC.write(address);
                    break;
                case OpCode.BNE:
                    // BNE x: if (Z != 1) then PC <- MAR(address)
                    break;
                default:
                    throw `Unknown opcode: ${opcode}`;
            }
        }

        // Performs instruction fetch and decode.
        private fetchAndDecodeNextInstruction() {
            // MAR <- PC
            this._mar.write(this._pc.read());
            // PC <- PC + 1
            this._pc.write(this._pc.read() + 1);
            // MDR <- M[MAR]
            this._progMem.load();
            // IR <- MDR(opcode)
            let OPCODE_SHIFT = WORD_SIZE - OPCODE_SIZE;
            let opcode = this._mdr.read() >> OPCODE_SHIFT;
            this._ir.write(opcode);
            // MAR <- MDR(address)
            let ADDRESS_MASK = (1 << ADDRESS_SIZE) - 1;
            let address = this._mdr.read() & ADDRESS_MASK;
            this._mar.write(address);
        }
    }
}