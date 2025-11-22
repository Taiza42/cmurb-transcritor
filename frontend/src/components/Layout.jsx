import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Building2, LogOut, Moon, Sun, Users, FileAudio } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col">
      <div className="h-1 bg-cmurb-laranja w-full"></div>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-3">
           <div className="bg-cmurb-vinho p-2 rounded-md">
             <Building2 className="text-white h-6 w-6" />
           </div>
           <div>
             <h1 className="text-xl font-serif font-bold text-cmurb-vinho dark:text-cmurb-laranja leading-tight">CMUrb</h1>
             <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Centro de Memória Urbana</p>
           </div>
        </div>

        <div className="flex items-center gap-6">
          {user?.role === 'admin' && (
            <nav className="flex gap-2 mr-4 border-r border-gray-200 dark:border-gray-700 pr-6">
                <NavLink to="/" active={isActive('/')} icon={<FileAudio size={18} />}>Transcrição</NavLink>
                <NavLink to="/acessos" active={isActive('/acessos')} icon={<Users size={18} />}>Gestão de Usuários</NavLink>
            </nav>
          )}

          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="text-right hidden sm:block leading-tight">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{user?.name}</p>
            <p className="text-xs text-cmurb-vinho dark:text-cmurb-laranja font-bold uppercase">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 border border-cmurb-vinho text-cmurb-vinho dark:text-cmurb-laranja dark:border-cmurb-laranja px-3 py-2 rounded-md hover:bg-cmurb-vinho hover:text-white dark:hover:bg-cmurb-laranja transition text-sm font-bold">
            <LogOut size={16} /> SAIR
          </button>
        </div>
      </header>
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 transition-colors">{children}</main>
      <div className="h-2 bg-cmurb-vinho w-full"></div>
    </div>
  );
}

const NavLink = ({ to, children, active, icon }) => (
    <Link to={to} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
        active ? 'bg-cmurb-vinho/10 text-cmurb-vinho dark:text-cmurb-laranja dark:bg-cmurb-laranja/10' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
    }`}>{icon} {children}</Link>
)
export default Layout;

