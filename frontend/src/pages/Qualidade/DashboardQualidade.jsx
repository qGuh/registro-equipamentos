import { useEffect, useMemo, useState } from 'react';
import { getSetores, getIndicadores, getDashboard } from '../../services/qualidade';
import { useToast } from '../../components/ToastProvider';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from 'recharts';

const currentYear = new Date().getFullYear();
const anos = [currentYear - 1, currentYear, currentYear + 1];
const meses = [
  { value: 1, label: 'JAN' }, { value: 2, label: 'FEV' }, { value: 3, label: 'MAR' }, { value: 4, label: 'ABR' },
  { value: 5, label: 'MAI' }, { value: 6, label: 'JUN' }, { value: 7, label: 'JUL' }, { value: 8, label: 'AGO' },
  { value: 9, label: 'SET' }, { value: 10, label: 'OUT' }, { value: 11, label: 'NOV' }, { value: 12, label: 'DEZ' },
];

function formatNum(value, digits = 2) {
  const num = Number(value); return !Number.isFinite(num) ? '0,00' : num.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export default function DashboardQualidade() {
  const toast = useToast();
  const [setores, setSetores] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [filtros, setFiltros] = useState({ setor_id: '', ano: currentYear, indicador_id: 'todos', mesesSel: [] });
  const [resumo, setResumo] = useState(null);
  const [porMes, setPorMes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { carregarSetores(); }, []);
  useEffect(() => { carregarIndicadores(); }, [filtros.setor_id]);
  useEffect(() => { carregarDashboard(); }, [filtros.setor_id, filtros.ano, filtros.indicador_id, filtros.mesesSel]);

  async function carregarSetores() { try { const data = await getSetores(); setSetores(Array.isArray(data) ? data : []); } catch { toast.error('Erro ao carregar setores.'); } }
  async function carregarIndicadores() { try { const data = await getIndicadores({ setor_id: filtros.setor_id || undefined }); setIndicadores(Array.isArray(data) ? data : []); setFiltros(p => ({ ...p, indicador_id: 'todos' })); } catch {} }

  async function carregarDashboard() {
    setLoading(true);
    try {
      const data = await getDashboard({ setor_id: filtros.setor_id || undefined, ano: filtros.ano || undefined, indicador_id: filtros.indicador_id || undefined, meses: filtros.mesesSel.length ? filtros.mesesSel.join(',') : undefined });
      setResumo(data?.resumo || null); setPorMes(Array.isArray(data?.porMes) ? data.porMes : []);
    } catch { toast.error('Erro ao carregar dashboard.'); } finally { setLoading(false); }
  }

  const indicadorSel = useMemo(() => filtros.indicador_id === 'todos' ? null : indicadores.find(i => String(i.id) === String(filtros.indicador_id)), [indicadores, filtros.indicador_id]);
  const mesesParaMostrar = useMemo(() => filtros.mesesSel.length ? filtros.mesesSel.slice().sort((a,b)=>a-b) : meses.map(m => m.value), [filtros.mesesSel]);

  const chartData = useMemo(() => {
    const map = new Map();
    mesesParaMostrar.forEach(m => map.set(m, { mes: m, mesLabel: meses.find(x => x.value === m)?.label, previsto: 0, realizado: 0 }));
    porMes.forEach(row => { const m = Number(row.mes); if (map.has(m)) { const item = map.get(m); item.previsto = Number(row.total_previsto || 0); item.realizado = Number(row.total_realizado || 0); map.set(m, item); } });
    return mesesParaMostrar.map(m => map.get(m));
  }, [porMes, mesesParaMostrar]);

  const totalPrevisto = resumo?.total_previsto ?? 0; const totalRealizado = resumo?.total_realizado ?? 0;
  const percAting = resumo?.percentual_atingimento ?? (totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : null);
  const hasData = chartData.some(x => Number(x.previsto) > 0 || Number(x.realizado) > 0);

  function toggleMes(m) { setFiltros(p => ({ ...p, mesesSel: p.mesesSel.includes(m) ? p.mesesSel.filter(x => x !== m) : [...p.mesesSel, m] })); }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-1">Dashboard de Qualidade</h1>
      <p className="text-sm text-gray-500 mb-6">Acompanhamento de metas e indicadores de performance.</p>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Setor</label><select value={filtros.setor_id} onChange={e => setFiltros(p => ({ ...p, setor_id: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm bg-gray-50"><option value="">Todos</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Ano</label><select value={filtros.ano} onChange={e => setFiltros(p => ({ ...p, ano: Number(e.target.value) }))} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">{anos.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
          <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">Indicador</label><select value={filtros.indicador_id} onChange={e => setFiltros(p => ({ ...p, indicador_id: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm bg-gray-50"><option value="todos">Todos (Somados)</option>{indicadores.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}</select></div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">Filtrar meses específicos:</label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFiltros(p => ({ ...p, mesesSel: [] }))} className="px-3 py-1 rounded text-xs font-medium border hover:bg-gray-50">Todos</button>
            {meses.map(m => (
              <button key={m.value} onClick={() => toggleMes(m.value)} className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${filtros.mesesSel.includes(m.value) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">Total Previsto</p><p className="text-3xl font-bold text-gray-900 mt-1">{formatNum(totalPrevisto)}</p></div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">Total Realizado</p><p className="text-3xl font-bold text-gray-900 mt-1">{formatNum(totalRealizado)}</p></div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase">% Atingimento</p><p className="text-3xl font-bold text-indigo-600 mt-1">{percAting != null ? `${formatNum(percAting, 1)}%` : '–'}</p></div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-bold mb-4">Gráfico Mensal</h2>
        {loading ? <p className="text-gray-500">Carregando...</p> : !hasData ? <p className="text-gray-500">Sem dados para os filtros selecionados.</p> : (
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mesLabel" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={v => formatNum(v)} cursor={{fill: '#f3f4f6'}} />
                <Legend iconType="circle" />
                {indicadorSel?.meta_mensal && <ReferenceLine y={Number(indicadorSel.meta_mensal)} stroke="#6366f1" strokeDasharray="4 4" />}
                <Bar dataKey="previsto" name="Previsto" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" name="Realizado" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}