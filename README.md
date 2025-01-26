# 3GPP Milenage Implementation

Provides an implementation of the 3GPP Milenage algorithm set,
as specified in **3GPP TS 35.206 and TS 35.207**
and exposes it as both a library and an AWS Lambda REST API. 
The project includes all key components required for generating 
3G authentication vectors used in mobile network security.

## Features

1. **Milenage Algorithm Library**
    - Implementation of the Milenage algorithm framework, including:
        - f1: Authentication Management Field (AMF) and Message Authentication Code (MAC).
        - f2: Response (RES).
        - f3: Cipher Key (CK).
        - f4: Integrity Key (IK).
        - f5: Anonymity Key (AK).
    - Supports generation of the **OPc** (Operator Variant Algorithm Configuration Field).
    - Cryptographic operations (e.g., AES-128 encryption) implemented using Node.js's `crypto` module.

2. **AWS Lambda API**
    - Exposes the Milenage functionality as a REST API.
    - Accepts the following input parameters via a JSON payload:
        - `key`: 16-byte key (K) in hexadecimal format.
        - `op`: 16-byte operator field (OP) in hexadecimal format.
    - Returns a complete 3G authentication vector:
        - `RAND`: Random challenge.
        - `XRES`: Expected response.
        - `CK`: Cipher key.
        - `IK`: Integrity key.
        - `AUTN`: Authentication token.

3. **Unit Testing**
    - Test cases implemented with Jest.
    - Validates critical components using official test vectors from 3GPP TS 35.207.
    - Includes tests for utility functions, algorithm correctness, and REST API behavior.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```



## REST API Usage
Deploy the `index.ts` file as an AWS Lambda function. Example invocation:
```bash
curl -X POST https://<api-endpoint> \
    -H "Content-Type: application/json" \
    -d '{ "key": "465b5ce8b199b49faa5f0a2ee238a6bc", "op": "cdc202d5123e20f62b6d676ac72cb318" }'
```

Example response:
```json
{
  "RAND": "23553cbe9637a89d218ae64dae47bf35",
  "XRES": "4a9ffac354dfafb3",
  "CK": "a0a1a2a3a4a5a6a7a8a9aaabacadaeaf",
  "IK": "b0b1b2b3b4b5b6b7b8b9babbbcbdbebf",
  "AUTN": "ff9bb4d0b607b9b94a9ffac354dfafb3"
}
```

## Testing

Run the test suite with:
```bash
npm test
```

The tests validate the correctness of individual components and the overall Milenage algorithm using official test vectors.

## Future Enhancements

- Add more tests for negative and edge cases.
- Add input sanitization and enhanced validation for better robustness.
- Add proper logging
- Improve error handling

## License

This project is licensed under [MIT License](./LICENSE).

