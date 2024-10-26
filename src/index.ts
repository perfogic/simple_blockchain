import Blockchain from "./blockchain";
import { newUTXOTransaction, Transaction } from "./transaction";

const getBalance = (
  address: string,
  mempoolTxs: Transaction[],
  bc: Blockchain
) => {
  let balance = 0;
  let utxos = bc.findUTXO(address, mempoolTxs);
  for (const utxo of utxos) {
    balance += utxo.value;
  }
  return balance;
};

const main = async () => {
  const blockchain = new Blockchain("Validator");
  let mempoolTxs: Transaction[] = [];
  let tx1 = newUTXOTransaction(
    "Validator",
    "Alice",
    10,
    mempoolTxs,
    blockchain
  );
  mempoolTxs.push(tx1);
  let tx2 = newUTXOTransaction("Validator", "Bob", 5, mempoolTxs, blockchain);
  mempoolTxs.push(tx2);
  blockchain.mineBlock(mempoolTxs);
  mempoolTxs = [];
  blockchain.mineBlock(mempoolTxs);
  blockchain.viewExplorer();
  let aliceBalance = getBalance("Alice", mempoolTxs, blockchain);
  console.log("Alice's balance:", aliceBalance);
  let bobBalance = getBalance("Bob", mempoolTxs, blockchain);
  console.log("Bob's balance:", bobBalance);
  const validatorBalance = getBalance("Validator", mempoolTxs, blockchain);
  console.log("Validator's balance:", validatorBalance);
};

main();
