"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  startTransition,
} from "react";
import {
  Task,
  TaskCreateForm,
  TaskUpdateForm,
  TaskListQuery,
  TaskResponseItem,
  TaskResponseCreateForm,
} from "@shared/types";
import { axiosApi } from "api/index";

interface TaskContextType {
  allTasks: Task[];
  myTasks: Task[];
  isLoading: boolean;
  isInitialized: boolean;
  fetchTasks: (query?: TaskListQuery) => Promise<void>;
  createTask: (payload: TaskCreateForm) => Promise<Task>;
  updateTask: (id: string, payload: TaskUpdateForm) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  respondToTask: (
    taskId: string,
    payload: TaskResponseCreateForm,
  ) => Promise<TaskResponseItem>;
  getTaskResponses: (taskId: string) => Promise<TaskResponseItem[]>;
  acceptResponse: (taskId: string, responseId: string) => Promise<void>;
  withdrawResponse: (taskId: string, responseId: string) => Promise<void>;
  declineResponse: (taskId: string, responseId: string) => Promise<void>;
}

interface TaskProviderProps {
  children: ReactNode;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider = ({ children }: TaskProviderProps) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchTasks = useCallback(async (query?: TaskListQuery) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.getTasks(query);
      setAllTasks(data.allItems);
      setMyTasks(data.myItems);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const createTask = useCallback(async (payload: TaskCreateForm) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.createTask(payload);
      setAllTasks((prev) => [data.task, ...prev]);
      setMyTasks((prev) => [data.task, ...prev]);
      return data.task;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTask = useCallback(
    async (id: string, payload: TaskUpdateForm) => {
      try {
        setIsLoading(true);
        await axiosApi.updateTask(id, payload);
        setAllTasks((prev) =>
          prev.map((t) => (t._id === id ? { ...t, ...payload } : t)),
        );
        setMyTasks((prev) =>
          prev.map((t) => (t._id === id ? { ...t, ...payload } : t)),
        );
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteTask = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await axiosApi.deleteTask(id);
      setAllTasks((prev) => prev.filter((t) => t._id !== id));
      setMyTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelTask = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await axiosApi.cancelTask(id);
      setAllTasks((prev) => {
        return prev.map((t) =>
          t._id === id ? { ...t, status: "cancelled" } : t,
        );
      });
      setMyTasks((prev) => {
        return prev.map((t) =>
          t._id === id ? { ...t, status: "cancelled" } : t,
        );
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeTask = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await axiosApi.completeTask(id);
      setAllTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: "completed" } : t)),
      );
      setMyTasks((prev) =>
        prev.map((t) => (t._id === id ? { ...t, status: "completed" } : t)),
      );
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respondToTask = useCallback(
    async (taskId: string, payload: TaskResponseCreateForm) => {
      try {
        setIsLoading(true);
        const { data } = await axiosApi.createTaskResponse(taskId, payload);
        return data.response;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getTaskResponses = useCallback(async (taskId: string) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.getTaskResponses(taskId);
      return data.items;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptResponse = useCallback(
    async (taskId: string, responseId: string) => {
      try {
        setIsLoading(true);
        await axiosApi.acceptTaskResponse(taskId, responseId);
        setAllTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, status: "assigned" } : t,
          ),
        );
        setMyTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, status: "assigned" } : t,
          ),
        );
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const declineResponse = useCallback(
    async (taskId: string, responseId: string) => {
      try {
        setIsLoading(true);
        await axiosApi.declineTaskResponse(taskId, responseId);
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const withdrawResponse = useCallback(
    async (taskId: string, responseId: string) => {
      try {
        setIsLoading(true);
        await axiosApi.withdrawTaskResponse(taskId, responseId);
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    startTransition(() => {
      fetchTasks();
    });
  }, [fetchTasks]);

  return (
    <TaskContext.Provider
      value={{
        allTasks,
        myTasks,
        isLoading,
        isInitialized,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        cancelTask,
        completeTask,
        respondToTask,
        getTaskResponses,
        acceptResponse,
        withdrawResponse,
        declineResponse,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used within TaskProvider");
  return context;
};
