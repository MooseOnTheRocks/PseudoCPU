import { Register } from "./Register";
import { Memory } from "./Memory";
export declare enum MemoryAccess {
    READ = 0,
    WRITE = 1,
    READ_WRITE = 2
}
export declare class MemoryMap {
    private mappings;
    private _mdr;
    private _mar;
    constructor(mdr: Register, mar: Register);
    private findAddressMapping;
    load(): void;
    store(): void;
    mapExternalMemory(start: number, length: number, mode: MemoryAccess, M: Memory): void;
    mapRegister(a: number, R: Register): void;
}
