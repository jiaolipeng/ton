import fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, internal, SendMode } from "ton";
import { contractAddress, Cell, beginCell } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
import { WalletContractV3R2 } from "ton";

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
console.log(newContractAddress);

const mnemonic =
  "recipe size finger fiction open scrap stable lava afraid knock sibling sting visual fuel knife catalog hidden much bid adult maid palm nurse ocean";
const key = await mnemonicToWalletKey(mnemonic.split(" "));

const wallet = WalletContractV3R2.create({
  publicKey: key.publicKey,
  workchain: 0,
});

const endpoint = await getHttpEndpoint({
  network: "testnet", // or "mainnet", according to your choice
});

const client = new TonClient({ endpoint });

async function callGetter() {
  const call = await client.callGetMethod(newContractAddress, "counter"); // newContractAddress from deploy
  console.log(`Counter value is ${call.stack.readBigNumber().toString()}`);
}

async function sendMessage() {
  const messageBody = beginCell().storeUint(1, 32).storeUint(0, 64).endCell(); // op with value 1 (increment)

  const walletContract = client.open(wallet);
  const seqno = await walletContract.getSeqno(); // get the next seqno of our wallet

  const transfer = walletContract.createTransfer({
    seqno,
    messages: [
      internal({
        to: newContractAddress.toString(),
        value: "0.02",
        bounce: false,
        body: messageBody,
      }),
    ],
    secretKey: key.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATLY + SendMode.IGNORE_ERRORS,
  });

  await client.sendExternalMessage(wallet, transfer);
}

//sendMessage();
callGetter();
