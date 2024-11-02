import { instanceToPlain } from "class-transformer";
import Block from "./block";
import { newCoinbaseTx, Transaction, TxOutput } from "./transaction";

const genesisCoinbaseData =
  "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks";

interface KeyValueDB {
  [key: string]: string;
}

interface UnspentTransaction {
  tx: Transaction;
  vout: number;
}

class Blockchain {
  public blocks: Block[];
  public blocksDb: { [key: string]: number };
  public tipHash: string;

  constructor(validatorAddress: string) {
    const genesisBlock = Block.createGenesisBlock(
      newCoinbaseTx(validatorAddress, Buffer.from(genesisCoinbaseData))
    );
    this.blocks = [genesisBlock];
    this.blocksDb = {
      [genesisBlock.hash]: 0,
    };
    this.tipHash = genesisBlock.hash;
  }

  mineBlock(transactions: Transaction[]): void {
    const prevBlock = this.blocks[this.blocks.length - 1];
    for (const tx of transactions) {
      if (!this.verifyTransaction(tx)) {
        throw new Error("ERROR: Invalid transaction");
      }
    }
    const newBlock = new Block(transactions, prevBlock.hash);
    let currentIndex = this.blocks.length;
    this.blocks.push(newBlock);
    this.tipHash = newBlock.hash;
    this.blocksDb = {
      ...this.blocksDb,
      [newBlock.hash]: currentIndex,
    };
  }

  findUnspentTransactions(pubkeyHash: Buffer): UnspentTransaction[] {
    let spentTxos = {} as { [key: string]: boolean };
    let unspentTxs: UnspentTransaction[] = [];

    let currentHash = this.tipHash;
    while (true) {
      let block = this.blocks[this.blocksDb[currentHash]];
      for (const tx of block.transactions) {
        // Loop through vins to detect spent txos
        if (!tx.isCoinbase()) {
          for (const txVin of tx.txVins) {
            if (txVin.usesKey(pubkeyHash)) {
              const inTxID = txVin.txid;
              const vout = txVin.vout;
              spentTxos[`${inTxID}-${vout}`] = true;
            }
          }
        }

        // Let's find unspent txos
        let txVouts = tx.txVouts;
        for (let i = 0; i < txVouts.length; i++) {
          if (spentTxos[`${tx.txid}-${i}`] === undefined) {
            if (txVouts[i].isLockedWithKey(pubkeyHash)) {
              unspentTxs.push({
                tx,
                vout: i,
              });
            }
          }
        }
      }
      currentHash = block.prevBlockHash;
      if (currentHash == "") {
        break;
      }
    }

    return unspentTxs;
  }

  findUTXO(pubkeyHash: Buffer): TxOutput[] {
    let utxos = [] as TxOutput[];
    let unspentTxs = this.findUnspentTransactions(pubkeyHash);
    for (const unspentTx of unspentTxs) {
      let transaction = unspentTx.tx;
      let txVouts = transaction.txVouts;
      let vout = unspentTx.vout;
      utxos.push(txVouts[vout]);
    }
    return utxos;
  }

  findSpendableOutputs(
    pubkeyHash: Buffer,
    amount: number
  ): { totalAccumulate: number; unspentOutputs: { [key: string]: number[] } } {
    let unspentOutputs: { [key: string]: number[] } = {};
    let unspentTxs = this.findUnspentTransactions(pubkeyHash);
    let totalAccumulate = 0;
    for (const unspentTx of unspentTxs) {
      let transaction = unspentTx.tx;
      let txid = transaction.txid;
      if (unspentOutputs[txid] === undefined) {
        unspentOutputs[txid] = [];
      }

      let txVouts = transaction.txVouts;
      let vout = unspentTx.vout;
      let txVout = txVouts[vout];
      totalAccumulate += txVout.value;
      unspentOutputs[txid].push(vout);

      if (totalAccumulate >= amount) {
        break;
      }
    }
    return { totalAccumulate, unspentOutputs };
  }

  viewExplorer(): void {
    let i = 0;
    for (const block of this.blocks) {
      console.log(`Block with height ${i}:`);
      console.dir(instanceToPlain(block), { depth: null });
      i++;
    }
  }

  findTransaction(txid: string): Transaction {
    for (const block of this.blocks) {
      for (const tx of block.transactions) {
        if (tx.txid === txid) {
          return tx;
        }
      }
    }
    throw new Error("Transaction not found");
  }

  signTransaction(tx: Transaction, privKey: Buffer) {
    let prevTxs: { [key: string]: Transaction } = {};

    for (const vin of tx.txVins) {
      let prevTx = this.findTransaction(vin.txid);
      prevTxs[vin.txid] = prevTx;
    }

    tx.sign(privKey, prevTxs);
  }

  verifyTransaction(tx: Transaction): boolean {
    let prevTxs: { [key: string]: Transaction } = {};

    for (const vin of tx.txVins) {
      let prevTx = this.findTransaction(vin.txid);
      prevTxs[vin.txid] = prevTx;
    }

    return tx.verify(prevTxs);
  }
}

export default Blockchain;
