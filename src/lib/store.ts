import { InterfaceItem, TransactionRecord } from '@/types/interface';

declare global {
  var __ITA_STORE_VERSION__: number | undefined;
  var __ITA_INTERFACES__: InterfaceItem[] | undefined;
  var __ITA_TRANSACTIONS__: TransactionRecord[] | undefined;
}

if (global.__ITA_STORE_VERSION__ !== 1) {
  global.__ITA_INTERFACES__ = [];
  global.__ITA_TRANSACTIONS__ = [];
  global.__ITA_STORE_VERSION__ = 1;
}

export function getInterfaces(): InterfaceItem[] {
  return global.__ITA_INTERFACES__ ?? [];
}

export function setInterfaces(items: InterfaceItem[]): void {
  global.__ITA_INTERFACES__ = items;
}

export function getTransactions(): TransactionRecord[] {
  return global.__ITA_TRANSACTIONS__ ?? [];
}

export function addTransaction(record: TransactionRecord): void {
  const list = global.__ITA_TRANSACTIONS__ || [];
  global.__ITA_TRANSACTIONS__ = [record, ...list].slice(0, 50);
}
