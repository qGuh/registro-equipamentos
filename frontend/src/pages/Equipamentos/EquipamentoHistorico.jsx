// src/pages/Equipamentos/EquipamentoHistorico.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listarHistoricoEquip, obterEquipamento, alocarEquipamento, desalocarEquipamento } from '../../services/equipamentos';

export default function EquipamentoHistorico() {
  const { id } = useParams();
  const [equip, setEquip] = useState(null);
  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colabId, setColabId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [e, h] = await Promise.all([obterEquipamento(id), listarHistoricoEquip(id)]);
      setEquip(e); setHist(h);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAlocar() {
    if (!colabId) return alert('Informe o ID do colaborador.');
    await alocarEquipamento(id, { colaborador_id: colabId, observacao: 'Alocado via tela de histórico' });
    setColabId('');
    await load();
  }

  async function handleDesalocar() {
    await desalocarEquipamento(id, { observacao: 'Desalocado via tela de histórico' });
    await load();
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Histórico do Equipamento #{id}</h1>
        <button onClick={() => history.back()} className="border px-3 py-2 rounded">Voltar</button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : equip ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="font-semibold">{equip.tipo} — {equip.marca} {equip.modelo}</div>
            <div className="text-sm text-gray-600">Série: {equip.numero_serie || '-'} • Patrimônio: {equip.patrimonio || '-'}</div>
            <div className="text-sm text-gray-600">Status atual: <b>{equip.status}</b>{equip.colaborador_atual_id ? ` • Colaborador: ${equip.colaborador_atual_id}` : ''}</div>
          </div>

          <div className="bg-white p-4 rounded shadow flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-sm mb-1">Alocar para ID do colaborador</label>
              <input value={colabId} onChange={e => setColabId(e.target.value)} className="border rounded px-3 py-2" placeholder="ex: 12" />
            </div>
            <button onClick={handleAlocar} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Alocar</button>
            <button onClick={handleDesalocar} className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded">Desalocar</button>
          </div>

          <div className="bg-white rounded shadow overflow-x-auto">
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
              <tbody>
                {hist.map((h) => (
                  <tr key={h.id} className="border-b">
                    <td className="p-3">{new Date(h.data_hora).toLocaleString()}</td>
                    <td className="p-3">{h.acao}</td>
                    <td className="p-3">{h.de_status || '-'} → {h.para_status || '-'}</td>
                    <td className="p-3">{h.colaborador_nome ? `${h.colaborador_nome} (#${h.colaborador_id})` : (h.colaborador_id || '-')}</td>
                    <td className="p-3">{h.detalhes || '-'}</td>
                    <td className="p-3">{h.usuario || '-'}</td>
                  </tr>
                ))}
                {!hist.length && (
                  <tr><td className="p-4 text-center" colSpan={6}>Sem eventos ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>Não encontrado.</div>
      )}
    </div>
  );
}