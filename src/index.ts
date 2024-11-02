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
  let tx = newUTXOTransaction(
    validatorWallet.getAddress(),
    aliceWallet.getAddress(),
    10,
    blockchain,
    wallets
  );
  blockchain.signTransaction(tx, validatorWallet.privateKey);
  blockchain.mineBlock([tx]);
  tx = newUTXOTransaction(
    validatorWallet.getAddress(),
    aliceWallet.getAddress(),
    5,
    blockchain,
    wallets
  );
  blockchain.signTransaction(tx, validatorWallet.privateKey);
  blockchain.mineBlock([tx]);
  tx = newUTXOTransaction(
    aliceWallet.getAddress(),
    bobWallet.getAddress(),
    15,
    blockchain,
    wallets
  );
  blockchain.signTransaction(tx, aliceWallet.privateKey);
  blockchain.mineBlock([tx]);
  tx = newUTXOTransaction(
    bobWallet.getAddress(),
    validatorWallet.getAddress(),
    5,
    blockchain,
    wallets
  );
  blockchain.signTransaction(tx, bobWallet.privateKey);
  blockchain.mineBlock([tx]);

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
