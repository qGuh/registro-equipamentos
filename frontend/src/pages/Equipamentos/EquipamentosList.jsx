// src/pages/Equipamentos/EquipamentosList.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarEquipamentos, removerEquipamento, alocarEquipamento, desalocarEquipamento } from '../../services/equipamentos';

export default function EquipamentosList() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  async function carregar() {
    setCarregando(true);
    try {
      const data = await listarEquipamentos({ q, status });
      setItens(data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function statusBadge(s) {
    const base = 'px-2 py-1 rounded text-xs font-semibold';
    const map = {
      disponivel: 'bg-green-100 text-green-700',
      alocado: 'bg-blue-100 text-blue-700',
      manutencao: 'bg-yellow-100 text-yellow-700',
      inativo: 'bg-gray-200 text-gray-600',
    };
    return <span className={`${base} ${map[s] || 'bg-gray-100 text-gray-700'}`}>{s}</span>;
  }

  const confirmar = (msg) => window.confirm(msg);

  async function handleRemover(id) {
    if (!confirmar('Inativar este equipamento?')) return;
    await removerEquipamento(id);
    await carregar();
  }

  async function handleDesalocar(id) {
    if (!confirmar('Desalocar este equipamento?')) return;
    await desalocarEquipamento(id, { observacao: 'Desalocado pela lista' });
    await carregar();
  }

  async function handleAlocar(id) {
    const colaborador_id = window.prompt('ID do colaborador para alocação:');
    if (!colaborador_id) return;
    await alocarEquipamento(id, { colaborador_id, observacao: 'Alocado pela lista' });
    await carregar();
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Equipamentos</h1>
        <button
          onClick={() => navigate('/equipamentos/novo')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >Novo</button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por tipo, marca, série, patrimônio..."
          className="border rounded px-3 py-2 w-full"
        />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Status (todos)</option>
          <option value="disponivel">Disponível</option>
          <option value="alocado">Alocado</option>
          <option value="manutencao">Manutenção</option>
          <option value="inativo">Inativo</option>
        </select>
        <button onClick={carregar} className="border px-4 py-2 rounded">Filtrar</button>
      </div>

      {carregando ? (
        <div>Carregando...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">ID</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Marca/Modelo</th>
                <th className="p-3">Série</th>
                <th className="p-3">Patrimônio</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((e) => (
                <tr key={e.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{e.id}</td>
                  <td className="p-3">{e.tipo}</td>
                  <td className="p-3">{[e.marca, e.modelo].filter(Boolean).join(' / ')}</td>
                  <td className="p-3">{e.numero_serie || '-'}</td>
                  <td className="p-3">{e.patrimonio || '-'}</td>
                  <td className="p-3">{statusBadge(e.status)}</td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      <Link className="underline" to={`/equipamentos/${e.id}/historico`}>Histórico</Link>
                      <Link className="underline" to={`/equipamentos/${e.id}/editar`}>Editar</Link>
                      {e.status === 'alocado' ? (
                        <button onClick={() => handleDesalocar(e.id)} className="underline">Desalocar</button>
                      ) : e.status !== 'inativo' ? (
                        <button onClick={() => handleAlocar(e.id)} className="underline">Alocar</button>
                      ) : null}
                      <button className="text-red-600 underline" onClick={() => handleRemover(e.id)}>Inativar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!itens.length && (
                <tr><td className="p-4 text-center" colSpan={7}>Nenhum equipamento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}