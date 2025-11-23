import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Moon, Sun, Users, FileAudio } from 'lucide-react';
import logoImg from '../assets/image_0.png'; 

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* HEADER PRINCIPAL */}
      <header className="bg-cmurb-laranja text-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors border-bQXQw border-white/10">
        
        {/* LADO ESQUERDO: Logo + Título */}
        <div className="flex items-center gap-4">
           {/* REMOVIDO O FUNDO BRANCO (bg-white) DAQUI */}
           <img 
             src={logoImg} 
             alt="Logo CMUrb" 
             className="h-12 w-auto object-contain filter drop-shadow-sm" 
             /* Ajustei h-12 para ficar num tamanho bom sem o padding */
           />
           
           <div className="flex flex-col leading-none">
             <h1 className="text-xl font-serif font-bold text-white tracking-wide">CMUrb</h1>
             <p className="text-xs text-white/90 uppercase tracking-wider font-semibold mt-0.5">Centro de Memória Urbana</p>
           </div>
        </div>

        {/* LADO DIREITO */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {user?.role === 'admin' && (
            <nav className="hidden md:flex gap-2 mr-2 border-rQXQw border-white/30 pr-6">
                <NavLink to="/" active={isActive('/')} icon={<FileAudio size={18} />}>Transcrição</NavLink>
                <NavLink to="/acessos" active={isActive('/acessos')} icon={<Users size={18} />}>Gestão de Usuários</NavLink>
            </nav>
          )}

          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-white/20 text-white transition focus:outline-none"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="text-right hidden sm:block leading-tight">
            <p className="text-sm font-bold text-white">{user?.name}</p>
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">{user?.role}</p>
          </div>

          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 border border-white text-white px-3 py-2 rounded-lg hover:bg-white hover:text-cmurb-laranja transition-all duration-200 text-sm font-bold shadow-sm active:scale-95"
          >
            <LogOut size={16} /> 
            <span className="hidden sm:inline">SAIR</span>
          </button>
        </div>
      </header>

      <main className="flex-grow bg-gray-50 dark:bg-[#191919] transition-colors duration-300">
        {children}
      </main>
      
      <div className="h-2 bg-cmurb-vinho w-full"></div>
    </div>
  );
}

const NavLink = ({ to, children, active, icon }) => (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-white text-cmurb-laranja shadow-sm' 
          : 'text-white/80 hover:bg-white/20 hover:text-white'
    }`}>
      {icon} 
      {children}
    </Link>
)

export default Layout;


