import Block from "./block";
import {
  isCoinbase,
  newCoinbaseTx,
  Transaction,
  TxOutput,
} from "./transaction";

const genesisCoinbaseData =
  "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks";

interface KeyValueDB {
  [key: string]: string;
}

interface UnspentTransaction {
  tx: Transaction;
  vout: TxOutput;
}

class Blockchain {
  public blocks: Block[];
  public blocksDb: KeyValueDB;
  public tipHash: string;

  constructor() {
    const genesisBlock = Block.createGenesisBlock(
      newCoinbaseTx("", genesisCoinbaseData)
    );
    this.blocks = [genesisBlock];
    this.blocksDb = {};
    this.tipHash = genesisBlock.hash;
  }

  addBlock(transactions: Transaction[]): void {
    const prevBlock = this.blocks[this.blocks.length - 1];
    const newBlock = new Block(transactions, prevBlock.hash);
    this.blocks.push(newBlock);
    this.tipHash = newBlock.hash;
    this.blocksDb[newBlock.hash] = newBlock.serialize();
  }

  findUnspentTransactions(address: string): UnspentTransaction[] {
    let unspentTxs: UnspentTransaction[] = [];
    let spentTxos = {} as { [key: string]: boolean };

    let currentHash = this.tipHash;
    while (true) {
      let block = Block.deserialize(this.blocksDb[currentHash]);
      for (const tx of block.transactions) {
        let vouts = tx.vouts;
        for (const vout of vouts) {
          if (spentTxos[`${tx.txid} - ${vout}`] === undefined) {
            if (vout.canBeUnlockedWith(address)) {
              unspentTxs.push({
                tx,
                vout,
              });
            }
          }
        }

        if (!isCoinbase(tx)) {
          for (const vin of tx.vins) {
            if (vin.canUnlockOutputWith(address)) {
              const inTxID = vin.txid;
              spentTxos[`${inTxID} - ${vin.vout}`] = true;
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
    for (const tx of unspentTxs) {
      utxos.push(tx.vout);
    }
    return utxos;
  }
}

export default Blockchain;
