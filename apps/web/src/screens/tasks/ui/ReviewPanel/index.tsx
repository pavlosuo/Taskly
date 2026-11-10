"use client";
import { useEffect, useState, FormEvent } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2, Star } from "lucide-react";
import clsx from "clsx";
import {
  TaskReviews,
  ReviewItem,
  reviewCreateSchema,
  REVIEW_COMMENT_MAX_LENGTH,
} from "shared/index";
import { useTasks } from "@/providers/TaskProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/shared/FieldError";

const Stars = ({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
}) => {
  const { t } = useTranslation("tasks");
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Star
            aria-hidden="true"
            className={clsx(
              size === "sm" ? "h-4 w-4" : "h-6 w-6",
              n <= value ? "fill-amber-400 text-amber-400" : "text-grey",
            )}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            aria-label={t("review.stars", { count: n })}
            aria-pressed={n === value}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
};

const ReviewBlock = ({
  title,
  review,
}: {
  title: string;
  review: ReviewItem;
}) => (
  <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-3">
    <p className="mb-1.5 text-xs text-grey">{title}</p>
    <Stars value={review.rating} size="sm" />
    {review.comment && (
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
        {review.comment}
      </p>
    )}
  </div>
);

export const ReviewPanel = ({ taskId }: { taskId: string }) => {
  const { t } = useTranslation("tasks");
  const { getTaskReviews, createReview, isLoading } = useTasks();
  const [data, setData] = useState<TaskReviews | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    (async function () {
      try {
        const reviews = await getTaskReviews(taskId);
        if (!cancelled) setData(reviews);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId, getTaskReviews]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const parsed = reviewCreateSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(undefined);
    try {
      const review = await createReview(taskId, parsed.data);
      setData((prev) => ({ mine: review, received: prev?.received ?? null }));
    } catch {}
  };

  if (!data) {
    return (
      <div role="status" className="flex justify-center py-4">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">{t("review.title")}</p>
      {data.mine ? (
        <ReviewBlock title={t("review.yours")} review={data.mine} />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-3"
        >
          <Stars value={rating} onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("review.placeholder")}
            maxLength={REVIEW_COMMENT_MAX_LENGTH}
            rows={3}
            className="resize-none border border-border"
          />
          <FieldError message={error} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading && (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              )}
              {t("review.submit")}
            </Button>
          </div>
        </form>
      )}
      {data.received ? (
        <ReviewBlock title={t("review.received")} review={data.received} />
      ) : (
        data.mine && <p className="text-xs text-grey">{t("review.waiting")}</p>
      )}
    </div>
  );
};
