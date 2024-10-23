import { sha256 } from "@ethersproject/crypto";
import ProofOfWork from "./proofofwork";
import { Transaction } from "./transaction";
import {
  classToPlain,
  instanceToPlain,
  plainToInstance,
} from "class-transformer";

class Block {
  public timestamp: number;
  public transactions: Transaction[];
  public prevBlockHash: string;
  public hash: string;
  public nonce: bigint;

  constructor(transactions: Transaction[], prevBlockHash: string) {
    this.timestamp = Math.floor(new Date().getTime() / 1000);
    this.transactions = transactions;
    this.prevBlockHash = prevBlockHash;
    let pow = new ProofOfWork(this);
    const { hash, nonce } = pow.run();
    this.hash = hash;
    this.nonce = nonce;
  }

  serialize(): string {
    return JSON.stringify(instanceToPlain(this));
  }

  hashTransactions(): string {
    const txIds = this.transactions.map((tx) => tx.txid);
    const txs = txIds.join("");
    return sha256(Buffer.from(txs));
  }

  static createGenesisBlock(coinbase: Transaction): Block {
    return new Block([coinbase], "");
  }

  static deserialize(data: string): Block {
    const plain = JSON.parse(data);
    return plainToInstance(Block, plain as Object);
  }
}

export default Block;
