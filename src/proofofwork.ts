import { sha256 } from "@ethersproject/crypto";
import Block from "./block";

class ProofOfWork {
  target: bigint;
  targetBits: bigint;
  maxNonce: bigint;

  constructor(
    targetBits: bigint = 15n,
    maxNonce: bigint = 9223372036854775807n
  ) {
    this.targetBits = targetBits;
    this.maxNonce = maxNonce;
    this.target = 1n << (256n - targetBits); // 1 << (256 - targetBits)
  }

  // Prepare data for hashing
  private prepareData(block: Block, nonce: bigint): Uint8Array {
    const components = [
      block.prevBlockHash,
      block.data,
      block.timestamp.toString(16),
      this.targetBits.toString(16),
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
  run({ block }: { block: Block }): { nonce: bigint; hash: string } {
    let nonce = 0n;

    console.info(
      `Mining the block containing "${Buffer.from(block.data).toString()}"`
    );
    while (nonce < this.maxNonce) {
      const data = this.prepareData(block, nonce);
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
  validate({ block }: { block: Block }): boolean {
    const data = this.prepareData(block, block.nonce);
    const hash = sha256(data);
    const hashInt = BigInt(`${hash}`);

    return hashInt < this.target;
  }
}

export default ProofOfWork;
