import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listarEquipamentos,
  removerEquipamento,
  alocarEquipamento,
  desalocarEquipamento,
  exportarEquipamentosCSV,
} from '../../services/equipamentos';
import { buscarColaboradores } from '../../services/colaboradores';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';

export default function EquipamentosList() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [equipSel, setEquipSel] = useState(null);
  const [query, setQuery] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [colabSel, setColabSel] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmText, setConfirmText] = useState('Confirmar');
  const confirmActionRef = useRef(null);

  function abrirConfirmacao({ title, message, confirmText: cText = 'Confirmar', onConfirm }) {
    setConfirmTitle(title || 'Confirmar ação');
    setConfirmMessage(message || 'Tem certeza?');
    setConfirmText(cText);
    confirmActionRef.current = onConfirm || null;
    setConfirmOpen(true);
  }

  function fecharConfirmacao() {
    setConfirmOpen(false);
    setConfirmTitle('');
    setConfirmMessage('');
    setConfirmText('Confirmar');
    confirmActionRef.current = null;
  }

  async function confirmarAcao() {
    try {
      if (typeof confirmActionRef.current === 'function') await confirmActionRef.current();
      fecharConfirmacao();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Falha ao executar a ação');
    }
  }

  async function carregar(p = page) {
    setLoading(true);
    try {
      const data = await listarEquipamentos({ q, status, page: p, pageSize, sortBy, sortDir });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao carregar lista');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(1); }, [sortBy, sortDir, pageSize]);

  function statusBadge(s) {
    const map = {
      disponivel: 'bg-green-100 text-green-700',
      alocado: 'bg-blue-100 text-blue-700',
      manutencao: 'bg-yellow-100 text-yellow-700',
      inativo: 'bg-gray-200 text-gray-600',
    };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${map[s] || 'bg-gray-100 text-gray-700'}`}>{s || '-'}</span>;
  }

  function handleDesalocar(id) {
    abrirConfirmacao({
      title: 'Desalocar equipamento',
      message: 'Confirmar a desalocação deste equipamento?',
      onConfirm: async () => {
        await desalocarEquipamento(id, { observacao: 'Desalocado pela lista' });
        toast.success('Desalocado com sucesso.');
        await carregar();
      },
    });
  }

  function handleRemover(id) {
    abrirConfirmacao({
      title: 'Inativar equipamento',
      message: 'Tem certeza que deseja inativar este equipamento? Você poderá reativá-lo depois.',
      confirmText: 'Inativar',
      onConfirm: async () => {
        await removerEquipamento(id);
        toast.success('Equipamento inativado.');
        await carregar();
      },
    });
  }

  async function handleReativar(id) {
    try {
      await api.put(`/equipamentos/${id}`, { status: 'disponivel' });
      toast.success('Equipamento reativado.');
      await carregar();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao reativar');
    }
  }

  function abrirModalAlocar(eq) {
    setEquipSel(eq); setQuery(''); setSugestoes([]); setColabSel(null); setShowModal(true);
  }

  useEffect(() => {
    if (!showModal) return;
    if (!query?.trim()) { setSugestoes([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setBuscando(true);
        const data = await buscarColaboradores(query, 8);
        setSugestoes(Array.isArray(data) ? data : data?.items || []);
      } catch { setSugestoes([]); } finally { setBuscando(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, showModal]);

  async function confirmarAlocacao() {
    if (!colabSel?.id) return toast.info('Selecione um colaborador.');
    try {
      await alocarEquipamento(equipSel.id, { colaborador_id: colabSel.id, observacao: `Alocado para ${colabSel.nome}` });
      toast.success('Alocado com sucesso.');
      setShowModal(false);
      await carregar();
    } catch (e) { toast.error(e.response?.data?.message || 'Falha ao alocar'); }
  }

  async function exportarCsv() {
    try {
      const blob = await exportarEquipamentosCSV({ q, status, sortBy, sortDir });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'equipamentos.csv';
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
    } catch { toast.error('Falha ao exportar CSV'); }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-4">
      {/* CABEÇALHO PADRÃO CONTAS DE ACESSO */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Equipamentos</h1>
          <p className="text-sm text-gray-500">Gerencie os equipamentos cadastrados e alocações.</p>
        </div>
        <button onClick={() => navigate('/equipamentos/novo')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-medium">
          Novo
        </button>
      </div>

      {/* BLOCO DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Busca</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tipo, modelo, patrimônio, colaborador..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
              <option value="">Status (todos)</option>
              <option value="disponivel">Disponível</option>
              <option value="alocado">Alocado</option>
              <option value="manutencao">Manutenção</option>
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
              <button onClick={exportarCsv} className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50">Exportar</button>
              <button onClick={() => carregar(1)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50">Aplicar</button>
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
                  <th className="p-4 font-medium">Tipo / Marca</th>
                  <th className="p-4 font-medium">Patrimônio / Série</th>
                  <th className="p-4 font-medium">Colaborador</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{e.tipo || '-'}</div>
                      <div className="text-xs text-gray-500">{e.marca} {e.modelo}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{e.patrimonio || '-'}</div>
                      <div className="text-xs text-gray-500">{e.numero_serie || 'Sem série'}</div>
                    </td>
                    <td className="p-4">
                      {e.colaborador_atual_id ? (
                        // ✅ ROTA CORRIGIDA AQUI: Adicionado o /editar no final
                        <Link className="text-indigo-600 hover:underline font-medium" to={`/colaboradores/${e.colaborador_atual_id}/editar`}>
                          {e.colaborador_nome}
                        </Link>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-4">{statusBadge(e.status)}</td>
                    <td className="p-4">
                      <div className="flex gap-3 justify-end text-xs font-medium">
                        <Link className="text-gray-600 hover:text-indigo-600" to={`/equipamentos/${e.id}/historico`}>Histórico</Link>
                        <Link className="text-gray-600 hover:text-indigo-600" to={`/equipamentos/${e.id}/editar`}>Editar</Link>
                        {e.status === 'alocado' && <button className="text-gray-600 hover:text-indigo-600" onClick={() => handleDesalocar(e.id)}>Desalocar</button>}
                        {e.status === 'disponivel' && <button className="text-gray-600 hover:text-indigo-600" onClick={() => abrirModalAlocar(e)}>Alocar</button>}
                        {e.status === 'inativo' ? (
                          <button className="text-gray-600 hover:text-indigo-600" onClick={() => handleReativar(e.id)}>Reativar</button>
                        ) : (
                          <button className="text-red-500 hover:text-red-700" onClick={() => handleRemover(e.id)}>Inativar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td className="p-8 text-center text-gray-500" colSpan={5}>Nenhum equipamento encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINAÇÃO PADRÃO CONTAS DE ACESSO */}
        <div className="p-4 flex justify-end gap-1 border-t">
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => carregar(1)} disabled={page <= 1}>Início</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => page > 1 && carregar(page - 1)} disabled={page <= 1}>Voltar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => page < totalPages && carregar(page + 1)} disabled={page >= totalPages}>Avançar</button>
          <button className="px-3 py-1 text-xs border rounded bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50" onClick={() => carregar(totalPages)} disabled={page >= totalPages}>Fim</button>
        </div>
      </div>

      {/* Restante dos Modais continuam iguais... */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[520px] max-w-[95vw] p-5">
            <div className="mb-4 pb-3 border-b">
              <div className="text-lg font-bold">Alocar equipamento</div>
              <div className="text-sm text-gray-500">{equipSel?.tipo} {equipSel?.marca} (Patrimônio: {equipSel?.patrimonio || 'S/N'})</div>
            </div>
            <label className="block text-sm text-gray-700 mb-1">Buscar colaborador por nome</label>
            <div className="relative">
              <input value={query} onChange={(e) => { setQuery(e.target.value); setColabSel(null); }} placeholder="Digite o nome..." className="border rounded px-3 py-2 w-full text-sm bg-gray-50" />
              {!!sugestoes.length && (
                <ul className="absolute z-10 bg-white border mt-1 rounded w-full max-h-48 overflow-auto shadow-lg">
                  {sugestoes.map((c) => (
                    <li key={c.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm" onClick={() => { setColabSel({ id: c.id, nome: c.nome }); setQuery(c.nome); setSugestoes([]); }}>
                      {c.nome} <span className="text-xs text-gray-400">#{c.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {buscando && <div className="text-xs text-gray-500 mt-1">Buscando...</div>}
            <div className="flex justify-end gap-2 mt-6">
              <button className="border px-4 py-2 rounded text-sm hover:bg-gray-50" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm" onClick={confirmarAlocacao}>Confirmar Alocação</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMessage} cancelText="Cancelar" confirmText={confirmText} onClose={fecharConfirmacao} onConfirm={confirmarAcao} />
    </div>
  );
}