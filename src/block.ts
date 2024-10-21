import { sha256 } from "@ethersproject/crypto";
import ProofOfWork from "./proofofwork";

class Block {
  public timestamp: number;
  public data: string;
  public prevBlockHash: string;
  public hash: string;
  public nonce: bigint;

  constructor(data: string, prevBlockHash: string) {
    this.timestamp = Math.floor(new Date().getTime() / 1000);
    this.data = data;
    this.prevBlockHash = prevBlockHash;
    let pow = new ProofOfWork(this);
    const { hash, nonce } = pow.run();
    this.hash = hash;
    this.nonce = nonce;
  }

  static createGenesisBlock(): Block {
    return new Block("Genesis Block", "");
  }
}

export default Block;
