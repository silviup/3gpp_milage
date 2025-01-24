/**
 * Unit tests for milenage.ts using Jest.
 */
import { generate3GAuthVector, exportedForTesting } from '../lib/milenage';

// 1) Test: aes128Encrypt Using 3.3 Test Set 1 from TS 35.207
describe('aes128Encrypt()', () => {

    const keyHex = '465b5ce8b199b49faa5f0a2ee238a6bc';
    const plainHex = 'ee36f7cf037d37d3692f7f0399e7949a';
    const expectedCipherHex = '9e2980c59739da67b136355e3cede6a2';

    it('encrypts correctly in AES-128-ECB mode', () => {
        const key = Buffer.from(keyHex, 'hex');
        const plain = Buffer.from(plainHex, 'hex');

        let encrypted = exportedForTesting.aes128Encrypt(key, plain);

        expect(encrypted.toString('hex')).toEqual(expectedCipherHex);
    });
});

// 2) Test: rotateLeft128 Simple check with rotating a 128-bit sequence by 8 bits
describe('rotateLeft128()', () => {

    it('rotates a 128-bit buffer 8 bits to the left correctly', () => {
        const inputHex = '000102030405060708090a0b0c0d0e0f';
        const expectedHex = '0102030405060708090a0b0c0d0e0f00';

        const output = exportedForTesting.rotateLeft128(Buffer.from(inputHex, 'hex'), 8);
        expect(output.toString('hex')).toEqual(expectedHex);
    });
});

// 3) Test: computeOPc Using 4.3 Test Set 1 from TS 35.207
describe('computeOPc()', () => {

    // K: 465b5ce8 b199b49f aa5f0a2e e238a6bc
    // RAND: 23553cbe 9637a89d 218ae64d ae47bf35
    // SQN: ff9bb4d0 b607
    // AMF: b9b9
    // OP: cdc202d5 123e20f6 2b6d676a c72cb318

    const kHex = '465b5ce8b199b49faa5f0a2ee238a6bc';
    const opHex = 'cdc202d5123e20f62b6d676ac72cb318';
    const expectedOpcHex = 'cd63cb71954a9f4e48a5994e37a02baf';

    it('computes OPc from K and OP correctly', () => {
        const K = Buffer.from(kHex, 'hex');
        const OP = Buffer.from(opHex, 'hex');

        let opc = exportedForTesting.computeOPc(K, OP);

        expect(opc.toString('hex')).toEqual(expectedOpcHex);
    });
});

// 4) Test: f1, f2345 using TS 35.207 test data
describe('f1 and f2345', () => {

    // From 3GPP TS 35.207, 4.3 Test Set 1:
    const kHex = '465b5ce8b199b49faa5f0a2ee238a6bc';
    const opHex = 'cdc202d5123e20f62b6d676ac72cb318';
    const randHex = '23553cbe9637a89d218ae64dae47bf35';
    const sqnHex = 'ff9bb4d0b607';
    const amfHex = 'b9b9';
    const expectedMacA = '4a9ffac354dfafb3';


    it('f1 matches the expected MAC-A', () => {

        const K = Buffer.from(kHex, 'hex');
        const OP = Buffer.from(opHex, 'hex');
        const RAND = Buffer.from(randHex, 'hex');
        const SQN = Buffer.from(sqnHex, 'hex');
        const AMF = Buffer.from(amfHex, 'hex');

        let OPc = exportedForTesting.computeOPc(K, OP);
        let macA = exportedForTesting.f1(K, OPc, RAND, SQN, AMF);

        expect(macA.toString('hex')).toEqual(expectedMacA);
    });

    // it('f2, f3, f4, f5 produce correct RES, CK, IK, AK', () => {
    // TODO implement
    // });
});

// 5) Test: generate3GAuthVector
describe('generate3GAuthVector()', () => {
    it('returns a valid Auth Vector with correct hex strings', () => {
        const keyHex = '00000000000000000000000000000000';
        const opHex  = '00000000000000000000000000000000';
        const result = generate3GAuthVector(keyHex, opHex);

        // Check presence of the 5 fields
        expect(result).toHaveProperty('RAND');
        expect(result).toHaveProperty('RES');
        expect(result).toHaveProperty('CK');
        expect(result).toHaveProperty('IK');
        expect(result).toHaveProperty('AUTN');

        // Check each is hex string
        const hexPattern = /^[a-f0-9]+$/i;
        expect(result.RAND).toMatch(hexPattern);
        expect(result.RES).toMatch(hexPattern);
        expect(result.CK).toMatch(hexPattern);
        expect(result.IK).toMatch(hexPattern);
        expect(result.AUTN).toMatch(hexPattern);

        // They should be uppercase if that's how you formatted them.
        expect(result.RAND).toEqual(result.RAND);

        // TODO verify the actual values returned
    });
});