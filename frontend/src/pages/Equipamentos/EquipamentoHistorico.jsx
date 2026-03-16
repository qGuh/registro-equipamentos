import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { buscarColaboradores } from '../../services/colaboradores';
import {
  alocarEquipamento,
  desalocarEquipamento,
} from '../../services/equipamentos';
import { useToast } from '../../components/ToastProvider';

export default function EquipamentoHistorico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [equip, setEquip] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  // autocomplete
  const [query, setQuery] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [colabSel, setColabSel] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);

  function statusBadge(s) {
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
    const map = {
      disponivel: 'bg-green-100 text-green-700',
      alocado: 'bg-blue-100 text-blue-700',
      manutencao: 'bg-yellow-100 text-yellow-700',
      inativo: 'bg-gray-200 text-gray-700',
    };
    return <span className={`${base} ${map[s] || 'bg-gray-100 text-gray-700'}`}>{s}</span>;
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [eResp, hResp] = await Promise.all([
        api.get(`/equipamentos/${id}`),
        api.get(`/equipamentos/${id}/historico`),
      ]);
      setEquip(eResp.data);
      setHistorico(hResp.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [id]);

  // buscar colaboradores (debounce)
  useEffect(() => {
    if (!query?.trim()) { setSugestoes([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setBuscando(true);
        const data = await buscarColaboradores(query, 8);
        setSugestoes(Array.isArray(data) ? data : (data?.items || []));
      } catch {
        setSugestoes([]);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleAlocar() {
    if (!colabSel?.id) return toast.info('Selecione um colaborador.');
    try {
      await alocarEquipamento(id, {
        colaborador_id: colabSel.id,
        observacao: `Alocado para ${colabSel.nome}`,
      });
      toast.success('Equipamento alocado.');
      setColabSel(null); setQuery('');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao alocar');
    }
  }

  async function handleDesalocar() {
    try {
      await desalocarEquipamento(id, { observacao: 'Desalocado via histórico' });
      toast.success('Equipamento desalocado.');
      setColabSel(null); setQuery('');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao desalocar');
    }
  }

  async function handleReativar() {
    try {
      await api.put(`/equipamentos/${id}`, { status: 'disponivel' });
      toast.success('Equipamento reativado (disponível).');
      await loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao reativar');
    }
  }

  if (loading) return <div className="p-4">Carregando...</div>;
  if (!equip) return (
    <div className="p-4">
      <button className="border px-3 py-1 rounded mb-3" onClick={() => navigate(-1)}>Voltar</button>
      <div>Equipamento não encontrado.</div>
    </div>
  );

  const naoPodeAlocar = equip.status === 'inativo' || equip.status === 'alocado';
  const naoPodeDesalocar = equip.status !== 'alocado';

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Histórico do Equipamento #{id}</h1>
        <div className="flex gap-2">
          <button className="border px-3 py-1 rounded" onClick={() => navigate(-1)}>Voltar</button>
          {equip.status === 'inativo' && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              onClick={handleReativar}
            >
              Reativar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-4">
        <div className="text-lg font-semibold">
          {equip.tipo || '-'}{equip.marca ? ` — ${equip.marca}` : ''}{equip.modelo ? ` ${equip.modelo}` : ''}
        </div>
        <div className="text-sm text-gray-600">
          Série: {equip.numero_serie || '-'} • Patrimônio: {equip.patrimonio || '-'}
        </div>
        <div className="mt-1">Status atual: {statusBadge(equip.status)}</div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-4">
        <label className="block text-sm mb-1">Buscar colaborador por nome</label>
        <div className="relative max-w-xl">
          <input
            value={colabSel ? `${colabSel.nome} (#${colabSel.id})` : query}
            onChange={e => { setColabSel(null); setQuery(e.target.value); }}
            placeholder="Digite o nome do colaborador..."
            className="border rounded px-3 py-2 w-full"
          />
          {!!sugestoes.length && !colabSel && (
            <ul className="absolute z-10 bg-white border mt-1 rounded w-full max-h-60 overflow-auto shadow">
              {sugestoes.map(c => (
                <li key={c.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setColabSel({ id: c.id, nome: c.nome }); setSugestoes([]); }}>
                  {c.nome} <span className="text-xs text-gray-500">#{c.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {buscando && <div className="text-xs text-gray-500 mt-1">Buscando...</div>}
        {colabSel && <div className="text-xs text-gray-600 mt-1">Selecionado: <b>{colabSel.nome}</b> (#{colabSel.id})</div>}

        <div className="flex gap-2 mt-3">
          <button
            className={`px-4 py-2 rounded ${naoPodeAlocar || !colabSel ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            onClick={handleAlocar}
            disabled={naoPodeAlocar || !colabSel}
          >
            Alocar
          </button>
          <button
            className={`px-4 py-2 rounded ${naoPodeDesalocar ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black'}`}
            onClick={handleDesalocar}
            disabled={naoPodeDesalocar}
          >
            Desalocar
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Quando</th>
              <th className="p-3">Ação</th>
              <th className="p-3">De → Para</th>
              <th className="p-3">Colaborador</th>
              <th className="p-3">Detalhes</th>
              <th className="p-3">Usuário</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {historico.map(h => (
              <tr key={h.id || `${h.equipamento_id}-${h.data_hora}`} className="border-b">
                <td className="p-3">
                  {h.data_hora ? new Date(h.data_hora).toLocaleString() : '-'}
                </td>
                <td className="p-3">{h.acao}</td>
                <td className="p-3">{(h.de_status || '-') + ' → ' + (h.para_status || '-')}</td>
                <td className="p-3">{h.colaborador_nome || '-'}</td>
                <td className="p-3">{h.detalhes || '-'}</td>
                <td className="p-3">{h.usuario || 'desconhecido'}</td>
              </tr>
            ))}
            {!historico.length && (
              <tr><td className="p-4 text-center" colSpan={6}>Sem eventos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}