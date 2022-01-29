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
    private mappings: Map<[start: number, end: number], MemoryMapping>;

    constructor() {
        this.mappings = new Map();
    }

    private findAddressMapping(address: number) {
        let ranges = [...this.mappings.keys()];
        let key = ranges.find(range => address >= range[0] && address <= range[1]);
        let mapping = key ? this.mappings.get(key) : undefined;
        return mapping;
    }

    public read(address: number): number {
        let mapping = this.findAddressMapping(address);
        if (mapping === undefined) {
            throw "Attempting to load() from unmapped memory";
        }
        else {
            let data = mapping.read(address);
            return data;
        }
    }

    public write(address: number, data: number) {
        let mapping = this.findAddressMapping(address);
        if (mapping === undefined) {
            throw "Attempting to store() to unmapped memory";
        }
        else {
            mapping.write(address, data);
        }
    }

    public mapMemoryRange(start: number, length: number, mode: MemoryAccess, MM: MemoryMapping) {
        function read_(address: number): number {
            if (mode === MemoryAccess.WRITE) {
                throw "Attempting to read() from WRITE-only memory"
            }
            return MM.read(address - start);
        }

        function write_(address: number, value: number) {
            if (mode === MemoryAccess.READ) {
                throw "Attempting to write() to READ-only memory"
            }
            MM.write(address - start, value);
        }

        let range: [number, number] = [start, start + length - 1];
        this.mappings.set(range, { read: read_, write: write_ })
    }
}