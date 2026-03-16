import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarColaboradores, excluirColaborador } from '../../services/colaboradores';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';

const fmtBr = (v) => {
  if (!v) return '-';
  const s = String(v);
  const [y, m, d] = (s.includes('T') ? s.split('T')[0] : s).split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
};

export default function ColaboradoresList() {
  const toast = useToast();
  const nav = useNavigate();

  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('nome');
  const [sortDir, setSortDir] = useState('asc');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listarColaboradores(q ? { q } : {});
      setRaw(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function ordenar(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  const filtrados = useMemo(() => {
    let arr = [...raw];
    if (status) arr = arr.filter(r => String(r.status || '').toLowerCase() === status);
    return arr;
  }, [raw, status]);

  const ordenados = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      const va = (a?.[sortBy] ?? '').toString().toLowerCase();
      const vb = (b?.[sortBy] ?? '').toString().toLowerCase();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtrados, sortBy, sortDir]);

  const total = ordenados.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ordenados.slice(start, start + pageSize);
  }, [ordenados, page, pageSize]);

  function askExcluir(id) { setTargetId(id); setConfirmOpen(true); }

  async function doExcluir() {
    try {
      await excluirColaborador(targetId);
      toast.success('Colaborador excluído.');
      setConfirmOpen(false);
      setTargetId(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao excluir');
    }
  }

  return (
    <div className="p-4">
      {/* CABEÇALHO PADRÃO */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Colaboradores</h1>
          <p className="text-sm text-gray-500">Gerencie o quadro de funcionários da empresa.</p>
        </div>
        <button onClick={() => nav('/colaboradores/novo')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-medium">
          Novo
        </button>
      </div>

      {/* BLOCO DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Busca</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, telefone, setor, e-mail..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
              <option value="">Status (todos)</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Exibir</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1 text-sm bg-gray-50">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => load()} className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50">Aplicar</button>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO DA TABELA */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center p-4 border-b text-xs text-gray-500">
          <span>{total} registro(s)</span>
          <span>Página {page} de {totalPages}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('nome')}>Nome {sortBy === 'nome' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('telefone_corporativo')}>Contato {sortBy === 'telefone_corporativo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('setor')}>Setor / Cargo {sortBy === 'setor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('data_admissao')}>Admissão {sortBy === 'data_admissao' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('status')}>Status {sortBy === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{row.nome}</div>
                      <div className="text-xs text-gray-500">{row.email || 'Sem e-mail'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{row.telefone_corporativo || '-'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{row.setor || '-'}</div>
                      <div className="text-xs text-gray-500">{row.cargo || '-'}</div>
                    </td>
                    <td className="p-4">{fmtBr(row.data_admissao)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        (row.status || '').toLowerCase() === 'ativo' ? 'bg-green-100 text-green-700'
                          : (row.status || '').toLowerCase() === 'inativo' ? 'bg-gray-200 text-gray-600'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                        {row.status || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 justify-end text-xs font-medium">
                        <Link className="text-gray-600 hover:text-indigo-600" to={`/colaboradores/${row.id}/editar`}>Editar</Link>
                        <button className="text-red-500 hover:text-red-700" onClick={() => askExcluir(row.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pageItems.length && <tr><td className="p-8 text-center text-gray-500" colSpan={6}>Nenhum colaborador encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINAÇÃO PADRÃO */}
        <div className="p-4 flex justify-end gap-1 border-t">
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage(1)} disabled={page <= 1}>Início</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Voltar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Avançar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>Fim</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir colaborador"
        message={`Tem certeza que deseja excluir o colaborador #${targetId}? Esta ação não pode ser desfeita.`}
        cancelText="Cancelar"
        confirmText="Confirmar"
        onClose={() => setConfirmOpen(false)}
        onConfirm={doExcluir}
      />
    </div>
  );
}