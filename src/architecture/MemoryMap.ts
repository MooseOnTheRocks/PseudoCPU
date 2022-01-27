import { Register } from "@/Register";
import { Memory } from "@/Memory";

export type MemoryMapping = {
    read: (address: number) => number,
    write: (address: number, value: number) => void
}

export enum MemoryAccess {
    READ,
    WRITE,
    READ_WRITE
}

export class MemoryMap {
    // A map from address range [start, end] to a read/writable memory location.
    private mappings: Map<[start: number, end: number], MemoryMapping & { setEnable(): void, clearEnable(): void, clock: () => void }>;
    private _mdr: Register;
    private _mar: Register;

    constructor(mdr: Register, mar: Register) {
        this._mdr = mdr;
        this._mar = mar;
        this.mappings = new Map();
    }

    public clock() {
        this.mappings.forEach(entry => {
            entry?.clock();
        })
    }

    private findAddressMapping(address: number) {
        let ranges = [...this.mappings.keys()];
        let key = ranges.find(range => address >= range[0] && address <= range[1]);
        let mapping = key ? this.mappings.get(key) : undefined;
        return mapping;
    }

    public load() {
        let address = this._mar.read();
        let mapping = this.findAddressMapping(address);
        if (mapping === undefined) {
            throw "Attempting to load() from unmapped memory";
        }
        else {
            let data = mapping.read(address);
            this._mdr.write(data);
        }
    }

    public store() {
        let address = this._mar.read();
        let mapping = this.findAddressMapping(address);
        if (mapping === undefined) {
            throw "Attempting to store() to unmapped memory";
        }
        else {
            let data = this._mdr.read();
            mapping.write(address, data);
        }
    }

    public mapExternalMemory(start: number, length: number, mode: MemoryAccess, M: Memory) {
        function read(address: number): number {
            if (mode === MemoryAccess.WRITE) {
                throw "Attempting to read() from WRITE-only memory"
            }
            return M.read(address - start);
        }

        function write(address: number, value: number) {
            if (mode === MemoryAccess.READ) {
                throw "Attempting to write() to READ-only memory"
            }
            M.write(address - start, value);
        }
        
        let range: [number, number] = [start, start + length - 1];
        let { clock, setEnable, clearEnable } = M;
        this.mappings.set(range, { read, write, clock, setEnable, clearEnable });
    }

    public mapRegister(a: number, R: Register) {
        function read(address: number): number {
            return R.read();
        }

        function write(address: number, value: number) {
            R.write(value);
        }
        
        let range: [number, number] = [a, a];
        let [ clock, setEnable, clearEnable ] = [ () => R.clock(), () => {}, () => {} ];
        this.mappings.set(range, {read, write, clock, setEnable, clearEnable });
    }
}