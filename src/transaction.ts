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
  vins: TxInput[];
  vouts: TxOutput[];
}

export function newCoinbaseTx(to: string, data: string): Transaction {
  const txin = new TxInput("", -1, data);
  const txout = new TxOutput(50_00_000_000, to);
  return {
    txid: "",
    vins: [txin],
    vouts: [txout],
  };
}

export function isCoinbase(tx: Transaction) {
  return tx.vins.length == 1 && tx.vins[0].txid == "" && tx.vins[0].vout == -1;
}

// export function newUTXOTransaction(
//   from: string,
//   to: string,
//   amount: number,
//   bc: Blockchain
// ): Transaction {
//   let inputs: TxInput[] = [];
//   let outputs: TxOutput[] = [];

//   let acc = 0;
//   let validOutputs: { [txid: string]: number } = {};
//   let txs = bc.blocks.flatMap((b) => b.transactions);

//   for (let tx of txs) {
//     if (tx.vins[0].canUnlockOutputWith(from)) {
//       acc += tx.vouts[0].value;
//       validOutputs[tx.txid] = tx.vouts[0].value;
//       inputs.push(tx.vins[0]);

//       if (acc >= amount) {
//         break;
//       }
//     }
//   }

//   let leftover = acc - amount;
//   outputs.push(new TxOutput(amount, to));
//   if (leftover > 0) {
//     outputs.push(new TxOutput(leftover, from));
//   }

//   let tx = {
//     txid: "",
//     vins: inputs,
//     vouts: outputs,
//   };

//   return tx;
// }
