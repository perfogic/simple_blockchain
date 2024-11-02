import * as btc from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
import crypto from "crypto";
import bs58 from "bs58";
import { checksum, hashPubKey } from "./utils";

const version = 0x00;
export const CHECK_SUM_LEN = 4;

class Wallet {
  privateKey: Buffer;
  publicKey: Buffer;

  constructor() {
    const { privateKey, publicKey } = this.generateKeyPair();
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  generateKeyPair(): {
    privateKey: Buffer;
    publicKey: Buffer;
  } {
    const bip32 = BIP32Factory(ecc);
    const randSeed = crypto.randomBytes(32);
    const keyPair = bip32.fromSeed(randSeed, btc.networks.bitcoin);
    return {
      privateKey: Buffer.from(keyPair.privateKey!),
      publicKey: Buffer.from(keyPair.publicKey),
    };
  }

  getAddress() {
    const pubKeyHash = hashPubKey(this.publicKey);
    const versionedPayload = Buffer.concat([
      Buffer.from([version]),
      pubKeyHash,
    ]);
    const checksumResult = checksum(versionedPayload);
    const fullPayload = Buffer.concat([versionedPayload, checksumResult]);
    return bs58.encode(fullPayload);
  }

  static validateAddress(address: string): boolean {
    const addressDecode = bs58.decode(address);
    const actualChecksum = addressDecode.slice(-CHECK_SUM_LEN);
    const version = addressDecode[0];
    const payload = addressDecode.slice(1, -CHECK_SUM_LEN);
    const targetChecksum = checksum(
      Buffer.concat([Buffer.from([version]), payload])
    );
    return (
      Buffer.from(actualChecksum).toString("hex") ===
      targetChecksum.toString("hex")
    );
  }
}

export default Wallet;
