import { Address, Cell, beginCell, Slice } from "ton-core";

const SNAKE_DATA_PREFIX = 0x00;
const CHUNK_DATA_PREFIX = 0x01;
const ONCHAIN_CONTENT_PREFIX = 0x00;
const OFFCHAIN_CONTENT_PREFIX = 0x01;

export function serializeUri(uri: string): Buffer {
  return Buffer.from(encodeURI(uri));
}

function parseUri(bytes: Buffer): string {
  return bytes.toString();
}

export function createOffchainUriCell(uri: string): Cell {
  const cell = beginCell()
    .storeUint(OFFCHAIN_CONTENT_PREFIX, 8)
    .storeBuffer(serializeUri(uri))
    .endCell();
  return cell;
}

export function parseOffchainUriCell(cell: Cell): string {
  let rs = cell.beginParse();
  if (rs.loadUint(8) !== OFFCHAIN_CONTENT_PREFIX) {
    throw new Error("no OFFCHAIN_CONTENT_PREFIX");
  }

  return parseUri(rs.loadBuffer((cell.bits.length - 8) / 8));
}
