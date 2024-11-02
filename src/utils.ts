export function getBytes(address: string): Buffer {
  if (!address.startsWith("0x")) {
    throw new Error("Address must start with 0x");
  }
  return Buffer.from(address.slice(2), "hex");
}
