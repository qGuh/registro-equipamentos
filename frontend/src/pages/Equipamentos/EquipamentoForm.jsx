// src/pages/Equipamentos/EquipamentoForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { criarEquipamento, obterEquipamento, atualizarEquipamento } from '../../services/equipamentos';

const camposIniciais = {
  tipo: '', marca: '', modelo: '', numero_serie: '', patrimonio: '',
  descricao: '', status: 'disponivel', data_aquisicao: '', valor_aquisicao: ''
};

export default function EquipamentoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const [form, setForm] = useState(camposIniciais);
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (editando) {
      obterEquipamento(id).then((d) => {
        setForm({
          tipo: d.tipo || '',
          marca: d.marca || '',
          modelo: d.modelo || '',
          numero_serie: d.numero_serie || '',
          patrimonio: d.patrimonio || '',
          descricao: d.descricao || '',
          status: d.status || 'disponivel',
          data_aquisicao: d.data_aquisicao ? d.data_aquisicao.substring(0,10) : '',
          valor_aquisicao: d.valor_aquisicao || ''
        });
      });
    }
  }, [editando, id]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) await atualizarEquipamento(id, form);
      else await criarEquipamento(form);
      navigate('/equipamentos');
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{editando ? 'Editar' : 'Novo'} Equipamento</h1>
      <form onSubmit={onSubmit} className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Tipo *</label>
          <input name="tipo" value={form.tipo} onChange={onChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Marca</label>
          <input name="marca" value={form.marca} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Modelo</label>
          <input name="modelo" value={form.modelo} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Número de Série</label>
          <input name="numero_serie" value={form.numero_serie} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Patrimônio</label>
          <input name="patrimonio" value={form.patrimonio} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select name="status" value={form.status} onChange={onChange} className="w-full border rounded px-3 py-2">
            <option value="disponivel">Disponível</option>
            <option value="alocado">Alocado</option>
            <option value="manutencao">Manutenção</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Data de Aquisição</label>
          <input type="date" name="data_aquisicao" value={form.data_aquisicao} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Valor de Aquisição (R$)</label>
          <input type="number" step="0.01" name="valor_aquisicao" value={form.valor_aquisicao} onChange={onChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Descrição</label>
          <textarea name="descricao" value={form.descricao} onChange={onChange} className="w-full border rounded px-3 py-2" rows={3} />
        </div>
        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
          <button type="button" onClick={() => history.back()} className="px-4 py-2 rounded border">Cancelar</button>
          <button disabled={salvando} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">{salvando ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  );
}