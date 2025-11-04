import { useEffect, useState } from "react";
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

const DashboardPage = () => {
  const [tasks, setTasks] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    duration: "",
    start_time: "",
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
      await api.post("/tasks", newTask);
      setNewTask({ name: "", duration: "", start_time: "" });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchTasks();
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
    try {
      await api.patch(`/tasks/${id}`, { status: "finished" });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  }
  const completedCount = tasks.filter((t) => t.status === "finished").length;
  const totalCount = tasks.length;

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
                  <Label htmlFor="task-duration">Duração Prevista</Label>
                  <Input
                    type="time"
                    id="task-duration"
                    placeholder="Ex: 2h, 1h 30min, 45min..."
                    value={newTask.duration}
                    onChange={(e) =>
                      setNewTask({ ...newTask, duration: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-time">Hora Prevista (HH:mm)</Label>
                  <Input
                    id="task-time"
                    type="datetime-local"
                    value={newTask.start_time}
                    onChange={(e) =>
                      setNewTask({ ...newTask, start_time: e.target.value })
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
                  <Checkbox
                    checked={task.status === "finished"}
                    className="w-5 h-5 mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p
                        className={`font-medium ${
                          task.status === "finished"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === "finished"
                              ? "bg-secondary/10 text-secondary"
                              : task.status === "in progress"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {task.status === "finished"
                            ? "Concluída"
                            : task.status === "in progress"
                            ? "Em Andamento"
                            : "Pendente"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{task.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Início:</span>
                        <span>
                          {new Date(task.start_time).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        disabled={
                          task.status === "finished" ||
                          task.status === "in progress"
                        }
                        size="sm"
                        className="gap-2 disabled:cursor-not-allowed"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </Button>

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
                      disabled={task.status === "finished"}
                      size="lg"
                      variant="default"
                      onClick={() => completeTask(task.id)}
                    >
                      Concluir
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
