import { sha256 } from "@ethersproject/crypto";
import Blockchain from "./blockchain";
import { CHECK_SUM_LEN } from "./wallet";
import { getBytes, hashPubKey } from "./utils";
import bs58 from "bs58";
import * as ecc from "tiny-secp256k1";
import Wallets from "./wallets";

export class TxInput {
  public txid: string;
  public vout: number;
  public signature: Buffer | undefined;
  public pubkey: Buffer;

  constructor(
    txid: string,
    vout: number,
    signature: Buffer | undefined,
    pubkey: Buffer
  ) {
    this.txid = txid;
    this.vout = vout;
    this.signature = signature;
    this.pubkey = pubkey;
  }

  usesKey(pubkeyHash: Buffer): boolean {
    let lockingHash = hashPubKey(this.pubkey);
    return lockingHash === pubkeyHash;
  }
}

export class TxOutput {
  public value: number;
  public pubkeyHash: Buffer = Buffer.from("");

  constructor(value: number, address: string) {
    this.value = value;
    this.lock(address);
  }

  lock(address: string) {
    let pubkeyHash = bs58.decode(address);
    this.pubkeyHash = Buffer.from(pubkeyHash.slice(1, -CHECK_SUM_LEN));
  }

  isLockedWithKey(pubkeyHash: Buffer): boolean {
    return Buffer.compare(this.pubkeyHash, pubkeyHash) === 0;
  }
}

export class Transaction {
  public txid: string;
  public txVins: TxInput[];
  public txVouts: TxOutput[];

  constructor(txVins: TxInput[], txVouts: TxOutput[]) {
    this.txVins = txVins;
    this.txVouts = txVouts;
    this.txid = this.hash();
  }

  isCoinbase() {
    return (
      this.txVins.length == 1 &&
      this.txVins[0].txid == "" &&
      this.txVins[0].vout == -1
    );
  }

  clone(): Transaction {
    return new Transaction(this.txVins, this.txVouts);
  }

  sign(privKey: Buffer, prevTxs: { [key: string]: Transaction }) {
    if (this.isCoinbase()) {
      return;
    }

    for (const vin of this.txVins) {
      if (!prevTxs[vin.txid]) {
        throw new Error("ERROR: Previous transaction is not correct");
      }
    }

    for (let i = 0; i < this.txVins.length; i++) {
      let vin = this.txVins[i];
      const signature = ecc.sign(getBytes(vin.txid), privKey);
      this.txVins[i].signature = Buffer.from(signature);
    }
  }

  verify(prevTxs: { [key: string]: Transaction }): boolean {
    if (this.isCoinbase()) {
      return true;
    }

    for (const vin of this.txVins) {
      if (!prevTxs[vin.txid]) {
        throw new Error("ERROR: Previous transaction is not correct");
      }
    }
    for (let i = 0; i < this.txVins.length; i++) {
      let vin = this.txVins[i];
      const isValid = ecc.verify(
        getBytes(vin.txid),
        vin.pubkey,
        vin.signature!
      );
      if (isValid === false) {
        return false;
      }
    }
    return true;
  }

  hash(): string {
    return sha256(
      Buffer.from(
        JSON.stringify({
          txVins: this.txVins,
          txVouts: this.txVouts,
        })
      )
    );
  }
}

export function newCoinbaseTx(to: string, data: Buffer): Transaction {
  const txin = new TxInput("", -1, undefined, data);
  const txout = new TxOutput(50_00_000_000, to);
  return new Transaction([txin], [txout]);
}

export function newUTXOTransaction(
  from: string,
  to: string,
  amount: number,
  bc: Blockchain,
  wallets: Wallets
): Transaction {
  let wallet = wallets.getWallet(from);
  let pubkeyHash = hashPubKey(wallet.publicKey);
  let inputs = [] as TxInput[];
  let outputs = [] as TxOutput[];
  let { totalAccumulate, unspentOutputs } = bc.findSpendableOutputs(
    pubkeyHash,
    amount
  );

  if (totalAccumulate < amount) {
    throw new Error(`ERROR: Not enough funds`);
  }

  for (const txid of Object.keys(unspentOutputs)) {
    let vouts = unspentOutputs[txid];
    for (const vout of vouts) {
      let input = new TxInput(txid, vout, undefined, wallet.publicKey);
      inputs.push(input);
    }
  }

  outputs.push(new TxOutput(amount, to));
  if (totalAccumulate > amount) {
    outputs.push(new TxOutput(totalAccumulate - amount, from));
  }

  const data = {
    txid: sha256(Buffer.from(JSON.stringify({ inputs, outputs }))),
    txVins: inputs,
    txVouts: outputs,
  };

  return new Transaction(data.txVins, data.txVouts);
}
