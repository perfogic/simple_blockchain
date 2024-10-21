import Block from "./block";

class Blockchain {
  public blocks: Block[];

  constructor() {
    this.blocks = [Block.createGenesisBlock()];
  }

  addBlock(data: string): void {
    const prevBlock = this.blocks[this.blocks.length - 1];
    const newBlock = new Block(data, prevBlock.hash);
    this.blocks.push(newBlock);
  }
}

export default Blockchain;
