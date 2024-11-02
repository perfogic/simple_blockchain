import Wallet from "../wallet";

const newWallet = new Wallet();
console.log("Public key:", newWallet.publicKey.toString("hex"));
console.log("Private key:", newWallet.privateKey.toString("hex"));
console.log("Address:", newWallet.getAddress());
console.log(Wallet.validateAddress(newWallet.getAddress()));
