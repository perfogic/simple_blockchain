import bs58 from "bs58";

let encodedValue = bs58.encode(Buffer.from("Hello, world!"));
console.log({ encodedValue });
console.log(
  Buffer.from(bs58.decode(encodedValue)).toString("utf8") === "Hello, world!"
);
