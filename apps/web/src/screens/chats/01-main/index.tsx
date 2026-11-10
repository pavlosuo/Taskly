"use client";
import { useState, useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { Search, X, Loader2 } from "lucide-react";
import { axiosApi } from "@/api/index";
import { ChatMemberPreview, ChatWithMember } from "shared/types";
import { useChats } from "@/providers/ChatProvider";
import { ChatListItem } from "@/screens/chats/ui/ChatListItem";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { Input } from "@/components/shared/Input";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

export const Main = ({ chats: initialChats }: { chats: ChatWithMember[] }) => {
  const { t } = useTranslation("chats");
  const router = useRouter();
  const {
    chats: storedChats,
    isLoading,
    isInitialized,
    createChat,
  } = useChats();
  const chats = isInitialized ? storedChats : initialChats;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatMemberPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = query.trim();
  const isSearchMode = trimmed.length > 0;
  const isQueryTooShort = trimmed.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      startTransition(() => {
        setResults([]);
        setIsSearching(false);
      });
      return;
    }
    let cancelled = false;
    startTransition(() => {
      setIsSearching(true);
    });
    const timeout = setTimeout(async () => {
      try {
        const { data } = await axiosApi.searchUsers(trimmed);
        if (!cancelled) setResults(data.items);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmed]);

  const handleSelect = async (userId: string) => {
    if (startingId) return;
    try {
      setStartingId(userId);
      const chat = await createChat(userId);
      router.push(`/chats/${chat._id}`);
    } catch {
      return;
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
    <div className="w-full pb-6 px-4 pt-1">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey pointer-events-none"
        />
        <Input
          name="search"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-grey hover:text-foreground"
            aria-label={t("search.clear")}
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        )}
      </div>
      {isSearchMode ? (
        <div className="pt-2">
          {isSearching && (
            <div role="status" className="py-10 flex justify-center text-grey">
              <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
              <span className="sr-only">{t("search.searching")}</span>
            </div>
          )}
          {!isSearching && !isQueryTooShort && results.length === 0 && (
            <p role="status" className="py-10 text-center text-sm text-grey">
              {t("search.noResults")}
            </p>
          )}
          {!isSearching && isQueryTooShort && (
            <p role="status" className="py-10 text-center text-sm text-grey">
              {t("search.keepTyping", { min: MIN_QUERY_LENGTH })}
            </p>
          )}
          <div className="divide-y divide-border">
            {!isSearching &&
              results.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => handleSelect(u._id)}
                  disabled={startingId !== null}
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
                    <Loader2
                      aria-hidden="true"
                      className="w-4 h-4 animate-spin text-grey shrink-0"
                    />
                  )}
                </button>
              ))}
          </div>
        </div>
      ) : (
        <>
          {isLoading && chats.length === 0 && (
            <div role="status" className="py-16 text-center text-sm text-grey">
              {t("list.loading")}
            </div>
          )}
          {!isLoading && chats.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-grey">{t("list.empty.title")}</p>
              <p className="text-xs text-grey mt-1">{t("list.empty.hint")}</p>
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
