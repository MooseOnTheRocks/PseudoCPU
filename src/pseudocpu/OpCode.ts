namespace PseudoCPU {
    // == PseudoCPU Instructions
    // LDA x: MDR <- M[MAR], AC <- MDR
    // STA x: MDR <- AC, M[MAR] <- MDR
    // ADD x: MDR <- M[MAR], AC <- AC + MDR
    // J x: PC <- MDR(address)
    // BNE x: if (z != 1) then PC <- MAR(address)

    export enum OpCode {
        LDA,
        STA,
        ADD,
        J,
        BNE
    }

    export function opname(opcode: OpCode) {
        switch (opcode) {
            case OpCode.LDA:    return "LDA";
            case OpCode.STA:    return "STA";
            case OpCode.ADD:    return "ADD";
            case OpCode.J:      return "J";
            case OpCode.BNE:    return "BNE";
            default:            return "UNKNOWN";
        }
    }
}