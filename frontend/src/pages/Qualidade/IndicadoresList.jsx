import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function IndicadoresList() {
  const toast = useToast();
  const [setores, setSetores] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [filtroSetor, setFiltroSetor] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ setor_id: '', nome: '', descricao: '', unidade: '', meta_mensal: '' });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDelete, setTargetDelete] = useState(null);

  useEffect(() => { carregarSetores(); }, []);
  useEffect(() => { carregarIndicadores(); }, [filtroSetor]);

  async function carregarSetores() {
    try {
      const response = await api.get('/qualidade/setores');
      setSetores(Array.isArray(response.data) ? response.data : []);
    } catch { toast.error('Erro ao carregar setores.'); }
  }

  async function carregarIndicadores() {
    try {
      setLoading(true);
      const params = filtroSetor ? { setor_id: filtroSetor } : {};
      const response = await api.get('/qualidade/indicadores', { params });
      setIndicadores(Array.isArray(response.data) ? response.data : []);
    } catch { toast.error('Erro ao carregar indicadores.'); } finally { setLoading(false); }
  }

  function resetForm() {
    setEditingId(null);
    setFormData({ setor_id: '', nome: '', descricao: '', unidade: '', meta_mensal: '' });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.setor_id || !formData.nome || !formData.unidade) return toast.error('Preencha Setor, Nome e Unidade.');
    
    const payload = { ...formData, setor_id: Number(formData.setor_id), meta_mensal: formData.meta_mensal ? Number(formData.meta_mensal) : null };
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/qualidade/indicadores/${editingId}`, payload);
        toast.success('Indicador atualizado.');
      } else {
        await api.post('/qualidade/indicadores', payload);
        toast.success('Indicador criado.');
      }
      resetForm(); await carregarIndicadores(); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch { toast.error('Erro ao salvar indicador.'); } finally { setSaving(false); }
  }

  function handleEditar(ind) {
    setEditingId(ind.id);
    setFormData({ setor_id: ind.setor_id || '', nome: ind.nome || '', descricao: ind.descricao || '', unidade: ind.unidade || '', meta_mensal: ind.meta_mensal || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function doExcluir() {
    if (!targetDelete?.id) return setConfirmOpen(false);
    try {
      await api.delete(`/qualidade/indicadores/${targetDelete.id}`);
      toast.success('Indicador excluído.'); setConfirmOpen(false); setTargetDelete(null);
      await carregarIndicadores(); if (editingId === targetDelete.id) resetForm();
    } catch { toast.error('Erro ao excluir indicador.'); }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Indicadores</h1>
          <p className="text-sm text-gray-500">Cadastre as métricas que serão medidas no dashboard.</p>
        </div>
        <button onClick={() => { resetForm(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-medium">
          Novo Indicador
        </button>
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <select value={filtroSetor} onChange={(e) => setFiltroSetor(e.target.value)} className="border rounded px-3 py-2 text-sm bg-gray-50 min-w-[200px]">
          <option value="">Setor (todos)</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <button onClick={carregarIndicadores} className="border px-4 py-2 rounded text-sm font-medium hover:bg-gray-50">Filtrar</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">{editingId ? 'Editar indicador' : 'Novo indicador'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Setor *</label>
            <select name="setor_id" value={formData.setor_id} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm bg-gray-50">
              <option value="">Selecione...</option>
              {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Indicador *</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm bg-gray-50" placeholder="Ex.: Tempo médio de atendimento" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
            <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows={2} className="border rounded px-3 py-2 w-full text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unidade *</label>
            <input type="text" name="unidade" value={formData.unidade} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm bg-gray-50" placeholder="Ex.: %, un, min..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meta mensal (opcional)</label>
            <input type="number" name="meta_mensal" value={formData.meta_mensal} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm bg-gray-50" placeholder="Ex.: 100" />
          </div>
          <div className="md:col-span-3 flex justify-end gap-2 mt-2 border-t pt-4">
            {editingId && <button type="button" onClick={resetForm} className="border px-4 py-2 rounded text-sm font-medium hover:bg-gray-50">Cancelar</button>}
            <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Salvar indicador')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase text-left">
              <th className="py-3 px-4 font-medium">Setor</th>
              <th className="py-3 px-4 font-medium">Indicador</th>
              <th className="py-3 px-4 font-medium">Unidade</th>
              <th className="py-3 px-4 font-medium">Meta</th>
              <th className="py-3 px-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {indicadores.map(ind => (
              <tr key={ind.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-600">{ind.setor_nome || '-'}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{ind.nome}</td>
                <td className="py-3 px-4 text-gray-600">{ind.unidade}</td>
                <td className="py-3 px-4 text-gray-600">{ind.meta_mensal || '-'}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-3 font-medium text-xs">
                    <button onClick={() => handleEditar(ind)} className="text-gray-600 hover:text-indigo-600">Editar</button>
                    <button onClick={() => { setTargetDelete(ind); setConfirmOpen(true); }} className="text-red-500 hover:text-red-700">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {!indicadores.length && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum indicador encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={confirmOpen} title="Excluir indicador" message={targetDelete ? `Excluir o indicador "${targetDelete.nome}"?` : 'Tem certeza?'} cancelText="Cancelar" confirmText="Excluir" onClose={() => setConfirmOpen(false)} onConfirm={doExcluir} />
    </div>
  );
}