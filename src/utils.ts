import { sha256, ripemd160 } from "@ethersproject/crypto";
import { CHECK_SUM_LEN } from "./wallet";

export function getBytes(address: string): Buffer {
  if (!address.startsWith("0x")) {
    throw new Error("Address must start with 0x");
  }
  return Buffer.from(address.slice(2), "hex");
}

export function hashPubKey(pubKey: Buffer): Buffer {
  const publicSHA256 = sha256(pubKey);
  const publicRIPEMD160 = ripemd160(publicSHA256);
  return getBytes(publicRIPEMD160);
}

export function checksum(payload: Buffer): Buffer {
  const firstSHA = sha256(payload);
  const secondSHA = sha256(getBytes(firstSHA));
  return getBytes(secondSHA).slice(0, CHECK_SUM_LEN);
}
