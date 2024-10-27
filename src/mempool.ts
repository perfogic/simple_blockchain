import { Transaction } from "./transaction";

class Mempool {
  public transactions: Transaction[];

  constructor() {
    this.transactions = [];
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
  }

  getRawMempools() {
    return this.transactions;
  }

  clear() {
    this.transactions = [];
  }
}

export default Mempool;
