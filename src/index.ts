import Blockchain from "./blockchain";

const main = async () => {
  const blockchain = new Blockchain();

  blockchain.addBlock("First block");
  blockchain.addBlock("Second block");

  console.log(blockchain.blocks);
};

main();
