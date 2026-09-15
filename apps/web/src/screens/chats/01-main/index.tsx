"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { axiosApi } from "api/index";
import { ChatMemberPreview, ChatWithMember } from "@shared/types";
import { useChats } from "@/providers/ChatProvider";
import { ChatListItem } from "@/screens/chats/ui/ChatListItem";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import { Input } from "@/shared/components/Input";
import { startTransition } from "react";

export const Main = ({ chats: initialChats }: { chats: ChatWithMember[] }) => {
  const router = useRouter();
  const { chats: storedChats, isLoading, createChat } = useChats();
  const chats = storedChats.length > 0 ? storedChats : initialChats;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatMemberPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSearchMode = query.trim().length > 0;

  useEffect(() => {
    if (query.trim().length < 2) return;
    startTransition(() => {
      setIsSearching(true);
    });
    const timeout = setTimeout(async () => {
      try {
        const { data } = await axiosApi.searchUsers(query.trim());
        setResults(data.items);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = async (userId: string) => {
    try {
      setStartingId(userId);
      const chat = await createChat(userId);
      router.push(`/chats/${chat._id}`);
    } finally {
      setStartingId(null);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full pb-6 px-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey pointer-events-none" />
        <Input
          name="search"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username to start a chat..."
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-grey hover:text-foreground"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {isSearchMode ? (
        <div className="pt-2">
          {isSearching && (
            <div className="py-10 flex justify-center text-grey">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <p className="py-10 text-center text-sm text-grey">
              No users found.
            </p>
          )}
          {!isSearching && query.trim().length < 2 && (
            <p className="py-10 text-center text-sm text-grey">
              Keep typing...
            </p>
          )}
          <div className="divide-y divide-border">
            {!isSearching &&
              results.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleSelect(u._id)}
                  disabled={startingId === u._id}
                  className="w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 text-left"
                >
                  {u.avatar ? (
                    <ImageDisplay
                      src={u.avatar.url}
                      alt={u.fullName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      {u.initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.fullName}
                    </p>
                    <p className="text-xs text-grey truncate">@{u.username}</p>
                  </div>
                  {startingId === u._id && (
                    <Loader2 className="w-4 h-4 animate-spin text-grey shrink-0" />
                  )}
                </button>
              ))}
          </div>
        </div>
      ) : (
        <>
          {isLoading && chats.length === 0 && (
            <div className="py-16 text-center text-sm text-grey">
              Loading...
            </div>
          )}
          {!isLoading && chats.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-grey">No conversations yet.</p>
              <p className="text-xs text-grey mt-1">
                Search for a username above to start one.
              </p>
            </div>
          )}
          <div className="divide-y divide-primary flex flex-col w-full mt-2">
            {chats.map((chat) => (
              <ChatListItem key={chat._id} chat={chat} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
