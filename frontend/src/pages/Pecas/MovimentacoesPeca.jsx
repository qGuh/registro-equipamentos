import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { listarMovimentacoesPeca, obterPeca } from '../../services/pecas';
import { useToast } from '../../components/ToastProvider';

export default function MovimentacoesPeca(){
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [peca, setPeca] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function carregar(p=page){
    setLoading(true);
    try{
      const [pRow, mov] = await Promise.all([
        obterPeca(id), listarMovimentacoesPeca(id, { page:p, pageSize })
      ]);
      setPeca(pRow);
      setItems(mov.items || []); setTotal(mov.total || 0); setPage(mov.page || 1);
    }catch(e){
      toast.error(e.response?.data?.message || 'Falha ao carregar histórico');
      navigate('/pecas');
    }finally{ setLoading(false); }
  }

  useEffect(()=>{ carregar(1); }, [id]);

  return (
    <div className="p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            Movimentações da Peça {peca ? `— ${peca.nome} (#${peca.id})` : ''}
          </h1>
          <Link to="/pecas" className="border px-4 py-2 rounded">Voltar</Link>
        </div>

        {loading ? <div>Carregando...</div> : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-3">Quando</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Qtd</th>
                  <th className="p-3">Valor Unit.</th>
                  <th className="p-3">OS</th>
                  <th className="p-3">Observação</th>
                  <th className="p-3">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {items.map(m=>(
                  <tr key={m.id} className="border-b">
                    <td className="p-3">{m.data_hora ? new Date(m.data_hora).toLocaleString() : '-'}</td>
                    <td className="p-3">{m.tipo}</td>
                    <td className="p-3">{m.quantidade}</td>
                    <td className="p-3">{m.valor_unitario != null ? Number(m.valor_unitario).toFixed(2) : '-'}</td>
                    <td className="p-3">{m.id_manutencao ? <Link className="underline" to={`/manutencoes/${m.id_manutencao}/editar`}>#{m.id_manutencao}</Link> : '-'}</td>
                    <td className="p-3">{m.observacao || '-'}</td>
                    <td className="p-3">{m.usuario || '-'}</td>
                  </tr>
                ))}
                {!items.length && <tr><td className="p-4 text-center" colSpan={7}>Nenhuma movimentação.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-600">Total: {total}</div>
          <div className="flex items-center gap-2">
            <button className="border px-3 py-1 rounded" disabled={page<=1} onClick={()=>carregar(page-1)}>Anterior</button>
            <div className="text-sm">Página {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
            <button className="border px-3 py-1 rounded" disabled={page>=Math.ceil(total/pageSize)} onClick={()=>carregar(page+1)}>Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}