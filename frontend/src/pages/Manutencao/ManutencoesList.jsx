import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarManutencoes, excluirManutencao } from '../../services/manutencoes';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ManutencoesList() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('data_inicio');
  const [sortDir, setSortDir] = useState('desc');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  function fmtBr(ymd) {
    if (!ymd) return '-';
    const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return ymd;
    return `${m[3]}/${m[2]}/${m[1]}`;
  }

  function statusPill(s) {
    const map = {
      aberta: 'bg-yellow-100 text-yellow-700',
      concluida: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${map[s] || 'bg-gray-100 text-gray-700'}`}>
        {s || '-'}
      </span>
    );
  }

  async function carregar(p = page) {
    setLoading(true);
    try {
      const data = await listarManutencoes({ q, status, page: p, pageSize, sortBy, sortDir });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e) {
      toast.error('Falha ao carregar manutenções');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(1); }, [sortBy, sortDir, pageSize]);

  function ordenar(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  function askExcluir(id) {
    setTargetId(id);
    setConfirmOpen(true);
  }

  async function doExcluir() {
    try {
      await excluirManutencao(targetId);
      toast.success(`OS #${targetId} excluída.`);
      setConfirmOpen(false);
      setTargetId(null);
      await carregar();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao excluir OS');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-4">
      {/* CABEÇALHO PADRÃO */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Manutenções (OS)</h1>
          <p className="text-sm text-gray-500">Registre e acompanhe as ordens de serviço e reparos.</p>
        </div>
        <button onClick={() => navigate('/manutencoes/nova')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-medium">
          Nova OS
        </button>
      </div>

      {/* BLOCO DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Busca</label>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Problema, solução, técnico, equipamento..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
              <option value="">Status (todos)</option>
              <option value="aberta">Aberta</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Exibir</span>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1 text-sm bg-gray-50">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button onClick={() => carregar(1)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50">Aplicar Filtros</button>
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
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('id')}>OS {sortBy === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium">Equipamento</th>
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('data_inicio')}>Datas {sortBy === 'data_inicio' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium cursor-pointer" onClick={() => ordenar('tecnico_responsavel')}>Técnico {sortBy === 'tecnico_responsavel' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(os => (
                  <tr key={os.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900">#{os.id}</td>
                    <td className="p-4">
                      <div className="text-gray-900 font-medium">{os.equipamento_label || '-'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs" title={os.descricao_problema}>{os.descricao_problema || 'Sem descrição'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">Início: {fmtBr(os.data_inicio)}</div>
                      <div className="text-xs text-gray-500">Fim: {fmtBr(os.data_fim)}</div>
                    </td>
                    <td className="p-4 text-gray-900">{os.tecnico_responsavel || '-'}</td>
                    <td className="p-4">{statusPill(os.status)}</td>
                    <td className="p-4">
                      <div className="flex gap-3 justify-end text-xs font-medium">
                        <Link className="text-gray-600 hover:text-indigo-600" to={`/manutencoes/${os.id}/editar`}>Editar / Ver OS</Link>
                        <button className="text-red-500 hover:text-red-700" onClick={() => askExcluir(os.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td className="p-8 text-center text-gray-500" colSpan={6}>Nenhuma OS encontrada.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINAÇÃO PADRÃO */}
        <div className="p-4 flex justify-end gap-1 border-t">
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => carregar(1)} disabled={page <= 1}>Início</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => page > 1 && carregar(page - 1)} disabled={page <= 1}>Voltar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => page < totalPages && carregar(page + 1)} disabled={page >= totalPages}>Avançar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => carregar(totalPages)} disabled={page >= totalPages}>Fim</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir OS"
        message={`Tem certeza que deseja excluir a OS #${targetId}? Esta ação não pode ser desfeita.`}
        cancelText="Cancelar"
        confirmText="Confirmar"
        onClose={() => setConfirmOpen(false)}
        onConfirm={doExcluir}
      />
    </div>
  );
}