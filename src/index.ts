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
  blockchain.broadcastTx(tx1);
  let tx2 = newUTXOTransaction("Validator", "Bob", 5, blockchain);
  blockchain.broadcastTx(tx2);
  blockchain.mineBlock();
  blockchain.viewExplorer();
  let aliceBalance = getBalance("Alice", blockchain);
  console.log("Alice's balance:", aliceBalance);
  let bobBalance = getBalance("Bob", blockchain);
  console.log("Bob's balance:", bobBalance);
  const validatorBalance = getBalance("Validator", blockchain);
  console.log("Validator's balance:", validatorBalance);
};

main();
