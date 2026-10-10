"use client";
import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Task, TaskList, TABS, TAB_LABELS } from "shared/index";
import { useTasks } from "@/providers/TaskProvider";
import {
  CreateTaskDialog,
  TaskListItem,
  ClientView,
  TaskToolbar,
  TaskTabs,
  TaskEmptyState,
} from "@/screens/tasks/ui";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isFiltered } from "@/utils/tasksUtils";

export const Client = (initial: TaskList) => {
  const b = useTasks(initial);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { t } = useTranslation(["tasks", "common"]);

  const openTask = (task: Task) => {
    setSelectedTaskId(task._id);
    setDialogOpen(true);
  };

  const filtered = isFiltered(b.filters, b.query);
  const isEmpty = b.visible.length === 0;
  const emptyKey = b.tab === "my" ? "my" : "open";

  return (
    <div className="w-full px-4 pb-6 pt-1">
      <div className="flex flex-col gap-4 pb-4">
        <div className="grid grid-cols-[1fr_max-content_max-content] items-center gap-3">
          <p className="text-sm text-grey">{t("client.title")}</p>
          <CreateTaskDialog />
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
          placeholder={t("actions.search")}
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
          ) : (
            <TaskEmptyState
              icon={<ClipboardList aria-hidden="true" className="h-5 w-5" />}
              title={t(`client.empty.${emptyKey}.title`)}
              text={t(`client.empty.${emptyKey}.text`)}
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
        {b.visible.map((task) => (
          <TaskListItem key={task._id} task={task} onClick={openTask} />
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] gap-0 overflow-y-auto sm:max-w-5xl">
          <ClientView
            task={b.findTask(selectedTaskId)}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
