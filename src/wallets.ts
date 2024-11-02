import Wallet from "./wallet";

class Wallets {
  wallets: { [key: string]: Wallet } = {};

  createWallet() {
    const wallet = new Wallet();
    this.addWallet(wallet);
    return wallet;
  }

  addWallet(wallet: Wallet) {
    this.wallets[wallet.getAddress()] = wallet;
  }

  getWallet(address: string) {
    return this.wallets[address];
  }
}

export default Wallets;
