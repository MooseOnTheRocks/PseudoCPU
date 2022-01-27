export interface CentralProcessingUnit {
    stepInstruction(): void;
    writeProgram(start: number, ...program: Array<number>): void;
    writeData(start: number, ...data: Array<number>): void;
}
