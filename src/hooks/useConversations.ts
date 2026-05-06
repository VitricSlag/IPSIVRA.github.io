import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { db, newId } from "@/lib/db";
import {
  DEFAULT_MODEL_ID,
  DEFAULT_SYSTEM_PROMPT,
  type Conversation,
  type Message,
  type Role,
} from "@/lib/types";
import { truncate } from "@/lib/utils";

export interface UseConversationsApi {
  conversations: Conversation[] | undefined;
  createConversation: (modelId?: string) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  setSystemPrompt: (id: string, systemPrompt: string) => Promise<void>;
  setModelForConversation: (id: string, modelId: string) => Promise<void>;
  appendMessage: (
    conversationId: string,
    role: Role,
    content: string,
    extra?: Partial<Message>,
  ) => Promise<string>;
  updateMessage: (id: string, patch: Partial<Message>) => Promise<void>;
  removeMessage: (id: string) => Promise<void>;
  touchConversation: (id: string) => Promise<void>;
}

export function useConversations(): UseConversationsApi {
  const conversations = useLiveQuery(
    () => db.conversations.orderBy("updatedAt").reverse().toArray(),
    [],
  );

  const createConversation = useCallback(
    async (modelId: string = DEFAULT_MODEL_ID): Promise<string> => {
      const now = Date.now();
      const id = newId();
      const conv: Conversation = {
        id,
        title: "New conversation",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        modelId,
        createdAt: now,
        updatedAt: now,
      };
      await db.conversations.add(conv);
      return id;
    },
    [],
  );

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    await db.transaction("rw", db.conversations, db.messages, async () => {
      await db.messages.where("conversationId").equals(id).delete();
      await db.conversations.delete(id);
    });
  }, []);

  const renameConversation = useCallback(
    async (id: string, title: string): Promise<void> => {
      await db.conversations.update(id, {
        title: truncate(title, 80),
        updatedAt: Date.now(),
      });
    },
    [],
  );

  const setSystemPrompt = useCallback(
    async (id: string, systemPrompt: string): Promise<void> => {
      await db.conversations.update(id, {
        systemPrompt,
        updatedAt: Date.now(),
      });
    },
    [],
  );

  const setModelForConversation = useCallback(
    async (id: string, modelId: string): Promise<void> => {
      await db.conversations.update(id, { modelId, updatedAt: Date.now() });
    },
    [],
  );

  const appendMessage = useCallback(
    async (
      conversationId: string,
      role: Role,
      content: string,
      extra?: Partial<Message>,
    ): Promise<string> => {
      const id = newId();
      const now = Date.now();
      const msg: Message = {
        id,
        conversationId,
        role,
        content,
        createdAt: now,
        ...extra,
      };
      await db.transaction("rw", db.conversations, db.messages, async () => {
        await db.messages.add(msg);
        await db.conversations.update(conversationId, { updatedAt: now });
      });
      return id;
    },
    [],
  );

  const updateMessage = useCallback(
    async (id: string, patch: Partial<Message>): Promise<void> => {
      await db.messages.update(id, patch);
    },
    [],
  );

  const removeMessage = useCallback(async (id: string): Promise<void> => {
    await db.messages.delete(id);
  }, []);

  const touchConversation = useCallback(async (id: string): Promise<void> => {
    await db.conversations.update(id, { updatedAt: Date.now() });
  }, []);

  return {
    conversations,
    createConversation,
    deleteConversation,
    renameConversation,
    setSystemPrompt,
    setModelForConversation,
    appendMessage,
    updateMessage,
    removeMessage,
    touchConversation,
  };
}

export function useMessages(conversationId: string | null): Message[] {
  const messages = useLiveQuery(async () => {
    if (!conversationId) return [];
    const rows = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .toArray();
    rows.sort((a, b) => a.createdAt - b.createdAt);
    return rows;
  }, [conversationId]);
  return messages ?? [];
}
