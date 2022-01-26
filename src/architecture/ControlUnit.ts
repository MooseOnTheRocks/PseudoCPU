export interface ControlUnit {
    fetchAndDecodeNextInstruction(): void;
    executeInstruction(): void;
}