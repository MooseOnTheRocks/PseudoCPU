namespace PseudoCPU {
    export type ECE375PseudoCPUArchitecture = {
        PC: Register,
        IR: Register,
        AC: Register,
        MDR: Register,
        MAR: Register,
        ALU: ArithmeticLogicUnit,
        PROG: Memory,
        DATA: Memory,
        M: MemoryMap,
        CU: ControlUnit
    }

    export class ECE375PseudoCPU implements ECE375PseudoCPUArchitecture {
        public readonly WORD_SIZE = 16; // word size in bits.
        public readonly ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
        public readonly OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
        public readonly OPERAND_SIZE = ADDRESS_SIZE; // operand size in bits.

        public readonly PROGRAM_MEMORY_SIZE; // addressable words of program memory.
        public readonly DATA_MEMORY_SIZE; // addressable words of data memory.

        public readonly PC: Register;
        public readonly IR: Register;
        public readonly AC: Register;
        public readonly MDR: Register;
        public readonly MAR: Register;
        public readonly ALU: ArithmeticLogicUnit;
        public readonly PROG: Memory;
        public readonly DATA: Memory;
        public readonly M: MemoryMap;
        public readonly CU: ControlUnit;

        constructor(components: ECE375PseudoCPUArchitecture) {
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

        public step() {
            // == Fetch Cycle
            this.CU.fetchAndDecodeNextInstruction();
            // == Execute Cycle
            this.CU.executeInstruction();
        }
        
        public loadProgram(program: Array<Instruction>, start?: number) {
            program.forEach((instruction, address) => {
                address += start ? start : 0;
                this.PROG.write(address, instruction.value);
            });
        }
    }
}