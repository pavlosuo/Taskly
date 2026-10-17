"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
  useEffect,
  startTransition,
} from "react";
import {
  Task,
  TaskStatus,
  TaskList,
  TaskCreateForm,
  TaskUpdateForm,
  TaskListQuery,
  TaskResponseItem,
  TaskResponseCreateForm,
} from "shared/types";
import {
  TASK_STATUSES,
  TaskFilters,
  TasksTab,
  TASK_DEFAULT_FILTERS,
  TABS,
} from "shared/index";
import { axiosApi } from "@/api/index";
import { useUser } from "@/providers/UserProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { applyTaskFilters, buildTaskQuery } from "@/utils/tasksUtils";
import { useToast } from "@/hooks/useToast";
import { useRun } from "@/hooks/useRun";

interface FetchOptions {
  includeMine?: boolean;
}

interface StatusOption {
  value: "all" | TaskStatus;
  label: string;
  count: number;
}

interface BrowserView {
  visible: Task[];
  statusOptions: StatusOption[];
  myCount: number;
  shown: number;
  total: number;
  hasMore: boolean;
}

interface TaskProviderProps {
  children: ReactNode;
}

interface TaskContextType extends BrowserView {
  allTasks: Task[];
  myTasks: Task[];
  isLoading: boolean;
  isListLoading: boolean;
  isLoadingMore: boolean;
  isInitialized: boolean;
  tab: TasksTab;
  query: string;
  filters: TaskFilters;
  changeTab: (tab: TasksTab) => void;
  setQuery: (query: string) => void;
  setFilters: (filters: TaskFilters) => void;
  reset: () => void;
  findTask: (id: string | null) => Task | null;
  hydrate: (initial: TaskList) => void;
  fetchTasks: (query?: TaskListQuery, options?: FetchOptions) => Promise<void>;
  loadMoreTasks: () => Promise<void>;
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

const TaskContext = createContext<TaskContextType | null>(null);

const deriveBrowser = ({
  allTasks,
  myTasks,
  rawTotal,
  tab,
  query,
  filters,
}: {
  allTasks: Task[];
  myTasks: Task[];
  rawTotal: number;
  tab: TasksTab;
  query: string;
  filters: TaskFilters;
}): BrowserView => {
  const localMy = applyTaskFilters(myTasks, filters, query);
  const visible = tab === "all" ? allTasks : localMy;
  let statusOptions: StatusOption[] = [];

  if (tab === "my") {
    const base = applyTaskFilters(
      myTasks,
      { ...filters, status: "all" },
      query,
    );
    statusOptions = [
      { value: "all", label: "status.all", count: base.length },
      ...TASK_STATUSES.map((s) => ({
        value: s,
        label: `status.${s}`,
        count: base.filter((t) => t.status === s).length,
      })).filter((o) => o.count > 0 || o.value === filters.status),
    ];
  }

  return {
    visible,
    statusOptions,
    myCount: myTasks.length,
    shown: visible.length,
    total: tab === "all" ? rawTotal : localMy.length,
    hasMore: tab === "all" && allTasks.length < rawTotal,
  };
};

const findIn = (lists: Task[][], id: string | null) =>
  id ? (lists.flat().find((t) => t._id === id) ?? null) : null;

export const TaskProvider = ({ children }: TaskProviderProps) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [rawTotal, setRawTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tab, setTab] = useState<TasksTab>(TABS[0]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(TASK_DEFAULT_FILTERS);
  const { user } = useUser();
  const userId = user?._id;
  const lastQueryRef = useRef<TaskListQuery>({});
  const pageRef = useRef(1);
  const requestRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const touchedRef = useRef(false);
  const allRef = useRef<Task[]>([]);
  const readyRef = useRef(false);
  const ssrRef = useRef(false);
  const loadedForRef = useRef<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    allRef.current = allTasks;
  }, [allTasks]);

  const run = useRun(setIsLoading);

  const fetchTasks = useCallback(
    async (q?: TaskListQuery, options?: FetchOptions) => {
      const includeMine = options?.includeMine ?? true;
      const requestId = ++requestRef.current;
      lastQueryRef.current = q ?? {};
      setIsFetching(true);
      try {
        const { data } = await axiosApi.getTasks({
          ...q,
          page: 1,
          includeMine,
        });
        if (requestId !== requestRef.current) return;
        setAllTasks(data.allItems);
        if (includeMine) setMyTasks(data.myItems);
        setRawTotal(data.total);
        pageRef.current = data.page;
        readyRef.current = true;
        setIsInitialized(true);
      } catch (e) {
        if (requestId === requestRef.current) {
          toast(getAxiosError(e));
          readyRef.current = true;
          setIsInitialized(true);
        }
      } finally {
        if (requestId === requestRef.current) setIsFetching(false);
      }
    },
    [toast],
  );

  const hydrate = useCallback((initial: TaskList) => {
    if (readyRef.current) return;
    readyRef.current = true;
    ssrRef.current = true;
    requestRef.current++;
    lastQueryRef.current = {};
    pageRef.current = initial.page;
    setAllTasks(initial.allItems);
    setMyTasks(initial.myItems);
    setRawTotal(initial.total);
    setIsFetching(false);
    setIsInitialized(true);
  }, []);

  const loadMoreTasks = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    const requestId = requestRef.current;
    try {
      const { data } = await axiosApi.getTasks({
        ...lastQueryRef.current,
        page: pageRef.current + 1,
        includeMine: false,
      });
      if (requestId !== requestRef.current) return;
      setAllTasks((prev) => {
        const ids = new Set(prev.map((t) => t._id));
        return [...prev, ...data.allItems.filter((t) => !ids.has(t._id))];
      });
      setRawTotal(data.total);
      pageRef.current = data.page;
    } catch (e) {
      toast(getAxiosError(e));
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!userId || loadedForRef.current === userId) return;
    const adoptSsr = ssrRef.current && loadedForRef.current === null;
    loadedForRef.current = userId;
    if (adoptSsr) return;
    startTransition(() => {
      fetchTasks();
    });
  }, [userId, fetchTasks]);

  const serverKey = useMemo(
    () => JSON.stringify(buildTaskQuery(query, filters)),
    [query, filters],
  );

  useEffect(() => {
    if (tab !== "all" || !isInitialized) return;
    if (serverKey === "{}" && !touchedRef.current) return;
    touchedRef.current = true;
    const timeout = setTimeout(() => {
      fetchTasks(JSON.parse(serverKey), { includeMine: false });
    }, 300);
    return () => clearTimeout(timeout);
  }, [serverKey, tab, isInitialized, fetchTasks]);

  const changeTab = useCallback((next: TasksTab) => {
    setTab(next);
    setFilters((f) => (f.status === "all" ? f : { ...f, status: "all" }));
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setFilters(TASK_DEFAULT_FILTERS);
  }, []);

  const view = useMemo(
    () => deriveBrowser({ allTasks, myTasks, rawTotal, tab, query, filters }),
    [allTasks, myTasks, rawTotal, tab, query, filters],
  );

  const findTask = useCallback(
    (id: string | null) => findIn([allTasks, myTasks], id),
    [allTasks, myTasks],
  );

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    const patch = (t: Task): Task => (t._id === id ? { ...t, status } : t);
    setAllTasks((prev) => prev.map(patch));
    setMyTasks((prev) => prev.map(patch));
  }, []);

  const createTask = useCallback(
    (payload: TaskCreateForm) =>
      run(
        async () => {
          const { data } = await axiosApi.createTask(payload);
          setAllTasks((prev) => [data.task, ...prev]);
          setMyTasks((prev) => [data.task, ...prev]);
          setRawTotal((n) => n + 1);
          return data.task;
        },
        { success: "tasks:create.success" },
      ),
    [run],
  );

  const updateTask = useCallback(
    (id: string, payload: TaskUpdateForm) =>
      run(
        async () => {
          await axiosApi.updateTask(id, payload);
          const patch = (t: Task) => (t._id === id ? { ...t, ...payload } : t);
          setAllTasks((prev) => prev.map(patch as (t: Task) => Task));
          setMyTasks((prev) => prev.map(patch as (t: Task) => Task));
        },
        { success: "tasks:toast.updated" },
      ),
    [run],
  );

  const deleteTask = useCallback(
    (id: string) =>
      run(
        async () => {
          await axiosApi.deleteTask(id);
          if (allRef.current.some((t) => t._id === id)) {
            setRawTotal((n) => Math.max(0, n - 1));
          }
          setAllTasks((prev) => prev.filter((t) => t._id !== id));
          setMyTasks((prev) => prev.filter((t) => t._id !== id));
        },
        { success: "tasks:toast.deleted" },
      ),
    [run],
  );

  const cancelTask = useCallback(
    (id: string) =>
      run(
        async () => {
          await axiosApi.cancelTask(id);
          setStatus(id, "cancelled");
        },
        { success: "tasks:toast.cancelled" },
      ),
    [run, setStatus],
  );

  const completeTask = useCallback(
    (id: string) =>
      run(
        async () => {
          await axiosApi.completeTask(id);
          setStatus(id, "completed");
        },
        { success: "tasks:toast.completed" },
      ),
    [run, setStatus],
  );

  const respondToTask = useCallback(
    (taskId: string, payload: TaskResponseCreateForm) =>
      run(
        async () => {
          const { data } = await axiosApi.createTaskResponse(taskId, payload);
          const response = data.response;
          const myResponse = { status: response.status, price: response.price };
          setAllTasks((prev) =>
            prev.map((t) =>
              t._id === taskId
                ? { ...t, responsesCount: (t.responsesCount ?? 0) + 1 }
                : t,
            ),
          );
          const source = allRef.current.find((t) => t._id === taskId);
          setMyTasks((prev) => {
            if (prev.some((t) => t._id === taskId)) {
              return prev.map((t) =>
                t._id === taskId ? { ...t, myResponse } : t,
              );
            }
            return source
              ? [
                  {
                    ...source,
                    responsesCount: (source.responsesCount ?? 0) + 1,
                    myResponse,
                  },
                  ...prev,
                ]
              : prev;
          });
          return response;
        },
        { success: "tasks:toast.responseSent" },
      ),
    [run],
  );

  const getTaskResponses = useCallback(
    (taskId: string) =>
      run(
        async () => {
          const { data } = await axiosApi.getTaskResponses(taskId);
          return data.items;
        },
        { loading: false },
      ),
    [run],
  );

  const acceptResponse = useCallback(
    (taskId: string, responseId: string) =>
      run(
        async () => {
          await axiosApi.acceptTaskResponse(taskId, responseId);
          setStatus(taskId, "assigned");
        },
        { success: "tasks:toast.accepted" },
      ),
    [run, setStatus],
  );

  const declineResponse = useCallback(
    (taskId: string, responseId: string) =>
      run(
        async () => {
          await axiosApi.declineTaskResponse(taskId, responseId);
        },
        { success: "tasks:toast.rejected" },
      ),
    [run],
  );

  const withdrawResponse = useCallback(
    (taskId: string, responseId: string) =>
      run(
        async () => {
          await axiosApi.withdrawTaskResponse(taskId, responseId);
          setMyTasks((prev) => prev.filter((t) => t._id !== taskId));
          setAllTasks((prev) =>
            prev.map((t) =>
              t._id === taskId
                ? {
                    ...t,
                    responsesCount: Math.max(0, (t.responsesCount ?? 0) - 1),
                  }
                : t,
            ),
          );
        },
        { success: "tasks:toast.withdrawn" },
      ),
    [run],
  );

  return (
    <TaskContext.Provider
      value={{
        ...view,
        allTasks,
        myTasks,
        isLoading,
        isListLoading: tab === "all" ? isFetching || !isInitialized : false,
        isLoadingMore,
        isInitialized,
        tab,
        changeTab,
        query,
        setQuery,
        filters,
        setFilters,
        reset,
        findTask,
        hydrate,
        fetchTasks,
        loadMoreTasks,
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

export const useTasks = (initial?: TaskList): TaskContextType => {
  const context = useContext(TaskContext);
  const hydrate = context?.hydrate;

  useEffect(() => {
    if (initial) hydrate?.(initial);
  }, [initial, hydrate]);

  const seeded = useMemo(() => {
    if (!context || !initial || context.isInitialized) return null;
    return {
      ...deriveBrowser({
        allTasks: initial.allItems,
        myTasks: initial.myItems,
        rawTotal: initial.total,
        tab: context.tab,
        query: context.query,
        filters: context.filters,
      }),
      allTasks: initial.allItems,
      myTasks: initial.myItems,
    };
  }, [context, initial]);

  if (!context) throw new Error("useTasks must be used within TaskProvider");
  if (!seeded) return context;

  return {
    ...context,
    ...seeded,
    isListLoading: false,
    findTask: (id) => findIn([seeded.allTasks, seeded.myTasks], id),
  };
};
