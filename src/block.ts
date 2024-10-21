import { sha256 } from "@ethersproject/crypto";

class Block {
  public timestamp: number;
  public data: string;
  public prevBlockHash: string;
  public hash: string;

  constructor(data: string, prevBlockHash: string) {
    this.timestamp = Math.floor(new Date().getTime() / 1000);
    this.data = data;
    this.prevBlockHash = prevBlockHash;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    const timestampStr = this.timestamp.toString();
    const headers = Buffer.concat([
      Buffer.from(this.prevBlockHash),
      Buffer.from(this.data),
      Buffer.from(timestampStr),
    ]);
    const hash = sha256(headers);
    return hash;
  }

  static createGenesisBlock(): Block {
    return new Block("Genesis Block", "");
  }
}

export default Block;
