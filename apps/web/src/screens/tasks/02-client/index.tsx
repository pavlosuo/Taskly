"use client";
import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import clsx from "clsx";
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

  const openTask = (task: Task) => {
    setSelectedTaskId(task._id);
    setDialogOpen(true);
  };

  const filtered = isFiltered(b.filters, b.query);
  const isEmpty = b.visible.length === 0;

  return (
    <div className="w-full px-4 pb-6 pt-1">
      <div className="flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-grey">Create tasks and manage responses</p>
          <CreateTaskDialog />
        </div>
        <TaskTabs
          tabs={TABS.map((t) => ({
            value: t,
            label: TAB_LABELS[t],
            count: t === "my" ? b.myCount : undefined,
          }))}
          value={b.tab}
          onChange={b.changeTab}
        />
        <TaskToolbar
          query={b.query}
          onQueryChange={b.setQuery}
          isSearching={b.isListLoading && !isEmpty}
          filters={b.filters}
          onFiltersChange={b.setFilters}
          statusOptions={b.statusOptions}
          placeholder="Search tasks..."
        />
      </div>
      {b.listError && (
        <p className="mb-3 text-xs text-destructive">{b.listError}</p>
      )}
      {!isEmpty && (
        <p className="mb-2 text-xs text-grey">
          Showing {b.shown} of {b.total}
        </p>
      )}
      {isEmpty && b.isListLoading && (
        <div className="flex justify-center py-10 text-grey">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
      {isEmpty && !b.isListLoading && (
        <>
          {filtered ? (
            <TaskEmptyState
              title="No tasks match your search"
              text="Try a different keyword or loosen the filters."
              action={
                <Button variant="outline" size="sm" onClick={b.reset}>
                  Clear search and filters
                </Button>
              }
            />
          ) : (
            <TaskEmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title={
                b.tab === "my"
                  ? "You don't have any tasks yet"
                  : "No open tasks right now"
              }
              text={
                b.tab === "my"
                  ? 'Click "New task" to create the first one.'
                  : "Check again later."
              }
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
            {b.isLoadingMore ? "Loading..." : "Load more"}
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
