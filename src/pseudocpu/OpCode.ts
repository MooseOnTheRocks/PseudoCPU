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
}