import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import * as contasApi from '../../services/contas';

function isAdminUser(user) {
  const p = String(user?.perfil || user?.role || user?.tipo || '').toLowerCase();
  return p === 'admin' || p === 'administrador';
}

function formatDate(val) {
  if (!val) return '-';
  const data = new Date(val);
  if (isNaN(data.getTime())) return String(val);
  return data.toLocaleDateString('pt-BR');
}

export default function ContasList() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } 
    catch { return null; }
  }, []);

  const isAdmin = isAdminUser(user);

  const listarContas = contasApi.listarContas || contasApi.default?.listarContas;
  const excluirConta = contasApi.excluirConta || contasApi.default?.excluirConta;
  const obterConta = contasApi.obterConta || contasApi.default?.obterConta;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [setor, setSetor] = useState('');
  const [categoria, setCategoria] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [confirm, setConfirm] = useState({ open: false, id: null });

  const [senhaMap, setSenhaMap] = useState({});
  const [showSenha, setShowSenha] = useState({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = { q: q || undefined, setor: setor || undefined, categoria: categoria || undefined, page, pageSize };
      const res = await listarContas(params);
      setItems(res?.items || []);
      setTotal(res?.total || 0);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Erro ao carregar contas.');
      setItems([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, pageSize]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));

  async function handleDelete() {
    const id = confirm.id;
    setConfirm({ open: false, id: null });
    if (!id) return;
    try {
      await excluirConta(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Erro ao excluir conta.');
    }
  }

  async function toggleVerSenha(id) {
    if (!isAdmin) return;
    if (showSenha[id]) { setShowSenha((p) => ({ ...p, [id]: false })); return; }
    if (!senhaMap[id]) {
      try {
        const data = await obterConta(id);
        const senha = data?.senha || '';
        setSenhaMap((p) => ({ ...p, [id]: senha }));
      } catch {
        setError('Não foi possível obter a senha (verifique permissões).');
        return;
      }
    }
    setShowSenha((p) => ({ ...p, [id]: true }));
  }

  async function copiarSenha(id) {
    if (!isAdmin) return;
    try {
      let senha = senhaMap[id];
      if (!senha) {
        const data = await obterConta(id);
        senha = data?.senha || '';
        setSenhaMap((p) => ({ ...p, [id]: senha }));
      }
      await navigator.clipboard.writeText(senha || '');
      alert('Senha copiada!');
    } catch {
      setError('Não foi possível copiar a senha.');
    }
  }

  return (
    <div className="p-4">
      {/* CABEÇALHO PADRÃO */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Contas de Acesso</h1>
          <p className="text-sm text-gray-500">Gerencie acessos de colaboradores e contas internas de gestão do TI.</p>
        </div>
        <button onClick={() => navigate('/contas/novo')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-medium">
          Novo
        </button>
      </div>

      {/* BLOCO DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Busca</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plataforma, login, categoria, colaborador..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Setor</label>
            <input value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Ex: Comercial, TI..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Exibir</span>
              <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="border rounded px-2 py-1 text-sm bg-gray-50">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button onClick={() => { setPage(1); load(); }} className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50">
              Aplicar
            </button>
          </div>
        </div>
        {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      </div>

      {/* BLOCO DA TABELA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center p-4 border-b text-xs text-gray-500">
          <span>{loading ? 'Carregando...' : `${total || items.length} registro(s)`}</span>
          <span>Página {page} de {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Plataforma / Categoria</th>
                <th className="p-4 font-medium">Colaborador / Setor</th>
                <th className="p-4 font-medium">Login</th>
                <th className="p-4 font-medium">Senha</th>
                <th className="p-4 font-medium">Status / Atualização</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr><td className="p-8 text-center text-gray-500" colSpan={6}>Nenhum registro encontrado.</td></tr>
              )}
              {items.map((row) => {
                const id = row.id;
                const senhaVisivel = !!showSenha[id];
                const senha = senhaMap[id] || '';
                return (
                  <tr key={id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{row.plataforma || '-'}</div>
                      <div className="text-xs text-gray-500">{row.categoria || 'Sem categoria'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{row.colaborador_nome || '-'}</div>
                      <div className="text-xs text-gray-500">{row.setor || '-'}</div>
                    </td>
                    <td className="p-4 text-gray-900">{row.login || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border">
                          {senhaVisivel ? (senha || '-') : '••••••••'}
                        </span>
                        {isAdmin ? (
                          <>
                            <button type="button" onClick={() => toggleVerSenha(id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">{senhaVisivel ? 'Ocultar' : 'Ver'}</button>
                            <span className="text-gray-300">|</span>
                            <button type="button" onClick={() => copiarSenha(id)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Copiar</button>
                          </>
                        ) : <span className="text-xs text-gray-400 border px-1 rounded">Admin</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${row.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {row.status || '-'}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">{formatDate(row.ultima_atualizacao)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 justify-end text-xs font-medium">
                        <button onClick={() => navigate(`/contas/${id}/editar`)} className="text-gray-600 hover:text-indigo-600">Editar</button>
                        <button onClick={() => setConfirm({ open: true, id })} className="text-red-500 hover:text-red-700">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO PADRÃO */}
        <div className="p-4 flex justify-end gap-1 border-t">
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage(1)} disabled={page <= 1}>Início</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Voltar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Avançar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>Fim</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm.open}
        title="Excluir conta"
        message="Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onClose={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
}