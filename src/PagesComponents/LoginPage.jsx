import { CheckSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { login } from "../auth";
import api from "../axiosConfig";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    await login({ email, password });
  };

  const handleSubmitSignUp = async (e) => {
    try {
      e.preventDefault()
      const result = await api.post("/users", { email, password })
      if (result.status === 201) {
        await login({ email, password })
      }
    } catch (e) {
      console.error(e)
    }
  }


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg">
            <CheckSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            LifeHub
          </h1>
          <p className="text-muted-foreground mt-2">
            Organize suas tarefas com eficiência
          </p>
        </div>

        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Bem-vindo</CardTitle>
            <CardDescription className="text-center">
              Entre na sua conta ou crie uma nova
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSubmitLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all focus:scale-[1.01]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all focus:scale-[1.01]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
                  >
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSubmitSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      value={email}
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="transition-all focus:scale-[1.01]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="transition-all focus:scale-[1.01]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
                  >
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
