"use client";
import { useEffect, useState, startTransition } from "react";
import { Briefcase, Loader2, Send } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/hooks/useTranslation";
import { Task, TaskList, TABS, TAB_LABELS } from "shared/index";
import { useTasks } from "@/providers/TaskProvider";
import {
  TaskerView,
  TaskListItem,
  TaskToolbar,
  TaskTabs,
  TaskEmptyState,
} from "@/screens/tasks/ui";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isFiltered } from "@/utils/tasksUtils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SingleTaskProvider } from "@/providers/SingleTaskProvider";

export const Tasker = (initial: TaskList) => {
  const b = useTasks(initial);
  const { t } = useTranslation(["tasks", "common"]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("taskId");
  const [activeId, setActiveId] = useState<string | null>(urlTaskId);
  const found = b.findTask(activeId) ?? null;
  const [open, setOpen] = useState(Boolean(found));
  const [snapshot, setSnapshot] = useState<Task | null>(found);

  useEffect(() => {
    if (found) {
      startTransition(() => {
        setSnapshot(found);
      });
    }
  }, [found]);

  const task = found ?? snapshot;

  const updateUrl = (id: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (id) next.set("taskId", id);
    else next.delete("taskId");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  useEffect(() => {
    startTransition(() => {
      if (urlTaskId) {
        setActiveId(urlTaskId);
        setOpen(true);
      } else {
        setOpen(false);
      }
    });
  }, [urlTaskId]);

  const openTask = (item: Task) => {
    setSnapshot(item);
    setActiveId(item._id);
    setOpen(true);
    updateUrl(item._id);
  };

  const closeTask = () => {
    setOpen(false);
    updateUrl(null);
  };

  const filtered = isFiltered(b.filters, b.query);
  const isEmpty = b.visible.length === 0;

  return (
    <SingleTaskProvider key={task?._id} initialTask={task as Task}>
      <div className="w-full px-4 pb-6 pt-1">
        <div className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-grey">{t("tasker.title")}</p>
            <TaskTabs
              tabs={TABS.map((tab) => ({
                value: tab,
                label: t(TAB_LABELS[tab]),
                count: tab === "my" ? b.myCount : undefined,
              }))}
              value={b.tab}
              onChange={b.changeTab}
            />
          </div>
          <TaskToolbar
            query={b.query}
            onQueryChange={b.setQuery}
            isSearching={b.isListLoading && !isEmpty}
            filters={b.filters}
            onFiltersChange={b.setFilters}
            statusOptions={b.statusOptions}
            placeholder={
              b.tab === "all" ? t("actions.searchAll") : t("actions.searchMy")
            }
          />
        </div>
        {!isEmpty && (
          <p className="mb-4 text-xs text-grey">
            {t("list.showing", { shown: b.shown, count: b.total })}
          </p>
        )}
        {isEmpty && b.isListLoading && (
          <div role="status" className="flex justify-center py-10 text-grey">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            <span className="sr-only">{t("common:loading")}</span>
          </div>
        )}
        {isEmpty && !b.isListLoading && (
          <>
            {filtered ? (
              <TaskEmptyState
                title={t("empty.noMatches.title")}
                text={t("empty.noMatches.text")}
                action={
                  <Button variant="outline" size="sm" onClick={b.reset}>
                    {t("empty.noMatches.action")}
                  </Button>
                }
              />
            ) : b.tab === "my" ? (
              <TaskEmptyState
                icon={<Send aria-hidden="true" className="h-5 w-5" />}
                title={t("tasker.empty.my.title")}
                text={t("tasker.empty.my.text")}
                action={
                  <Button size="sm" onClick={() => b.changeTab("all")}>
                    {t("tasker.empty.my.action")}
                  </Button>
                }
              />
            ) : (
              <TaskEmptyState
                icon={<Briefcase aria-hidden="true" className="h-5 w-5" />}
                title={t("tasker.empty.open.title")}
                text={t("tasker.empty.open.text")}
              />
            )}
          </>
        )}
        <div
          className={clsx(
            "flex w-full flex-col gap-2 transition-opacity",
            b.isListLoading && !isEmpty && "opacity-60",
          )}
        >
          {b.visible.map((item) => (
            <TaskListItem key={item._id} task={item} onClick={openTask} />
          ))}
        </div>
        {b.hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={b.loadMoreTasks}
              disabled={b.isLoadingMore}
            >
              {b.isLoadingMore ? t("common:loading") : t("list.loadMore")}
            </Button>
          </div>
        )}
        <Dialog
          open={open && Boolean(task)}
          onOpenChange={(next) => (next ? setOpen(true) : closeTask())}
        >
          <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] gap-0 overflow-y-auto sm:max-w-5xl">
            <TaskerView onClose={closeTask} />
          </DialogContent>
        </Dialog>
      </div>
    </SingleTaskProvider>
  );
};
