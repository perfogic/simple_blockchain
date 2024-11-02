import Blockchain from "./blockchain";
import { newUTXOTransaction } from "./transaction";
import { hashPubKey } from "./utils";
import Wallets from "./wallets";

const getBalance = (address: string, bc: Blockchain, wallets: Wallets) => {
  let wallet = wallets.getWallet(address);
  let balance = 0;
  let utxos = bc.findUTXO(hashPubKey(wallet.publicKey));
  for (const utxo of utxos) {
    balance += utxo.value;
  }
  return balance;
};

const main = async () => {
  // Set up wallets
  const wallets = new Wallets();
  const validatorWallet = wallets.createWallet();
  const aliceWallet = wallets.createWallet();
  const bobWallet = wallets.createWallet();

  // Interact with blockchain
  const blockchain = new Blockchain(validatorWallet.getAddress());
  let tx1 = newUTXOTransaction(
    validatorWallet.getAddress(),
    aliceWallet.getAddress(),
    10,
    blockchain,
    wallets
  );
  blockchain.signTransaction(tx1, validatorWallet.privateKey);
  blockchain.mineBlock([tx1]);
  let tx2 = newUTXOTransaction(
    validatorWallet.getAddress(),
    aliceWallet.getAddress(),
    5,
    blockchain,
    wallets
  );
  blockchain.signTransaction(tx2, validatorWallet.privateKey);
  blockchain.mineBlock([tx2]);
  let tx3 = newUTXOTransaction(
    aliceWallet.getAddress(),
    bobWallet.getAddress(),
    15,
    blockchain,
    wallets
  );
  blockchain.signTransaction(tx3, aliceWallet.privateKey);
  blockchain.mineBlock([tx3]);

  console.log(
    "Balance of Alice:",
    getBalance(aliceWallet.getAddress(), blockchain, wallets)
  );
  console.log(
    "Balance of Bob:",
    getBalance(bobWallet.getAddress(), blockchain, wallets)
  );
  console.log(
    "Balance of Validator:",
    getBalance(validatorWallet.getAddress(), blockchain, wallets)
  );
};

main();
