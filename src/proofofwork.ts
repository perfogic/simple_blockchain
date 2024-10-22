import { sha256 } from "@ethersproject/crypto";
import Block from "./block";

const targetBits = 15n;
const maxNonce = BigInt("9223372036854775807");

class ProofOfWork {
  block: Block;
  target: bigint;

  constructor(block: Block) {
    this.block = block;
    this.target = 1n << (256n - targetBits); // 1 << (256 - targetBits)
  }

  // Prepare data for hashing
  private prepareData(nonce: bigint): Uint8Array {
    const components = [
      this.block.prevBlockHash,
      this.block.data,
      this.block.timestamp.toString(16),
      targetBits.toString(16),
      nonce.toString(16),
    ];

    return Buffer.concat(
      components.map((item) => {
        const val = Buffer.from(item);
        return val;
      })
    );
  }

  // Run the proof-of-work algorithm
  run(): { nonce: bigint; hash: string } {
    let nonce = 0n;

    console.info(
      `Mining the block containing "${Buffer.from(this.block.data).toString()}"`
    );
    while (nonce < maxNonce) {
      const data = this.prepareData(nonce);
      let hash = sha256(data);
      process.stdout.write(`\rRetry with hash: ${hash}`);
      let hashInt = BigInt(`${hash}`);
      if (hashInt < this.target) {
        console.info("Block mined successfully!");
        return { nonce, hash };
      }
      nonce++;
    }

    throw new Error("Failed to find a valid nonce");
  }

  // Validate the proof-of-work
  validate(): boolean {
    const data = this.prepareData(this.block.nonce);
    const hash = sha256(data);
    const hashInt = BigInt(`${hash}`);

    return hashInt < this.target;
  }
}

export default ProofOfWork;
