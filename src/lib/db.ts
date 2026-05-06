import Dexie, { type Table } from "dexie";
import type { Conversation, Message } from "./types";

class IpsivraDB extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;

  constructor() {
    super("ipsivra");
    this.version(1).stores({
      conversations: "id, updatedAt, createdAt",
      messages: "id, conversationId, createdAt, [conversationId+createdAt]",
    });
  }
}

export const db = new IpsivraDB();

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
