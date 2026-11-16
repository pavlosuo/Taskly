"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Task } from "shared/index";

interface SingleTaskContextValue {
  task: Task;
  setTask: (task: Task) => void;
}

const SingleTaskContext = createContext<SingleTaskContextValue | null>(null);

interface SingleTaskProviderProps extends PropsWithChildren {
  initialTask: Task;
}

export function SingleTaskProvider({
  initialTask,
  children,
}: SingleTaskProviderProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const [prevInitialTask, setPrevInitialTask] = useState<Task>(initialTask);

  if (prevInitialTask !== initialTask) {
    setPrevInitialTask(initialTask);
    setTask(initialTask);
  }

  const value = useMemo(() => ({ task, setTask }), [task]);

  return (
    <SingleTaskContext.Provider value={value}>
      {children}
    </SingleTaskContext.Provider>
  );
}

export function useSingleTask() {
  const context = useContext(SingleTaskContext);
  if (!context) {
    throw new Error("useSingleTask must be used within SingleTaskProvider");
  }
  return context;
}