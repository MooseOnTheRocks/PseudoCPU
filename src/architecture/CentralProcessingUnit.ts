import { Instruction } from "@/Instruction";

export interface CentralProcessingUnit {
    stepInstruction(): void;
    writeProgram(start: number, ...program: Array<Instruction>): void;
    writeData(start: number, ...data: Array<number>): void;
}