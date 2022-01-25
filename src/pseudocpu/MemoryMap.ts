namespace PseudoCPU {
    type MemoryMapping = {
        read: (address: number) => number,
        write: (address: number, value: number) => void
    };

    export class MemoryMap {
        // A map from address range [start, end] to a read/writable memory location.
        private mappings: Map<[start: number, end: number], MemoryMapping>;
        private _mdr: Register;
        private _mar: Register;

        constructor(mdr: Register, mar: Register) {
            this._mdr = mdr;
            this._mar = mar;
            this.mappings = new Map();
        }

        private findAddressMapping(address: number) {
            let ranges = [...this.mappings.keys()];
            for (const range of ranges) {
                let [start, end] = range;
                if (address >= start && address <= end) {
                    return this.mappings.get(range);
                }
            }
            return undefined;
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

        public mapExternalMemory(start: number, length: number, M: Memory) {
            function read(address: number): number {
                return M.read(address - start);
            }

            function write(address: number, value: number) {
                M.write(address - start, value);
            }
            
            let range: [number, number] = [start, start + length - 1];
            this.mappings.set(range, {read, write});
        }

        public mapRegister(a: number, R: Register) {
            function read(address: number): number {
                return R.read();
            }

            function write(address: number, value: number) {
                R.write(value);
            }
            
            let range: [number, number] = [a, a];
            this.mappings.set(range, {read, write});
        }
    }
}