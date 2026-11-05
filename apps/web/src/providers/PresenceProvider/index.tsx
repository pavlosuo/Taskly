"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  startTransition,
} from "react";
import { useSocket } from "@/providers/SocketProvider";

interface PresenceContextType {
  onlineUserIds: Set<string>;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: new Set(),
});

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;
    const handleInitial = ({ userIds }: { userIds: string[] }) => {
      setOnlineUserIds(new Set(userIds));
    };
    const handleOnline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    };
    const handleOffline = ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };
    socket.on("presence:initial", handleInitial);
    socket.on("presence:online", handleOnline);
    socket.on("presence:offline", handleOffline);
    return () => {
      socket.off("presence:initial", handleInitial);
      socket.off("presence:online", handleOnline);
      socket.off("presence:offline", handleOffline);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket)
      startTransition(() => {
        setOnlineUserIds(new Set());
      });
  }, [socket]);

  return (
    <PresenceContext.Provider
      value={{
        onlineUserIds,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
