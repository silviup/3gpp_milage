/**
 * 3GPP MILENAGE algorithm set
 */

import * as crypto from 'crypto';

// MILENAGE constants from 3GPP TS 35.206 (4.1 Algorithm Framework)
const R: number[] = [64, 0, 32, 64, 96];
const C: Buffer[] = [
    Buffer.from('00000000000000000000000000000000', 'hex'), // c1 0...0000
    Buffer.from('00000000000000000000000000000001', 'hex'), // c2 0...0001
    Buffer.from('00000000000000000000000000000002', 'hex'), // c3 0...0010
    Buffer.from('00000000000000000000000000000004', 'hex'), // c4 0...0100
    Buffer.from('00000000000000000000000000000008', 'hex'), // c5 0...1000
];

// XOR two arrays of bytes
function XORBytes(a: Buffer, b: Buffer, len: number): Buffer {

    const result = Buffer.alloc(len);
    for (let i = 0; i < len; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

// AES-128-ECB util
function aes128Encrypt(key: Buffer, data: Buffer): Buffer {

    const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
    cipher.setAutoPadding(false);

    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return encrypted;
}

// compute OPc = OP ^ AES-128(K, OP)
function computeOPc(key: Buffer, op: Buffer): Buffer {
    return XORBytes(aes128Encrypt(key, op), op, 16);
}

// return a copy of the 16 bytes input buffer rotated left by bitCount bits
function rotateLeft128(buffer: Buffer, bitCount: number): Buffer {

    const bytes = Buffer.from(buffer);

    for (let i = 0; i < bitCount % 128; i++) {
        let carry = (bytes[0] & 0x80) >> 7;  // most significant bit
        for (let b = 15; b >= 0; b--) {
            const newCarry = (bytes[b] & 0x80) >> 7;
            bytes[b] = ((bytes[b] << 1) & 0xfe) | carry;
            carry = newCarry;
        }
    }

    return bytes;
}

// f1: first 64 bits of OUT1 = E[TEMP ^ rot(IN1 ^ OPc, r1) ^ c1]K ^ OPc
function f1(
    key: Buffer,
    op_c: Buffer,
    rand: Buffer,
    sqn: Buffer,
    amf: Buffer
): Buffer {

    // temp = E(rand ^ op_c)k
    let temp = XORBytes(rand, op_c, 16);
    temp = aes128Encrypt(key, temp);

    // in1 = SQN || AMF || SQN || AMF (16 bytes total)
    let in1 = Buffer.alloc(16);
    sqn.copy(in1, 0, 0, 6);
    amf.copy(in1, 6, 0, 2);
    sqn.copy(in1, 8, 0, 6);
    amf.copy(in1, 14, 0, 2);

    in1 = XORBytes(in1, op_c, 16);
    in1 = rotateLeft128(in1, R[0]);

    // in1 = temp ^ in1 ^ C[0]
    // but C[0] is all zero bits so we can skip the XOR for it
    in1 = XORBytes(in1, temp, 16);

    let out1 = aes128Encrypt(key, in1);
    out1 = XORBytes(out1, op_c, 16);

    // first 64 bits of out1
    return out1.subarray(0, 8);
}

// returns RES, CK, IK, AK
function f2345(
    key: Buffer,
    op_c: Buffer,
    rand: Buffer
): { res: Buffer; ck: Buffer; ik: Buffer; ak: Buffer } {

    const temp = XORBytes(rand, op_c, 16)
    const out = aes128Encrypt(key, temp);

    // Compute outX (general formula)
    const computeOutX = (inBuf: Buffer, c: Buffer, r: number): Buffer => {
        const add1 = XORBytes(inBuf, op_c, 16);
        const rotated = rotateLeft128(add1, r);
        const add2 = XORBytes(rotated, c, 16);
        return XORBytes(aes128Encrypt(key, add2), op_c, 16);
    };

    // out2, out3, out4, out5
    const out2 = computeOutX(out, C[1], R[1]);
    const out3 = computeOutX(out, C[2], R[2]);
    const out4 = computeOutX(out, C[3], R[3]);
    const out5 = computeOutX(out, C[4], R[4]);

    // f2 => RES (for typical 3G is 64-bit -> out2[0..7])
    const res = out2.subarray(8, 16);

    // f3 => CK (128-bit)
    const ck = out3;

    // f4 => IK (128-bit)
    const ik = out4;

    // f5 => AK (6 bytes from out5)
    const ak = out2.subarray(0, 6);

    return { res, ck, ik, ak };
}

export interface AuthVector {
    RAND: string;
    XRES: string;
    CK: string;
    IK: string;
    AUTN: string;
}

/**
 * Input: K (secret key) and OP value (both in hex),
 * Output: 3G Authentication Vector: { RAND, RES, CK, IK, AUTN }
 */
export function generate3GAuthVector(keyHex: string, opHex: string): AuthVector {
    // Key (16 bytes)
    const K = Buffer.from(keyHex, 'hex');

    // Operator Variant Algorithm Configuration Field (16 bytes)
    const OP = Buffer.from(opHex, 'hex');

    // Sequence Number (6 bytes)
    const SQN = Buffer.from('000000000000', 'hex');

    // Authentication Management Field (2 bytes)
    const AMF: Buffer = Buffer.from('0000', 'hex');

    // Compute OPc
    const op_c = computeOPc(K, OP);

    // Generate a random RAND (16 bytes)
    const RAND = crypto.randomBytes(16);

    // f1 => MAC-A
    const macA = f1(K, op_c, RAND, SQN, AMF);

    // f2345 => XRES, CK, IK, AK
    const { res, ck, ik, ak } = f2345(K, op_c, RAND);

    // AUTN = (SQN ^ AK) || AMF || MAC-A
    const sqnXorAk = XORBytes(SQN, ak, 6);
    const AUTN = Buffer.concat([sqnXorAk, AMF, macA]); // 16 bytes

    return {
        RAND: RAND.toString('hex'),
        XRES: res.toString('hex'),
        CK: ck.toString('hex'),
        IK: ik.toString('hex'),
        AUTN: AUTN.toString('hex'),
    };
}

export const exportedForTesting = {
    aes128Encrypt,
    computeOPc,
    rotateLeft128,
    f1,
    f2345
}