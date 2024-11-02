import * as btc from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { BIP32Factory } from "bip32";
import { sha256, ripemd160 } from "@ethersproject/crypto";
import crypto from "crypto";
import bs58 from "bs58";
import { getBytes } from "./utils";

const version = 0x00;
const checkSumLen = 4;

class Wallet {
  privateKey: Buffer;
  publicKey: Buffer;

  constructor() {
    const { privateKey, publicKey } = this.generateKeyPair();
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  generateKeyPair(): { privateKey: Buffer; publicKey: Buffer } {
    const bip32 = BIP32Factory(ecc);
    const randSeed = crypto.randomBytes(32);
    const keyPair = bip32.fromSeed(randSeed, btc.networks.bitcoin);
    return {
      privateKey: Buffer.from(keyPair.privateKey!),
      publicKey: Buffer.from(keyPair.publicKey),
    };
  }

  getAddress() {
    const pubKeyHash = this.hashPubKey(this.publicKey);
    const versionedPayload = Buffer.concat([
      Buffer.from([version]),
      pubKeyHash,
    ]);
    const checksum = this.checksum(versionedPayload);
    const fullPayload = Buffer.concat([versionedPayload, checksum]);
    return bs58.encode(fullPayload);
  }

  hashPubKey(pubKey: Buffer): Buffer {
    const publicSHA256 = sha256(pubKey);
    const publicRIPEMD160 = ripemd160(publicSHA256);
    return getBytes(publicRIPEMD160);
  }

  checksum(payload: Buffer): Buffer {
    const firstSHA = sha256(payload);
    const secondSHA = sha256(getBytes(firstSHA));
    return getBytes(secondSHA).slice(0, checkSumLen);
  }

  static validateAddress(address: string): boolean {
    const addressDecode = bs58.decode(address);
    const actualChecksum = addressDecode.slice(-checkSumLen);
    const version = addressDecode[0];
    const payload = addressDecode.slice(1, -checkSumLen);
    const targetChecksum = this.prototype.checksum(
      Buffer.concat([Buffer.from([version]), payload])
    );
    return (
      Buffer.from(actualChecksum).toString("hex") ===
      targetChecksum.toString("hex")
    );
  }
}

export default Wallet;
