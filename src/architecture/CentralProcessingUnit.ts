export interface CentralProcessingUnit {
    stepClock(): void;
    stepInstruction(): void;
    writeProgram(start: number, ...program: Array<number>): void;
    writeData(start: number, ...data: Array<number>): void;
}
