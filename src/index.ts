import Blockchain from "./blockchain";
import { newUTXOTransaction } from "./transaction";

const getBalance = (address: string, bc: Blockchain) => {
  let balance = 0;
  let utxos = bc.findUTXO(address);
  for (const utxo of utxos) {
    balance += utxo.value;
  }
  return balance;
};

const main = async () => {
  const blockchain = new Blockchain("Validator");
  let tx1 = newUTXOTransaction("Validator", "Alice", 10, blockchain);
  blockchain.mineBlock([tx1]);
  let tx2 = newUTXOTransaction("Validator", "Bob", 5, blockchain);
  blockchain.mineBlock([tx2]);
  let tx3 = newUTXOTransaction("Bob", "Alice", 2, blockchain);
  blockchain.mineBlock([tx3]);
  let tx4 = newUTXOTransaction("Alice", "Jacy", 5, blockchain);
  let tx5 = newUTXOTransaction("Bob", "Jacy", 1, blockchain);
  blockchain.mineBlock([tx4, tx5]);
  let tx6 = newUTXOTransaction("Jacy", "David", 3, blockchain);
  blockchain.mineBlock([tx6]);
  blockchain.viewExplorer();
  let aliceBalance = getBalance("Alice", blockchain);
  console.log("Alice's balance:", aliceBalance);
  let bobBalance = getBalance("Bob", blockchain);
  console.log("Bob's balance:", bobBalance);
  let jacyBalance = getBalance("Jacy", blockchain);
  console.log("Jacy's balance:", jacyBalance);
  let davidBalance = getBalance("David", blockchain);
  console.log("David's balance:", davidBalance);
  const validatorBalance = getBalance("Validator", blockchain);
  console.log("Validator's balance:", validatorBalance);
};

main();
