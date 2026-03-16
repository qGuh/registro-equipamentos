import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import api from "../../services/api";
import { useToast } from '../../components/ToastProvider';

const MONTHS = [
  { value: 1, label: "Janeiro" }, { value: 2, label: "Fevereiro" }, { value: 3, label: "Março" },
  { value: 4, label: "Abril" }, { value: 5, label: "Maio" }, { value: 6, label: "Junho" },
  { value: 7, label: "Julho" }, { value: 8, label: "Agosto" }, { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" }, { value: 11, label: "Novembro" }, { value: 12, label: "Dezembro" },
];

function formatNum(v) {
  const n = Number(v); return Number.isFinite(n) ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";
}
function parseNum(str) {
  const n = Number(String(str).trim().replace(/\./g, "").replace(",", ".")); return Number.isFinite(n) ? n : 0;
}

export default function LancamentosList() {
  const currentYear = new Date().getFullYear();
  const toast = useToast();

  const [setorId, setSetorId] = useState("");
  const [indicadorId, setIndicadorId] = useState("");
  const [ano, setAno] = useState(String(currentYear));
  
  const [setores, setSetores] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ indicador_id: "", ano: String(currentYear), mes: "", previsto: "0,00", realizado: "0,00", observacao: "" });
  
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => { loadBase(); }, []);
  useEffect(() => { loadIndicadores(setorId); }, [setorId]);
  useEffect(() => { loadLancamentos(); }, [setorId, indicadorId, ano]);

  async function loadBase() {
    try { const { data } = await api.get("/qualidade/setores"); setSetores(data || []); loadIndicadores(""); } catch (e) { toast.error("Erro ao carregar setores."); }
  }
  async function loadIndicadores(sid) {
    try { const { data } = await api.get("/qualidade/indicadores", { params: sid ? { setor_id: sid } : {} }); setIndicadores(data || []); } catch (e) {}
  }
  async function loadLancamentos() {
    setLoading(true);
    try {
      const { data } = await api.get("/qualidade/lancamentos", { params: { setor_id: setorId, indicador_id: indicadorId, ano } });
      setLancamentos(data || []);
    } catch (e) { toast.error("Erro ao carregar lançamentos."); } finally { setLoading(false); }
  }

  function openForm(item = null) {
    setEditing(item);
    setForm({
      indicador_id: item ? item.indicador_id : (indicadorId || ""),
      ano: item ? item.ano : ano, mes: item ? item.mes : "",
      previsto: item ? formatNum(item.previsto) : "0,00",
      realizado: item ? formatNum(item.realizado) : "0,00",
      observacao: item?.observacao || ""
    });
    setFormOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.indicador_id || !form.ano || !form.mes) return toast.error("Preencha Indicador, Ano e Mês.");
    const payload = { indicador_id: Number(form.indicador_id), ano: Number(form.ano), mes: Number(form.mes), previsto: parseNum(form.previsto), realizado: parseNum(form.realizado), observacao: form.observacao };
    try {
      if (editing?.id) await api.put(`/qualidade/lancamentos/${editing.id}`, payload);
      else await api.post("/qualidade/lancamentos", payload);
      toast.success("Salvo com sucesso!"); setFormOpen(false); loadLancamentos();
    } catch { toast.error("Erro ao salvar."); }
  }

  async function doDelete() {
    if (!confirm.id) return;
    try { await api.delete(`/qualidade/lancamentos/${confirm.id}`); toast.success("Excluído!"); setConfirm({ open: false, id: null }); loadLancamentos(); } catch { toast.error("Erro ao excluir."); }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Lançamentos de Qualidade</h1>
          <p className="text-sm text-gray-500">Registre o previsto e realizado dos indicadores mês a mês.</p>
        </div>
        <button onClick={() => openForm()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-medium">Novo Lançamento</button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Setor</label>
          <select value={setorId} onChange={e => setSetorId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
            <option value="">Todos</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Indicador</label>
          <select value={indicadorId} onChange={e => setIndicadorId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
            <option value="">Todos</option>{indicadores.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Ano</label>
          <input value={ano} onChange={e => setAno(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase text-left">
              <th className="py-3 px-4 font-medium">Indicador / Setor</th>
              <th className="py-3 px-4 font-medium">Período</th>
              <th className="py-3 px-4 font-medium text-right">Previsto</th>
              <th className="py-3 px-4 font-medium text-right">Realizado</th>
              <th className="py-3 px-4 font-medium text-right">% Atingido</th>
              <th className="py-3 px-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map(item => {
              const pct = item.previsto > 0 ? (item.realizado / item.previsto) * 100 : 0;
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">{item.indicador_nome}</div>
                    <div className="text-xs text-gray-500">{item.setor_nome}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">{MONTHS.find(m => m.value === item.mes)?.label}/{item.ano}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatNum(item.previsto)}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{formatNum(item.realizado)}</td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pct >= 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {formatNum(pct)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-3 font-medium text-xs">
                      <button onClick={() => openForm(item)} className="text-gray-600 hover:text-indigo-600">Editar</button>
                      <button onClick={() => setConfirm({ open: true, id: item.id })} className="text-red-500 hover:text-red-700">Excluir</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && !lancamentos.length && <tr><td colSpan={6} className="p-6 text-center text-gray-500">Nenhum lançamento encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[95vw] p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? "Editar lançamento" : "Novo lançamento"}</h2>
            <form onSubmit={submitForm} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Indicador *</label>
                <select value={form.indicador_id} onChange={e => setForm({ ...form, indicador_id: e.target.value })} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
                  <option value="">Selecione...</option>{indicadores.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ano *</label>
                <input value={form.ano} onChange={e => setForm({ ...form, ano: e.target.value })} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mês *</label>
                <select value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
                  <option value="">Selecione...</option>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Previsto</label>
                <input value={form.previsto} onChange={e => setForm({ ...form, previsto: e.target.value })} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Realizado</label>
                <input value={form.realizado} onChange={e => setForm({ ...form, realizado: e.target.value })} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setFormOpen(false)} className="border px-4 py-2 rounded text-sm font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-indigo-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirm.open} title="Excluir Lançamento" message="Tem certeza que deseja excluir?" cancelText="Cancelar" confirmText="Excluir" onClose={() => setConfirm({ open: false, id: null })} onConfirm={doDelete} />
    </div>
  );
}