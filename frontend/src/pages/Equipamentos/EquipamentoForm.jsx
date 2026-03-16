import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { excluirEquipamento } from '../../services/equipamentos';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';

function toInputDate(isoOrNull) {
  if (!isoOrNull) return '';
  const d = new Date(isoOrNull);
  if (Number.isNaN(d.getTime())) return String(isoOrNull).slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ✅ Lista de Tipos de Equipamentos padronizada
const TIPOS_EQUIPAMENTO = [
  'Desktop', 'Notebook', 'Monitor', 'Smartphone / Celular', 'Tablet',
  'Impressora', 'Nobreak', 'Servidor', 'Switch', 'Roteador',
  'Teclado', 'Mouse', 'Headset', 'Telefone IP', 'Outros'
].sort();

export default function EquipamentoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('usuario') || 'null');
  } catch {}
  const isAdmin = user?.perfil === 'admin' || user?.tipo_perfil === 'admin';

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [form, setForm] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    patrimonio: '',
    status: 'disponivel',
    data_aquisicao: '',
    valor_aquisicao: '',
    data_entrega: '',       // ✅ Campo novo
    data_recolhimento: '',  // ✅ Campo novo
    descricao: '',
    observacoes: '',        // ✅ Campo novo
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/equipamentos/${id}`);
      setForm({
        tipo: data.tipo || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        numero_serie: data.numero_serie || '',
        patrimonio: data.patrimonio || '',
        status: data.status || 'disponivel',
        data_aquisicao: toInputDate(data.data_aquisicao) || '',
        valor_aquisicao: data.valor_aquisicao ?? '',
        data_entrega: toInputDate(data.data_entrega) || '',
        data_recolhimento: toInputDate(data.data_recolhimento) || '',
        descricao: data.descricao || '',
        observacoes: data.observacoes || '',
      });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao carregar dados do equipamento');
      navigate('/equipamentos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tipo: form.tipo?.trim(),
        marca: form.marca?.trim() || null,
        modelo: form.modelo?.trim() || null,
        numero_serie: form.numero_serie?.trim() || null,
        patrimonio: form.patrimonio?.trim() || null,
        status: form.status || 'disponivel',
        data_aquisicao: form.data_aquisicao || null,
        data_entrega: form.data_entrega || null,
        data_recolhimento: form.data_recolhimento || null,
        valor_aquisicao: form.valor_aquisicao === '' ? null : Number(String(form.valor_aquisicao).replace(',', '.')),
        descricao: form.descricao?.trim() || null,
        observacoes: form.observacoes?.trim() || null,
      };

      if (id) {
        await api.put(`/equipamentos/${id}`, payload);
        toast.success('Equipamento atualizado com sucesso.');
      } else {
        await api.post('/equipamentos', payload);
        toast.success('Equipamento criado com sucesso.');
      }
      navigate('/equipamentos');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao salvar equipamento');
    } finally {
      setSaving(false);
    }
  }

  async function confirmExcluir() {
    if (confirmLoading) return;
    setConfirmLoading(true);
    try {
      await excluirEquipamento(id);
      toast.success('Equipamento excluído definitivamente.');
      setConfirmOpen(false);
      navigate('/equipamentos');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Falha ao excluir equipamento');
    } finally {
      setConfirmLoading(false);
    }
  }

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4">
      {/* Cabeçalho no padrão Contas de Acesso */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Editar Equipamento' : 'Novo Equipamento'}</h1>
          <p className="text-sm text-gray-500">Preencha os dados do ativo de TI.</p>
        </div>
        <button className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium" onClick={() => navigate(-1)}>
          Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tipo de Equipamento *</label>
            <select name="tipo" value={form.tipo} onChange={onChange} required className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
              <option value="">Selecione...</option>
              {TIPOS_EQUIPAMENTO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Marca</label>
            <input name="marca" value={form.marca} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Modelo</label>
            <input name="modelo" value={form.modelo} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Número de Série</label>
            <input name="numero_serie" value={form.numero_serie} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Patrimônio</label>
            <input name="patrimonio" value={form.patrimonio} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select name="status" value={form.status} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
              <option value="disponivel">Disponível</option>
              <option value="alocado">Alocado</option>
              <option value="manutencao">Manutenção</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Aquisição</label>
            <input type="date" name="data_aquisicao" value={form.data_aquisicao} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Entrega (Alocação)</label>
            <input type="date" name="data_entrega" value={form.data_entrega} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Recolhimento</label>
            <input type="date" name="data_recolhimento" value={form.data_recolhimento} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs text-gray-600 mb-1">Configurações / Descrição</label>
            <textarea name="descricao" value={form.descricao} onChange={onChange} rows={2} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs text-gray-600 mb-1">Observações (Avarias, detalhes gerais)</label>
            <textarea name="observacoes" value={form.observacoes} onChange={onChange} rows={2} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div>
            {id && isAdmin && (
              <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setConfirmOpen(true)}>
                Excluir Definitivamente
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="border px-4 py-2 rounded text-sm font-medium hover:bg-gray-50" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm font-medium" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir definitivamente"
        message="Tem certeza que deseja excluir definitivamente este equipamento? Esta ação remove o histórico associado. Só é permitido se o equipamento estiver inativo."
        cancelText="Cancelar"
        confirmText={confirmLoading ? 'Processando...' : 'Excluir definitivamente'}
        onClose={() => (confirmLoading ? null : setConfirmOpen(false))}
        onConfirm={confirmExcluir}
      />
    </div>
  );
}