import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import {
  Plus,
  Trash2,
  LogOut,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  ListTodo,
  Pencil,
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";
import { logout, withAuth } from "../auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import api from "../axiosConfig";
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

  async function completeTask(id) {
    setLoading(true)
    try {
      await api.post(`/tasks/${id}/complete`);
      fetchTasks();
      getHeatmap();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false)
    }
  }

  async function uncompleteTask(id) {
    setLoading(true)
    try {
      await api.delete(`/tasks/${id}/complete`);
      fetchTasks();
      getHeatmap();
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function handleClick(completed, id) {
    if (completed) {
      uncompleteTask(id)
    } else {
      completeTask(id)
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
      ? { color: ["#4b5563", "#22c55e"] }
      : { color: ["#e0e0e0", "#22c55e"] };

    const option = {
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

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [heatmap, theme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardDescription>Tarefas de hoje</CardDescription>
              <CardTitle className="text-3xl">{totalCount}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-card to-secondary/5">
            <CardHeader className="pb-3">
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-3xl text-green-500">
                {completedCount}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="pb-3">
              <CardDescription>Pendentes</CardDescription>
              <CardTitle className="text-3xl text-accent">
                {totalCount - completedCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-6 border-primary/20">
          <CardContent>
            <div ref={heatmapRef} className="w-full h-[180px]" />
          </CardContent>
        </Card>
        {/* Add Task + All Tasks Buttons */}
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
                          className="shrink-0"
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
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Todas as tarefas</DialogTitle>
                <DialogDescription>
                  Visualize, edite ou exclua suas tarefas. Clique em Editar para alterar os dados.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-2 -mr-2">
                {allTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa cadastrada.
                  </div>
                )}
                {allTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border bg-card space-y-3"
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
                                  className="shrink-0"
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
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{task.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
                              {task.start_date && (
                                <span>
                                  Início:{" "}
                                  {new Date(task.start_date).toLocaleDateString("pt-BR", {
                                    timeZone: "UTC",
                                  })}
                                </span>
                              )}
                              {task.end_date && (
                                <span>
                                  Término:{" "}
                                  {new Date(task.end_date).toLocaleDateString("pt-BR", {
                                    timeZone: "UTC",
                                  })}
                                </span>
                              )}
                              {task.recurrence_days?.length > 0 && (
                                <span>
                                  Dias:{" "}
                                  {task.recurrence_days
                                    .map((d) => WEEK_DAYS.find((w) => w.value === d)?.letter ?? d)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
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
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle>Tarefas de hoje</CardTitle>
            <CardDescription>
              {completedCount} de {totalCount} tarefas concluídas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg border border-primary bg-card hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <p
                        className={`font-medium ${task.status === "finished"
                          ? "line-through text-muted-foreground"
                          : ""
                          }`}
                      >
                        {task.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${task.completed_today
                            ? "bg-primary/30 text-primary"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {task.completed_today
                            ? "Concluída"
                            : task.status === "in progress"
                              ? "Concluída"
                              : "Pendente"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Início:</span>
                        <span>
                          {new Date(task.start_date).toLocaleDateString("pt-BR", {
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <Button
                        onClick={() => deleteTask(task.id)}
                        variant="ghost"
                        size="icon"
                        className="transition-opacity text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      disabled={loading}
                      size="lg"
                      variant="default"
                      onClick={() => handleClick(task.completed_today, task.id)}
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
