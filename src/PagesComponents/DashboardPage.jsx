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
} from "lucide-react";
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [heatmap, setHeatmap] = useState([])
  const [newTask, setNewTask] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

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
      };
      await api.post("/tasks", payload);
      setNewTask({ name: "", start_date: "", end_date: "" });
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


  const completedCount = tasks.filter((t) => t.status === "finished").length;
  const totalCount = tasks.length;

  const heatmapRef = useRef(null);

  useEffect(() => {
    if (!heatmapRef.current || !heatmap?.length) return;

    const chart = echarts.init(heatmapRef.current);

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
        inRange: { color: ["#e0e0e0", "#22c55e"] },
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
  }, [heatmap]);

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
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
              <CardDescription>Total de Tarefas</CardDescription>
              <CardTitle className="text-3xl">{totalCount}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-card to-secondary/5">
            <CardHeader className="pb-3">
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-3xl text-secondary">
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
        {/* Add Task Button */}
        <div className="mb-6">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary  hover:opacity-90">
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
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-gradient-to-r from-primary to-secondary"
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
        </div>

        {/* Tasks List */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle>Suas Tarefas</CardTitle>
            <CardDescription>
              {completedCount} de {totalCount} tarefas concluídas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg border bg-card/50 hover:bg-accent/5 transition-colors group"
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
