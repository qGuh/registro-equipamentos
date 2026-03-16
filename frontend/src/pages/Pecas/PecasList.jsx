import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarPecas, removerPeca, exportarPecasCSV, movimentarPeca } from '../../services/pecas';
import { useToast } from '../../components/ToastProvider';

export default function PecasList(){
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('nome');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(true);

  // modal movimentar
  const [movOpen, setMovOpen] = useState(false);
  const [pecaSel, setPecaSel] = useState(null);
  const [tipo, setTipo] = useState('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');

  const toast = useToast();
  const navigate = useNavigate();

  async function carregar(p=page){
    setLoading(true);
    try{
      const data = await listarPecas({ q, page:p, pageSize, sortBy, sortDir });
      setItems(data.items || []); setTotal(data.total || 0); setPage(data.page || 1);
    }catch(e){ toast.error(e.response?.data?.message || 'Falha ao carregar'); }
    finally{ setLoading(false); }
  }
  useEffect(()=>{ carregar(1); }, [sortBy, sortDir]);

  function ordenar(col){ if (sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortBy(col); setSortDir('asc'); } }

  function abrirMovModal(p){
    setPecaSel(p); setTipo('entrada'); setQuantidade(''); setValor(''); setObservacao('');
    setMovOpen(true);
  }

  async function confirmarMov(){
    try{
      await movimentarPeca(pecaSel.id, {
        tipo,
        quantidade: Number(quantidade),
        valor_unitario: valor ? Number(valor) : null,
        observacao
      });
      toast.success('Movimentação registrada.');
      setMovOpen(false);
      carregar();
    }catch(e){
      toast.error(e.response?.data?.message || 'Falha ao movimentar.');
    }
  }

  async function exportarCsv(){
    try{
      const blob = await exportarPecasCSV({ q, sortBy, sortDir });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'pecas.csv';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }catch{ toast.error('Falha ao exportar CSV'); }
  }

  async function handleRemover(id){
    if (!confirm('Excluir definitivamente esta peça? (bloqueado se tiver movimentações)')) return;
    try{ await removerPeca(id); toast.success('Peça excluída.'); carregar(); }
    catch(e){ toast.error(e.response?.data?.message || 'Falha ao excluir'); }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Peças</h1>
        <div className="flex gap-2">
          <button onClick={exportarCsv} className="border px-4 py-2 rounded">Exportar CSV</button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  onClick={()=>navigate('/pecas/nova')}>Nova Peça</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input className="border rounded px-3 py-2 w-full" placeholder="Buscar por nome, categoria, local..."
               value={q} onChange={e=>setQ(e.target.value)} />
        <button className="border px-4 py-2 rounded" onClick={()=>carregar(1)}>Filtrar</button>
      </div>

      {loading ? <div>Carregando...</div> : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b">
                {[
                  ['id','ID'],['nome','Nome'],['categoria','Categoria'],
                  ['local_armazenamento','Local'],['quantidade','Qtd']
                ].map(([k,l])=>(
                  <th key={k} className="p-3 cursor-pointer select-none" onClick={()=>ordenar(k)}>
                    {l} {sortBy===k ? (sortDir==='asc'?'▲':'▼') : ''}
                  </th>
                ))}
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p=>(
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{p.id}</td>
                  <td className="p-3">{p.nome}</td>
                  <td className="p-3">{p.categoria || '-'}</td>
                  <td className="p-3">{p.local_armazenamento || '-'}</td>
                  <td className="p-3">{p.quantidade ?? 0}</td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-end">
                      <button className="underline" onClick={()=>abrirMovModal(p)}>Movimentar</button>
                      <Link className="underline" to={`/pecas/${p.id}/movimentacoes`}>Histórico</Link>
                      <Link className="underline" to={`/pecas/${p.id}/editar`}>Editar</Link>
                      <button className="text-red-600 underline" onClick={()=>handleRemover(p.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td className="p-4 text-center" colSpan={6}>Nenhuma peça encontrada.</td></tr>}
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

      {/* Modal movimentação */}
      {movOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-[520px] max-w-[95vw] p-6">
            <div className="text-lg font-semibold mb-2">Movimentar — {pecaSel?.nome} (#{pecaSel?.id})</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Tipo</label>
                <select className="w-full border rounded px-3 py-2" value={tipo} onChange={e=>setTipo(e.target.value)}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="ajuste">Ajuste (+/-)</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Quantidade</label>
                <input className="w-full border rounded px-3 py-2" value={quantidade} onChange={e=>setQuantidade(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Valor unitário (opcional)</label>
                <input className="w-full border rounded px-3 py-2" value={valor} onChange={e=>setValor(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Observação</label>
                <textarea className="w-full border rounded px-3 py-2" rows={2} value={observacao} onChange={e=>setObservacao(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="border px-4 py-2 rounded" onClick={()=>setMovOpen(false)}>Cancelar</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" onClick={confirmarMov}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}