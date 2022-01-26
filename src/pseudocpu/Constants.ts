export const WORD_SIZE = 16; // word size in bits.
export const ADDRESS_SIZE = 13; // address size in bits; 2**13 = 0x2000 = 8192 addressable words memory.
export const OPCODE_SIZE = 3; // opcode size in bits, 2**3 = 8 unique opcodes.
export const OPERAND_SIZE = ADDRESS_SIZE; // operand size in bits.

export const PROGRAM_MEMORY_SIZE = 0x08; // addressable words of program memory.
export const DATA_MEMORY_SIZE = 0x08; // addressable words of data memory.