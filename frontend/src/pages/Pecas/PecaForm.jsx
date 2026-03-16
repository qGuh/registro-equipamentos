import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obterPeca, criarPeca, atualizarPeca } from '../../services/pecas';
import { useToast } from '../../components/ToastProvider';

export default function PecaForm(){
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome:'', descricao:'', categoria:'', quantidade: 0, local_armazenamento:'', observacoes:''
  });

  useEffect(()=>{ if(id) load(); },[id]);

  async function load(){
    setLoading(true);
    try{
      const p = await obterPeca(id);
      setForm({
        nome: p.nome || '', descricao: p.descricao || '', categoria: p.categoria || '',
        quantidade: p.quantidade ?? 0, local_armazenamento: p.local_armazenamento || '', observacoes: p.observacoes || ''
      });
    }catch(e){
      toast.error(e.response?.data?.message || 'Falha ao carregar peça');
      navigate('/pecas');
    }finally{ setLoading(false); }
  }

  function onChange(e){ const { name, value } = e.target; setForm(prev=>({ ...prev, [name]: value })); }

  async function handleSubmit(e){
    e.preventDefault();
    setSaving(true);
    try{
      const payload = {
        ...form,
        quantidade: Number(form.quantidade ?? 0)
      };
      if (id){ await atualizarPeca(id, payload); toast.success('Peça atualizada.'); }
      else { await criarPeca(payload); toast.success('Peça criada.'); }
      navigate('/pecas');
    }catch(e){
      toast.error(e.response?.data?.message || 'Erro ao salvar peça');
    }finally{ setSaving(false); }
  }

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{id ? 'Editar Peça' : 'Nova Peça'}</h1>
          <div className="flex gap-2">
            <button className="border px-4 py-2 rounded" onClick={()=>navigate(-1)}>Cancelar</button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm">Nome *</label>
            <input name="nome" value={form.nome} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Categoria</label>
            <input name="categoria" value={form.categoria} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Local de Armazenamento</label>
            <input name="local_armazenamento" value={form.local_armazenamento} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-sm">Quantidade</label>
            <input name="quantidade" value={form.quantidade} onChange={onChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Descrição</label>
            <textarea name="descricao" value={form.descricao} onChange={onChange} rows={3} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Observações</label>
            <textarea name="observacoes" value={form.observacoes} onChange={onChange} rows={3} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
      </div>
    </div>
  );
}