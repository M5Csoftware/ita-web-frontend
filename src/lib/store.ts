import { InterfaceItem, TransactionRecord } from '@/types/interface';
import { INITIAL_INTERFACES, INITIAL_TRANSACTIONS } from './mock-data';

// Global singleton in memory for dev server persistence
declare global {
  var __ITA_INTERFACES__: InterfaceItem[] | undefined;
  var __ITA_TRANSACTIONS__: TransactionRecord[] | undefined;
}

if (!global.__ITA_INTERFACES__) {
  global.__ITA_INTERFACES__ = [...INITIAL_INTERFACES];
}

if (!global.__ITA_TRANSACTIONS__) {
  global.__ITA_TRANSACTIONS__ = [...INITIAL_TRANSACTIONS];
}

export function getInterfaces(): InterfaceItem[] {
  return global.__ITA_INTERFACES__ || INITIAL_INTERFACES;
}

export function setInterfaces(items: InterfaceItem[]): void {
  global.__ITA_INTERFACES__ = items;
}

export function getTransactions(): TransactionRecord[] {
  return global.__ITA_TRANSACTIONS__ || INITIAL_TRANSACTIONS;
}

export function addTransaction(record: TransactionRecord): void {
  const list = global.__ITA_TRANSACTIONS__ || [];
  global.__ITA_TRANSACTIONS__ = [record, ...list].slice(0, 50);
}
