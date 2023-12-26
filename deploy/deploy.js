import fs from "fs";
import { contractAddress, Cell, beginCell } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { WalletContractV3R2 } from "ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, internal, SendMode } from "ton";

function initData() {
  const initialCounterValue = 116;
  return beginCell().storeUint(initialCounterValue, 64).endCell();
}

const initDataCell = initData(); // the function we've implemented just now
const initCodeCell = Cell.fromBoc(
  fs.readFileSync("../contracts/counter.cell")
)[0]; // compilation output from step 6

const newContractAddress = contractAddress(0, {
  code: initCodeCell,
  data: initDataCell,
});
console.log(`Contract address: ${newContractAddress}`);

const mnemonic =
  "recipe size finger fiction open scrap stable lava afraid knock sibling sting visual fuel knife catalog hidden much bid adult maid palm nurse ocean";
const key = await mnemonicToWalletKey(mnemonic.split(" "));

const wallet = WalletContractV3R2.create({
  publicKey: key.publicKey,
  workchain: 0,
});

// print wallet address
console.log(`Wallet address: ${wallet.address.toString({ testOnly: true })}`);

// print wallet workchain
console.log("workchain:", wallet.address.workChain);

async function deploy() {
  const endpoint = await getHttpEndpoint({
    network: "testnet", // or "mainnet", according to your choice
  });

  const client = new TonClient({ endpoint });

  const walletContract = client.open(wallet);
  const seqno = await walletContract.getSeqno(); // get the next seqno of our wallet

  const transfer = walletContract.createTransfer({
    seqno,
    messages: [
      internal({
        to: newContractAddress.toString(),
        value: "0.02",
        init: { data: initDataCell, code: initCodeCell },
        bounce: false,
      }),
    ],
    secretKey: key.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
  });

  await client.sendExternalMessage(wallet, transfer);
}

//deploy();
