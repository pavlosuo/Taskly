"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Task, TaskList } from "shared/types";
import { useTasks } from "@/providers/TaskProvider";
import { CreateTaskDialog, TaskListItem, ClientView } from "@/screens/tasks/ui";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tab } from "@/screens/tasks/types";
import { tabs } from "@/screens/tasks/data";

export const Client = ({ allItems, myItems, page, limit, total }: TaskList) => {
  const { allTasks, myTasks, isLoading, isInitialized } = useTasks();
  const [tab, setTab] = useState<Tab>(tabs[0]);
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

  const openTask = (task: Task) => {
    setSelectedTaskId(task._id);
    setDialogOpen(true);
  };

  return (
    <div className="w-full pb-6 px-4 pt-1">
      <div className="grid grid-cols-[1fr_max-content_max-content] gap-2 pb-4">
        <p className="text-sm text-grey">Create tasks and manage responses</p>
        <CreateTaskDialog />
        <div className="grid grid-cols-2 gap-2 w-full">
          {tabs.map((t) => (
            <Button
              key={t}
              onClick={() => setTab(t)}
              variant={tab === t ? "default" : "outline"}
            >
              {t === "all" ? "All tasks" : "My tasks"}
            </Button>
          ))}
        </div>
      </div>
      {isLoading && tasks.length === 0 && (
        <div className="py-10 flex justify-center text-grey">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      {!isLoading && tasks.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-grey">{`You don't have any tasks yet.`}</p>
          <p className="text-xs text-grey mt-1">
            {'Click "New task" to create the first one.'}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-2 w-full">
        {tasks.map((task) => (
          <TaskListItem key={task._id} task={task} onClick={openTask} />
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-5xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto gap-0">
          <ClientView
            task={selectedTask}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
