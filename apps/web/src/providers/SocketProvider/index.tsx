"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@/providers/UserProvider";
import { BASE_URL } from "@/api/instance";
import { startTransition } from "react";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?._id) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      startTransition(() => {
        setSocket(null);
        setIsConnected(false);
      });
      return;
    }
    const instance = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    instance.on("connect", () => setIsConnected(true));
    instance.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") instance.connect();
    });
    socketRef.current = instance;
    startTransition(() => {
      setSocket(instance);
    });
    return () => {
      instance.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
