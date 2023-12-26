import {
  Contract,
  ContractProvider,
  Sender,
  Address,
  Cell,
  contractAddress,
  beginCell,
} from "ton-core";
import {
  createOffchainUriCell,
  parseOffchainUriCell,
  serializeUri,
} from "./nftUtil";

export default class NFTCollection implements Contract {
  static createForDeploy(
    initCode: Cell,
    ownerAddress: Address,
    collectionContentUri: string,
    nftItemContentBaseUri: string,
    nftItemCode: Cell,
    royalty: number,
    royaltyAddress: Address
  ): NFTCollection {
    let royaltyBase = 1000;
    let royaltyFactor = Math.floor(royalty * royaltyBase);
    const initData = this.createDataCell(
      ownerAddress,
      collectionContentUri,
      nftItemContentBaseUri,
      nftItemCode,
      royaltyFactor,
      royaltyBase,
      royaltyAddress
    );
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, {
      code: initCode,
      data: initData,
    });
    console.log("Owner address:", ownerAddress.toString({ testOnly: true }));
    console.log("Collection url:", collectionContentUri);
    console.log("Content base url:", nftItemContentBaseUri);
    console.log("Royalty factor:", royaltyFactor);
    console.log("Royalty base:", royaltyBase);
    console.log("Deploy to address：", address.toString());
    console.log(
      "Royalty address:",
      royaltyAddress.toString({ testOnly: true })
    );
    return new NFTCollection(address, { code: initCode, data: initData });
  }

  async sendDeploy(provider: ContractProvider, via: Sender) {
    console.log(provider);
    await provider.internal(via, {
      value: "0.1", // send 0.1 TON to contract for rent
      bounce: false,
    });
  }

  constructor(
    readonly address: Address,
    readonly init?: {
      code: Cell;
      data: Cell;
    }
  ) {}

  static createContentCell(
    collectionContentUri: string,
    nftItemContentBaseUri: string
  ) {
    const collectionContentCell = createOffchainUriCell(collectionContentUri);
    const commonContentCell = beginCell()
      .storeBuffer(serializeUri(nftItemContentBaseUri))
      .endCell();

    return beginCell()
      .storeRef(collectionContentCell)
      .storeRef(commonContentCell)
      .endCell();
  }

  static createRoyaltyCell(
    royaltyFactor: number,
    royaltyBase: number,
    royaltyAddress: Address
  ): Cell {
    return beginCell()
      .storeUint(royaltyFactor, 16)
      .storeUint(royaltyBase, 16)
      .storeAddress(royaltyAddress)
      .endCell();
  }

  static createDataCell(
    ownerAddress: Address,
    collectionContentUri: string,
    nftItemContentBaseUri: string,
    nftItemCode: Cell,
    royaltyFactor: number,
    royaltyBase: number,
    royaltyAddress: Address
  ): Cell {
    let contentCell = this.createContentCell(
      collectionContentUri,
      nftItemContentBaseUri
    );
    let codeHexCell = nftItemCode;
    let royaltyCell = this.createRoyaltyCell(
      royaltyFactor,
      royaltyBase,
      royaltyAddress
    );
    return beginCell()
      .storeAddress(ownerAddress)
      .storeUint(0, 64)
      .storeRef(contentCell)
      .storeRef(codeHexCell)
      .storeRef(royaltyCell)
      .endCell();
  }

  async getCollectionData(provider: ContractProvider) {
    const { stack } = await provider.get("get_collection_data", []);
    return stack.readBigNumber();
  }
}
