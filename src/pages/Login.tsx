import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import loginIllustration from "@/assets/login-illustration.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Erro no login",
          description: "Usuário ou senha incorretos",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao sistema de cotações",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-4">
      <Card className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Left side - Illustration */}
          <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 p-8 flex items-center justify-center">
            <div className="max-w-md">
              <img 
                src={loginIllustration} 
                alt="Login illustration" 
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">COTAÇÃO LOGI</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Log in to your account
                </h1>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 px-4 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Digite seu email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Digite sua senha"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
                >
                  {loading ? "Entrando..." : "Log in"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Sistema de Cotações - Acesso Restrito
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;