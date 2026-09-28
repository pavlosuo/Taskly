"use client";
import { useState, useEffect, startTransition } from "react";
import { Search, X, Loader2, SlidersHorizontal } from "lucide-react";
import { axiosApi } from "api/index";
import { Task, TaskListQuery, TaskList } from "@shared/types";
import { useTasks } from "@/providers/TaskProvider";
import { Input } from "@/shared/components/Input";
import { TaskerView, TaskListItem } from "@/screens/tasks/ui";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Tasker = ({ allItems, myItems, page, limit, total }: TaskList) => {
  const { allTasks, myTasks, isLoading, isInitialized } = useTasks();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Task[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const isSearchMode = query.trim().length > 0;
  const [tab, setTab] = useState<"all" | "my">("all");
  const tasks =
    tab === "all"
      ? isInitialized
        ? allTasks
        : allItems
      : isInitialized
        ? myTasks
        : myItems;
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const selectedTask = selectedTaskId
    ? (tasks.find((t) => t._id === selectedTaskId) ?? null)
    : null;
  const list = isSearchMode ? results : tasks;

  useEffect(() => {
    startTransition(() => {
      if (query.trim().length === 0) {
        setResults(null);
        return;
      }
      setIsSearching(true);
    });
    const timeout = setTimeout(async () => {
      try {
        const params: TaskListQuery = { q: query.trim() };
        const { data } = await axiosApi.getTasks(params);
        setResults(data.allItems);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const openTask = (task: Task) => {
    setSelectedTaskId(task._id);
    setDialogOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
  };

  return (
    <div className="w-full pb-6 px-4 pt-1">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey pointer-events-none" />
          <Input
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-grey hover:text-foreground"
              aria-label="Clean"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border text-grey hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Filter"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="pt-2">
        {(isSearching || (isLoading && !isSearchMode)) &&
          list?.length === 0 && (
            <div className="py-10 flex justify-center text-grey">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        {!isSearching && isSearchMode && results?.length === 0 && (
          <p className="py-10 text-center text-sm text-grey">
            Tasks not found.
          </p>
        )}
        {!isLoading && !isSearchMode && tasks.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-grey">No tasks yet.</p>
            <p className="text-xs text-grey mt-1">Check again later.</p>
          </div>
        )}
        <div className="flex flex-col w-full mt-4 gap-2">
          {(list ?? []).map((task) => (
            <TaskListItem key={task._id} task={task} onClick={openTask} />
          ))}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-5xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto gap-0">
            <TaskerView
              task={selectedTask}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
