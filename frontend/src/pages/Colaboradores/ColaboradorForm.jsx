import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obterColaborador, criarColaborador, atualizarColaborador } from '../../services/colaboradores';
import { useToast } from '../../components/ToastProvider';

const toYMD = (v) => {
  if (!v) return '';
  const s = String(v);
  if (s.includes('T')) return s.split('T')[0];
  if (s.includes('/')) { const [d, m, y] = s.split('/'); return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  return s;
};

const formatarTelefone = (valor) => {
  if (!valor) return '';
  const numeroLimpo = valor.replace(/\D/g, '');
  if (numeroLimpo.length <= 2) return `(${numeroLimpo}`;
  if (numeroLimpo.length <= 7) return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2)}`;
  return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7, 11)}`;
};

const SETORES_OFICIAIS = [
  'ADMINISTRATIVO', 'ASSISTENCIA SAT', 'ASSISTENCIA SOLAR', 'COMERCIAL',
  'COMERCIAL SAT', 'COMERCIAL SOLAR', 'DIRETORIA', 'EXPEDIÇÃO',
  'FATURAMENTO', 'FINANCEIRO', 'INTEGRADORA', 'JURIDICO',
  'LOGISTICA', 'MARKETING', 'QUALIDADE', 'RECEPÇÃO', 'RH', 'TI'
].sort();

const CARGOS_OFICIAIS = [
  'Auxiliar', 'Colaborador', 'Diretor', 'Gestor'
].sort();

export default function ColaboradorForm() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    nome: '', email: '', telefone_corporativo: '', setor: '', cargo: '',
    data_admissao: '', status: 'ativo'
  });

  async function load() {
    if (!isNew) {
      const data = await obterColaborador(id);
      setForm({
        nome: data.nome || '',
        email: data.email || '',
        telefone_corporativo: formatarTelefone(data.telefone_corporativo || ''),
        setor: data.setor || '',
        cargo: data.cargo || '',
        data_admissao: data.data_admissao || '',
        status: data.status || 'ativo',
      });
    }
  }
  useEffect(() => { load(); }, [id]);

  async function handleSave(e) {
    if (e) e.preventDefault();
    try {
      if (!form.nome.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }
      const payload = {
        ...form,
        data_admissao: form.data_admissao ? toYMD(form.data_admissao) : null,
      };
      if (isNew) {
        await criarColaborador(payload);
        toast.success('Colaborador criado com sucesso.');
      } else {
        await atualizarColaborador(id, payload);
        toast.success('Colaborador atualizado com sucesso.');
      }
      nav('/colaboradores');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar');
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{isNew ? 'Novo Colaborador' : `Editar Colaborador #${id}`}</h1>
          <p className="text-sm text-gray-500">Preencha os dados do funcionário.</p>
        </div>
        <button className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium" onClick={() => nav(-1)}>
          Voltar
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Nome Completo *</label>
            <input className="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">E-mail</label>
            <input className="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Telefone Corporativo</label>
            <input 
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50" 
              placeholder="(00) 00000-0000" 
              value={form.telefone_corporativo}
              maxLength={15} 
              onChange={e => {
                const valorFormatado = formatarTelefone(e.target.value);
                setForm(f => ({ ...f, telefone_corporativo: valorFormatado }));
              }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Setor</label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={form.setor} onChange={e => setForm(f => ({ ...f, setor: e.target.value }))}>
              <option value="">Selecione um setor...</option>
              {SETORES_OFICIAIS.map((setor) => <option key={setor} value={setor}>{setor}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Cargo</label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}>
              <option value="">Selecione um cargo...</option>
              {CARGOS_OFICIAIS.map((cargo) => <option key={cargo} value={cargo}>{cargo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select className="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Admissão</label>
            <input type="date" className="w-full border rounded px-3 py-2 text-sm bg-gray-50" value={toYMD(form.data_admissao) || ''} onChange={e => setForm(f => ({ ...f, data_admissao: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-2">
          <button type="button" className="border px-4 py-2 rounded text-sm font-medium hover:bg-gray-50" onClick={() => nav('/colaboradores')}>
            Cancelar
          </button>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm font-medium">
            {isNew ? 'Criar' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}