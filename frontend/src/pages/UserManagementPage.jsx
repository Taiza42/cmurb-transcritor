import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Trash2, X, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = '/api';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Estado para o formulário de criação
  const [newUser, setNewUser] = useState({ username: '', name: '', password: '', role: 'pesquisador' });

  // 1. CARREGAR USUÁRIOS DO BACKEND AO INICIAR
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error("Erro ao carregar lista de usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. CRIAR NOVO USUÁRIO NO BACKEND
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name || !newUser.password) {
        toast.error("Preencha todos os campos.");
        return;
    }

    try {
        await axios.post(`${API_URL}/users`, newUser);
        toast.success(`Usuário ${newUser.username} criado!`);
        
        // Limpa o form e recarrega a lista do banco
        setNewUser({ username: '', name: '', password: '', role: 'pesquisador' });
        setShowCreateModal(false);
        fetchUsers(); 
        
    } catch (error) {
        if (error.response && error.response.status === 400) {
            toast.error("Este nome de usuário já existe.");
        } else {
            toast.error("Erro ao criar usuário.");
        }
    }
  };

  // 3. DELETAR USUÁRIO NO BACKEND
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
        await axios.delete(`${API_URL}/users/${userToDelete.username}`);
        toast.success("Usuário removido.");
        setUserToDelete(null);
        fetchUsers(); // Recarrega a lista
    } catch (error) {
        toast.error("Erro ao excluir usuário.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div>
            <h1 className="text-2xl font-serif font-bold text-cmurb-vinho dark:text-cmurb-laranja flex items-center gap-3">
            <Users className="text-cmurb-laranja" /> Gestão de Usuários
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Controle de acesso ao banco de dados.</p>
        </div>
        <div className="flex gap-3">
             <button onClick={fetchUsers} className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition" title="Atualizar Lista">
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
             </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 py-3 px-6">
                <UserPlus size={18} /> Novo Usuário
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        {loading ? (
            <div className="p-12 text-center text-gray-500">Carregando usuários...</div>
        ) : (
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <tr><th className="px-6 py-4">Login</th><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Tipo</th><th className="px-6 py-4 text-right">Ações</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map(user => (
                        <tr key={user.username} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{user.username}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{user.name}</td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                    user.role === 'admin' 
                                        ? 'bg-cmurb-vinho/10 text-cmurb-vinho dark:text-orange-400' 
                                        : 'bg-blue-100 text-blue-700' 
                                }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {user.username !== 'admin' && (
                                    <button onClick={() => setUserToDelete(user)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition p-2 hover:bg-red-50 rounded-full">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Nenhum usuário encontrado (além do admin).</td></tr>
                    )}
                </tbody>
            </table>
        )}
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Criar Novo Usuário">
            <form onSubmit={handleCreateUser} className="space-y-4">
                <div><label className="label-modern">Login (Sem espaços) *</label><input type="text" className="input-modern" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value.trim()})} required /></div>
                <div><label className="label-modern">Nome Completo *</label><input type="text" className="input-modern" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required /></div>
                <div><label className="label-modern">Senha *</label><input type="password" className="input-modern" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required /></div>
                <div>
                    <label className="label-modern">Tipo</label>
                    <select className="input-modern cursor-pointer" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                        <option value="pesquisador">Pesquisador</option><option value="admin">Administrador</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium">Cancelar</button>
                    <button type="submit" className="btn-primary py-2 px-6 flex items-center gap-2">Criar</button>
                </div>
            </form>
        </Modal>
      )}

      {userToDelete && (
        <Modal onClose={() => setUserToDelete(null)} title="Confirmar Exclusão" danger={true}>
            <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full"><AlertTriangle className="text-red-600 h-6 w-6" /></div>
                <div>
                    <h3 className="text-lg font-bold dark:text-gray-100 mb-2">Tem certeza?</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Vai excluir <strong>{userToDelete.name}</strong>?</p>
                </div>
            </div>
             <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setUserToDelete(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium">Cancelar</button>
                <button type="button" onClick={confirmDeleteUser} className="btn-danger flex items-center gap-2">Sim, Excluir</button>
            </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title, danger = false }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden ${danger ? 'border-t-4 border-red-500' : ''}`}>
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className={`text-lg font-serif font-bold ${danger ? 'text-red-600' : 'text-cmurb-vinho dark:text-cmurb-laranja'}`}>{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition bg-gray-100 dark:bg-gray-700 p-1 rounded-full"><X size={18} /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}
export default UserManagementPage;

