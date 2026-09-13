"use client";
import { createContext, useContext, ReactNode } from "react";
import { ChatWithMember, Message } from "@shared/types";

interface SingleChatContextType {
  chat: ChatWithMember;
  onMessageSent: (message: Message) => void;
  onMessageUpdate: (message: Message) => void;
  onMessageDelete: (messageId: string) => void;
}

const SingleChatContext = createContext<SingleChatContextType | null>(null);

export const SingleChatProvider = ({
  value,
  children,
}: {
  value: SingleChatContextType;
  children: ReactNode;
}) => (
  <SingleChatContext.Provider value={value}>
    {children}
  </SingleChatContext.Provider>
);

export const useSingleChat = (): SingleChatContextType => {
  const ctx = useContext(SingleChatContext);
  if (!ctx) {
    throw new Error("useSingleChat must be used within SingleChatProvider");
  }
  return ctx;
};
