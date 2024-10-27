import { instanceToPlain } from "class-transformer";
import Block from "./block";
import {
  isCoinbase,
  newCoinbaseTx,
  Transaction,
  TxOutput,
} from "./transaction";
import Mempool from "./mempool";

const genesisCoinbaseData =
  "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks";

interface UnspentTransaction {
  tx: Transaction;
  vout: number;
}

class Blockchain {
  public blocks: Block[];
  public blocksDb: { [key: string]: number };
  public tipHash: string;
  public mempool: Mempool;

  constructor(validatorAddress: string) {
    const genesisBlock = Block.createGenesisBlock(
      newCoinbaseTx(validatorAddress, genesisCoinbaseData)
    );
    this.blocks = [genesisBlock];
    this.blocksDb = {
      [genesisBlock.hash]: 0,
    };
    this.tipHash = genesisBlock.hash;
    this.mempool = new Mempool();
  }

  broadcastTx(tx: Transaction): void {
    this.mempool.addTransaction(tx);
  }

  mineBlock(): void {
    let txs = this.mempool.getRawMempools();
    const prevBlock = this.blocks[this.blocks.length - 1];
    const newBlock = new Block(txs, prevBlock.hash);
    let currentIndex = this.blocks.length;
    this.blocks.push(newBlock);
    this.tipHash = newBlock.hash;
    this.blocksDb = {
      ...this.blocksDb,
      [newBlock.hash]: currentIndex,
    };
    this.mempool.clear();
  }

  findUnspentTransactions(address: string): UnspentTransaction[] {
    let spentTxos = {} as { [key: string]: boolean };
    let unspentTxs: UnspentTransaction[] = [];
    let mempoolTxs = this.mempool.getRawMempools();
    let currentHash = this.tipHash;

    while (true) {
      let block = this.blocks[this.blocksDb[currentHash]];
      // Index mempool tx
      for (const tx of mempoolTxs) {
        for (const txVin of tx.txVins) {
          spentTxos[`${txVin.txid}-${txVin.vout}`] = true;
        }
      }

      for (const tx of [...block.transactions, ...mempoolTxs]) {
        // Detect used transactions from txVins
        if (!isCoinbase(tx)) {
          for (const txVin of tx.txVins) {
            if (txVin.canUnlockOutputWith(address)) {
              const inTxID = txVin.txid;
              const vout = txVin.vout;
              spentTxos[`${inTxID}-${vout}`] = true;
            }
          }
        }
      }

      for (const tx of [...block.transactions, ...mempoolTxs]) {
        // Find out unspent transactions from txVouts
        let txVouts = tx.txVouts;
        for (let i = 0; i < txVouts.length; i++) {
          if (spentTxos[`${tx.txid}-${i}`] === undefined) {
            if (txVouts[i].canBeUnlockedWith(address)) {
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

  findUTXO(address: string): TxOutput[] {
    let utxos = [] as TxOutput[];
    let unspentTxs = this.findUnspentTransactions(address);
    for (const unspentTx of unspentTxs) {
      let transaction = unspentTx.tx;
      let txVouts = transaction.txVouts;
      let vout = unspentTx.vout;
      utxos.push(txVouts[vout]);
    }
    return utxos;
  }

  findSpendableOutputs(
    address: string,
    amount: number
  ): { totalAccumulate: number; unspentOutputs: { [key: string]: number[] } } {
    let unspentOutputs: { [key: string]: number[] } = {};
    let unspentTxs = this.findUnspentTransactions(address);
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
}

export default Blockchain;
