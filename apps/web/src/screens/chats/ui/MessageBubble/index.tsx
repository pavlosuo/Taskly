"use client";
import { FC } from "react";
import { Message } from "@shared/types";
import { useUser } from "@/providers/UserProvider";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import clsx from "clsx";

export const MessageBubble: FC<{ message: Message; isOwn?: boolean }> = ({
  message,
}) => {
  const { user } = useUser();
  const isOwn = message.senderId === user?._id;
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={clsx("flex mb-2.5", isOwn ? "justify-end" : "justify-start")}
    >
      <div
        className={clsx(
          "max-w-[75%] rounded-2xl p-2",
          isOwn
            ? "bg-primary text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {message.media.length > 0 && (
          <div
            className={clsx(
              "grid gap-1.5",
              message.text ? "mb-2" : "",
              message.media.length > 1 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {message.media.map((m) =>
              m.mimeType?.startsWith("image/") ? (
                <ImageDisplay
                  key={m._id}
                  src={m.url}
                  alt={m.originalName}
                  width={200}
                  height={200}
                  className="object-cover w-48 h-48"
                />
              ) : (
                <a
                  key={m._id}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 px-2.5 py-2 text-xs underline ${
                    isOwn ? "bg-white/10" : "bg-white"
                  }`}
                >
                  {m.originalName}
                </a>
              ),
            )}
          </div>
        )}
        {message.text && (
          <p className="text-sm whitespace-pre-wrap wrap-break-word">
            {message.text}
          </p>
        )}
        <p
          className={clsx(
            "text-[10px] mt-1 text-right",
            isOwn ? "text-white/70" : "text-grey",
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
};
