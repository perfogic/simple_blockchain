import { sha256 } from "@ethersproject/crypto";
import Blockchain from "./blockchain";

export class TxInput {
  public txid: string;
  public vout: number;
  public scriptSig: string;

  constructor(txid: string, vout: number, scriptSig: string) {
    this.txid = txid;
    this.vout = vout;
    this.scriptSig = scriptSig;
  }

  canUnlockOutputWith(unlockingData: string): boolean {
    return this.scriptSig === unlockingData;
  }
}

export class TxOutput {
  public value: number;
  public scriptPubkey: string;

  constructor(value: number, scriptPubkey: string) {
    this.value = value;
    this.scriptPubkey = scriptPubkey;
  }

  canBeUnlockedWith(unlockingData: string): boolean {
    return this.scriptPubkey === unlockingData;
  }
}

export interface Transaction {
  txid: string;
  txVins: TxInput[];
  txVouts: TxOutput[];
}

export function newCoinbaseTx(to: string, data: string): Transaction {
  const txin = new TxInput("", -1, data);
  const txout = new TxOutput(50_00_000_000, to);
  return {
    txid: "",
    txVins: [txin],
    txVouts: [txout],
  };
}

export function isCoinbase(tx: Transaction) {
  return (
    tx.txVins.length == 1 && tx.txVins[0].txid == "" && tx.txVins[0].vout == -1
  );
}

export function newUTXOTransaction(
  from: string,
  to: string,
  amount: number,
  mempool: Transaction[],
  bc: Blockchain
): Transaction {
  let inputs = [] as TxInput[];
  let outputs = [] as TxOutput[];
  let { totalAccumulate, unspentOutputs } = bc.findSpendableOutputs(
    from,
    amount,
    mempool
  );

  if (totalAccumulate < amount) {
    throw new Error(`ERROR: Not enough funds`);
  }

  for (const txid of Object.keys(unspentOutputs)) {
    let vouts = unspentOutputs[txid];
    for (const vout of vouts) {
      let input = new TxInput(txid, vout, from);
      inputs.push(input);
    }
  }

  outputs.push(new TxOutput(amount, to));
  if (totalAccumulate > amount) {
    outputs.push(new TxOutput(totalAccumulate - amount, from));
  }
  return {
    txid: sha256(Buffer.from(JSON.stringify({ inputs, outputs }))),
    txVins: inputs,
    txVouts: outputs,
  };
}
