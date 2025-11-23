import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/image_0.png';

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const API_URL = '/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Tenta login real no backend (se estiver rodando)
      // Se falhar, usa o fallback para testes locais abaixo
      const response = await fetch(`${API_URL}/login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok') {
             login({ name: data.name, role: data.role, username: username });
             toast.success("Bem-vindo!");
             navigate('/');
             return;
          }
      }
      // FALLBACK MOCK (CASO BACKEND ESTEJA OFF OU TESTE)
      if (username === "admin" && password === "admin") {
          login({ name: "Administrador", role: "admin", username: "admin" });
          navigate('/');
      } else {
          toast.error("Usuário ou senha incorretos.");
      }
    } catch (error) {
       // Fallback para teste se o backend não responder
       if (username === "admin" && password === "admin") {
          login({ name: "Administrador", role: "admin", username: "admin" });
          navigate('/');
       } else {
          toast.error("Erro de conexão.");
       }
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-gray-900 transition-colors">
      <div className="hidden lg:flex w-1/2 bg-cmurb-laranja items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-cmurb-vinho mix-blend-multiply opacity-20"></div>
        <img src={logoImg} alt="CMUrb" className="relative z-10 max-w-md w-full object-contain drop-shadow-xl" />
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24">
        <div className="w-full max-w-md">
            <div className="mb-10">
                <h2 className="text-3xl font-serif font-bold text-cmurb-vinho dark:text-white mb-2">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400">Informe suas credenciais para continuar.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="label-modern">Usuário</label>
                <input type="text" className="input-modern" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="relative">
                <label className="label-modern">Senha</label>
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} className="input-modern pr-10" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 transition">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>
            <button disabled={loading} className="w-full btn-primary mt-4">{loading ? 'Autenticando...' : 'Entrar no Sistema'}</button>
            </form>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;

