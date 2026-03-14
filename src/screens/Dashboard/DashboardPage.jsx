import { useEffect, useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Plus,
  Trash2,
  LogOut,
  CheckCircle2,
  Circle,
  ListTodo,
  Pencil,
  CalendarDays,
  Repeat,
  Activity,
} from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useTheme } from "../../contexts/ThemeContext";
import { logout, withAuth } from "../../providers/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import api from "../../axiosConfig";
import * as echarts from "echarts";

const DashboardPage = () => {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [heatmap, setHeatmap] = useState([])
  const [newTask, setNewTask] = useState({
    name: "",
    start_date: "",
    end_date: "",
    recurrence_days: [],
  });
  const [allTasks, setAllTasks] = useState([]);
  const [isAllTasksModalOpen, setIsAllTasksModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayTasks, setDayTasks] = useState([]);
  const [loadingDayTasks, setLoadingDayTasks] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    recurrence_days: [],
  });
  const WEEK_DAYS = [
    { value: 0, letter: "D", label: "Domingo" },
    { value: 1, letter: "S", label: "Segunda" },
    { value: 2, letter: "T", label: "Terça" },
    { value: 3, letter: "Q", label: "Quarta" },
    { value: 4, letter: "Q", label: "Quinta" },
    { value: 5, letter: "S", label: "Sexta" },
    { value: 6, letter: "S", label: "Sábado" },
  ];

  function toggleRecurrenceDay(dayValue) {
    setNewTask((prev) => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(dayValue)
        ? prev.recurrence_days.filter((d) => d !== dayValue)
        : [...prev.recurrence_days, dayValue].sort((a, b) => a - b),
    }));
  }

  async function fetchTasks() {
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function createTask() {
    try {
      const payload = {
        name: newTask.name,
        start_date: newTask.start_date || null,
        end_date: newTask.end_date || null,
        recurrence_days: newTask.recurrence_days?.length
          ? newTask.recurrence_days
          : undefined,
      };
      await api.post("/tasks", payload);
      setNewTask({ name: "", start_date: "", end_date: "", recurrence_days: [] });
      fetchTasks();
      getHeatmap();
    } catch (error) {
      console.error(error);
    }
  }
  async function getHeatmap() {
    try {
      const response = await api.get('/tasks/heatmap')
      setHeatmap(response.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchTasksByDate(date) {
    if (!date) return;
    setLoadingDayTasks(true);
    try {
      const response = await api.get("/tasks", { params: { date } });
      setDayTasks(response.data ?? []);
    } catch (e) {
      console.error(e);
      setDayTasks([]);
    } finally {
      setLoadingDayTasks(false);
    }
  }

  useEffect(() => {
    fetchTasks();
    getHeatmap()
    getAllTasks();
  }, []);

  async function deleteTask(id) {
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  }

  async function completeTask(id, forDate) {
    setLoading(true);
    try {
      const body = forDate ? { date: forDate } : {};
      await api.post(`/tasks/${id}/complete`, body);
      if (forDate) {
        await fetchTasksByDate(forDate);
        getHeatmap();
      } else {
        fetchTasks();
        getHeatmap();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function uncompleteTask(id, forDate) {
    setLoading(true);
    try {
      const config = forDate ? { data: { date: forDate } } : {};
      await api.delete(`/tasks/${id}/complete`, config);
      if (forDate) {
        await fetchTasksByDate(forDate);
        getHeatmap();
      } else {
        fetchTasks();
        getHeatmap();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleClick(completed, id, forDate) {
    if (completed) {
      uncompleteTask(id, forDate);
    } else {
      completeTask(id, forDate);
    }
  }


  async function getAllTasks() {
    try {
      const result = await api.get("/tasks/all");
      setAllTasks(result.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function updateTask(id, payload) {
    try {
      await api.patch(`/tasks/${id}`, {
        name: payload.name,
        start_date: payload.start_date || null,
        end_date: payload.end_date || null,
        recurrence_days: payload.recurrence_days?.length
          ? payload.recurrence_days
          : undefined,
      });
      fetchTasks();
      getHeatmap();
      getAllTasks();
      setEditingTaskId(null);
    } catch (error) {
      console.error(error);
    }
  }

  function startEditingTask(task) {
    setEditingTaskId(task.id);
    setEditForm({
      name: task.name,
      start_date: task.start_date ? task.start_date.slice(0, 10) : "",
      end_date: task.end_date ? task.end_date.slice(0, 10) : "",
      recurrence_days: task.recurrence_days ?? [],
    });
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
  }

  async function handleDeleteFromAllTasks(id) {
    await deleteTask(id);
    getAllTasks();
  }


  const completedCount = tasks.filter((t) => t.completed_today).length;
  const totalCount = tasks.length;

  const heatmapRef = useRef(null);

  useEffect(() => {
    if (!heatmapRef.current || !heatmap?.length) return;

    const chart = echarts.init(heatmapRef.current, theme === "dark" ? "dark" : null);

    const heatmapData = heatmap.map((item) => {
      const value =
        item.total > 0 ? (item.completed / item.total) * 100 : 0;
      return [item.date, value];
    });

    const dates = heatmap.map((d) => d.date).sort();
    const range =
      dates.length > 0
        ? [dates[0], dates[dates.length - 1]]
        : [
          new Date().toISOString().slice(0, 10),
          new Date().toISOString().slice(0, 10),
        ];

    const isDark = theme === "dark";
    const visualMapColors = isDark
      ? { color: ["#161a2b", "#22c55e"] }
      : { color: ["#e0e0e0", "#22c55e"] };

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        formatter: (params) => {
          const item = heatmap.find((h) => h.date === params.data[0]);
          if (!item) return "";
          const pct = item.total > 0 ? ((item.completed / item.total) * 100).toFixed(0) : 0;
          return `${params.data[0]}: ${item.completed}/${item.total} (${pct}%)`;
        },
      },
      visualMap: {
        show: false,
        min: 0,
        max: 100,
        type: "continuous",
        inRange: visualMapColors,
      },
      calendar: {
        range,
        cellSize: ["auto", 20],
        left: "center",
        top: 30,
        itemStyle: {
          color: isDark ? "#020617" : "#a3a29f",
          borderWidth: 1,
          borderColor: isDark ? "#4f5361" : "#a3a29f",
        },
        splitLine: {
          show: false,
        },
        yearLabel: {
          color: isDark ? "#9ca3af" : "#6b7280",
        },
        dayLabel: {
          color: isDark ? "#6b7280" : "#9ca3af",
        },
        monthLabel: {
          color: isDark ? "#9ca3af" : "#6b7280",
        },
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: heatmapData,
        },
      ],
    };

    chart.setOption(option);

    const handleCellClick = (params) => {
      const date = params?.data?.[0];
      if (!date) return;
      setSelectedDate(date);
      setIsDayModalOpen(true);
      fetchTasksByDate(date);
    };
    chart.on("click", handleCellClick);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      chart.off("click", handleCellClick);
      chart.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [heatmap, theme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Minhas Tarefas</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie seu dia com produtividade
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => logout()}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardDescription>Tarefas de hoje</CardDescription>
              <CardTitle className="text-3xl">{totalCount}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {completedCount}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-3xl">
                {totalCount - completedCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 mb-8">
          <CardContent>
            <div ref={heatmapRef} className="w-full h-[180px]" />
          </CardContent>
        </Card>

        <Dialog
          open={isDayModalOpen}
          onOpenChange={(open) => {
            setIsDayModalOpen(open);
            if (!open) {
              setSelectedDate(null);
              setDayTasks([]);
            }
          }}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                Tarefas do dia
                {selectedDate &&
                  ` (${new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })})`}
              </DialogTitle>
              <DialogDescription>
                Clique em Concluir ou Desfazer para atualizar o status.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
              {loadingDayTasks ? (
                <div className="text-center py-6 text-muted-foreground">
                  Carregando…
                </div>
              ) : dayTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhuma tarefa neste dia.
                </div>
              ) : (
                dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                  >
                    <span
                      className={`flex-1 min-w-0 truncate ${task.completed_today ? "line-through text-muted-foreground" : "font-medium"}`}
                    >
                      {task.name}
                    </span>
                    <Button
                      size="sm"
                      variant={task.completed_today ? "outline" : "default"}
                      disabled={loading}
                      onClick={() =>
                        handleClick(task.completed_today, task.id, selectedDate)
                      }
                    >
                      {task.completed_today ? "Desfazer" : "Concluir"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="mb-6 flex flex-wrap gap-3">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:opacity-90">
                <Plus className="w-4 h-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da tarefa abaixo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="task-name">Nome da Tarefa</Label>
                  <Input
                    id="task-name"
                    placeholder="Digite o nome da tarefa..."
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-start-date">Data de Início</Label>
                  <Input
                    id="task-start-date"
                    type="date"
                    value={newTask.start_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-end-date">Data de Término</Label>
                  <Input
                    id="task-end-date"
                    type="date"
                    value={newTask.end_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, end_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias da semana</Label>
                  <div className="flex gap-2 flex-wrap">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = newTask.recurrence_days?.includes(
                        day.value
                      );
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="icon"
                          title={day.label}
                          onClick={() => toggleRecurrenceDay(day.value)}
                          className={`shrink-0 rounded-full text-xs font-medium ${
                            isSelected
                              ? "bg-emerald-500 text-emerald-50 hover:bg-emerald-500/90"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {day.letter}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-primary"
                  onClick={() => {
                    setIsModalOpen(false);
                    createTask();
                  }}
                >
                  Adicionar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAllTasksModalOpen}
            onOpenChange={(open) => {
              setIsAllTasksModalOpen(open);
              if (open) getAllTasks();
              if (!open) setEditingTaskId(null);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ListTodo className="w-4 h-4" />
                Ver todas as tarefas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col from-card to-primary border-primary">
              <DialogHeader className="pb-4 border-b border-border/40">
                <DialogTitle className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-primary" />
                    <span>Todas as tarefas</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {allTasks.length} tarefas cadastradas
                  </span>
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  <span className="block">
                    Use esta visão para ter um panorama geral.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-2 -mr-2 pt-3">
                {allTasks.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    Nenhuma tarefa cadastrada ainda.
                    <p className="text-sm text-muted-foreground/70">
                      Crie sua primeira tarefa para ver o resumo aqui.
                    </p>
                  </div>
                )}
                {allTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border bg-card/80 backdrop-blur-sm space-y-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    {editingTaskId === task.id ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${task.id}`}>Nome</Label>
                          <Input
                            id={`edit-name-${task.id}`}
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, name: e.target.value }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-start-${task.id}`}>Início</Label>
                            <Input
                              id={`edit-start-${task.id}`}
                              type="date"
                              value={editForm.start_date}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, start_date: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-end-${task.id}`}>Término</Label>
                            <Input
                              id={`edit-end-${task.id}`}
                              type="date"
                              value={editForm.end_date}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, end_date: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Dias da semana</Label>
                          <div className="flex gap-2 flex-wrap">
                            {WEEK_DAYS.map((day) => {
                              const isSelected = editForm.recurrence_days?.includes(day.value);
                              return (
                                <Button
                                  key={day.value}
                                  type="button"
                                  variant={isSelected ? "default" : "outline"}
                                  size="icon"
                                  title={day.label}
                                  onClick={() =>
                                    setEditForm((f) => ({
                                      ...f,
                                      recurrence_days: isSelected
                                        ? f.recurrence_days.filter((d) => d !== day.value)
                                        : [...(f.recurrence_days || []), day.value].sort((a, b) => a - b),
                                    }))
                                  }
                                  className={`shrink-0 rounded-full text-xs font-medium ${
                                    isSelected
                                      ? "bg-emerald-500 text-emerald-50 hover:bg-emerald-500/90"
                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                                >
                                  {day.letter}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => updateTask(task.id, editForm)}
                          >
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditingTask}>
                            Cancelar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base leading-snug truncate">
                              {task.name}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              {task.start_date && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                  <CalendarDays className="w-3 h-3" />
                                  Início:&nbsp;
                                  {new Date(task.start_date).toLocaleDateString("pt-BR", {
                                    timeZone: "UTC",
                                  })}
                                </span>
                              )}
                              {task.end_date && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                                  <CalendarDays className="w-3 h-3" />
                                  Término:&nbsp;
                                  {new Date(task.end_date).toLocaleDateString("pt-BR", {
                                    timeZone: "UTC",
                                  })}
                                </span>
                              )}
                              {task.recurrence_days?.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
                                  <Repeat className="w-3 h-3" />
                                  {task.recurrence_days
                                    .map((d) => WEEK_DAYS.find((w) => w.value === d)?.letter ?? d)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start justify-end gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditingTask(task)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFromAllTasks(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                    {task.total_recurrences != null && (
                      <div className="pt-2 border-t mt-2">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span className="inline-flex items-center gap-1">
                            <Activity className="w-3 h-3 text-emerald-500" />
                            <span>
                              <span className="font-semibold">
                                {task.completion_count ?? 0}
                              </span>{" "}
                              de{" "}
                              <span className="font-semibold">
                                {task.total_recurrences}
                              </span>{" "}
                              ocorrências concluídas
                            </span>
                          </span>
                          <span className="hidden md:inline-flex items-center gap-1 text-[11px] rounded-full bg-muted px-2 py-0.5">
                            Visão histórica
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-primary"
                            style={{
                              width: `${
                                task.total_recurrences
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        ((task.completion_count ?? 0) /
                                          task.total_recurrences) *
                                          100
                                      )
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Tarefas de hoje</span>
                </CardTitle>
                <CardDescription>
                  {completedCount} de {totalCount} tarefas concluídas
                </CardDescription>
              </div>
              {totalCount > 0 && (
                <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-muted-foreground w-40">
                  <div className="flex justify-between w-full">
                    <span>Progresso do dia</span>
                    <span className="font-semibold">
                      {Math.round((completedCount / totalCount) * 100) || 0}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-primary"
                      style={{
                        width: `${
                          totalCount
                            ? Math.min(
                                100,
                                Math.round((completedCount / totalCount) * 100)
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border bg-card/90 transition-colors group shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {task.completed_today ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground">
                        <Circle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p
                        className={`font-semibold ${
                          task.status === "finished" || task.completed_today
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                            task.completed_today
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                          }`}
                        >
                          {task.completed_today ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Concluída hoje</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3" />
                              <span>Pendente</span>
                            </>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(task.start_date).toLocaleDateString("pt-BR", {
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>Progresso da tarefa</span>
                        <span className="font-semibold">
                          {task.completed_today ? "100%" : "0%"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-primary transition-all duration-300 ${
                            task.completed_today ? "w-full" : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      onClick={() => deleteTask(task.id)}
                      variant="ghost"
                      size="icon"
                      className="transition-opacity text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      disabled={loading}
                      size="sm"
                      variant={task.completed_today ? "outline" : "default"}
                      onClick={() => handleClick(task.completed_today, task.id)}
                      className="mt-1"
                    >
                      {task.completed_today ? "Desfazer" : "Concluir"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-12">
                <Circle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhuma tarefa ainda</p>
                <p className="text-sm text-muted-foreground/60">
                  Adicione uma tarefa para começar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default withAuth(DashboardPage);
