import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { criarManutencao, obterManutencao, atualizarManutencao, anexarArquivos, removerAnexo } from '../../services/manutencoes';
import { listarEquipamentos } from '../../services/equipamentos';
import { useToast } from '../../components/ToastProvider';

function toYMD(v){ if (!v) return null; return String(v).includes('T') ? String(v).split('T')[0] : String(v).slice(0,10); }

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const FILE_BASE = API_BASE.replace(/\/api$/, '');

export default function ManutencaoForm(){
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id_equipamento: '',
    data_inicio: '',
    data_fim: '',
    descricao_problema: '',
    solucao: '',
    tecnico_responsavel: '',
    anexos: [] 
  });

  const [query, setQuery] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [equipSel, setEquipSel] = useState(null);
  const debRef = useRef(null);

  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(()=>{ if(id) load(); },[id]);

  async function load(){
    setLoading(true);
    try{
      const os = await obterManutencao(id);
      let anexos = [];
      try { anexos = os.anexos ? JSON.parse(os.anexos) : []; } catch { anexos = []; }
      setForm({
        id_equipamento: os.id_equipamento,
        data_inicio: toYMD(os.data_inicio) || '',
        data_fim: toYMD(os.data_fim) || '',
        descricao_problema: os.descricao_problema || '',
        solucao: os.solucao || '',
        tecnico_responsavel: os.tecnico_responsavel || '',
        anexos
      });
      setEquipSel({ id: os.id_equipamento, label: `${os.tipo || 'Equip'} ${os.marca || ''} ${os.modelo || ''}`.trim() });
    }catch(e){
      toast.error(e.response?.data?.message || 'Falha ao carregar OS');
      navigate('/manutencoes');
    }finally{ setLoading(false); }
  }

  useEffect(()=>{
    if (id) return;
    clearTimeout(debRef.current);
    if (!query?.trim()) { setSugestoes([]); return; }
    debRef.current = setTimeout(async ()=>{
      const data = await listarEquipamentos({ q: query, pageSize: 8, sortBy: 'id', sortDir: 'desc' });
      setSugestoes(data.items || []);
    }, 300);
    return ()=>clearTimeout(debRef.current);
  },[query, id]);

  function onChange(e){ const { name, value } = e.target; setForm(prev=>({ ...prev, [name]: value })); }

  async function handleSubmit(e){
    e.preventDefault();
    setSaving(true);
    try{
      const payload = {
        id_equipamento: form.id_equipamento,
        data_inicio: toYMD(form.data_inicio),
        data_fim: toYMD(form.data_fim),
        descricao_problema: form.descricao_problema?.trim() || null,
        solucao: form.solucao?.trim() || null,
        tecnico_responsavel: form.tecnico_responsavel?.trim() || null,
        anexos: form.anexos?.length ? JSON.stringify(form.anexos) : null
      };

      if (id){
        await atualizarManutencao(id, payload);
        toast.success('OS atualizada com sucesso.');
        navigate('/manutencoes');
      } else {
        const r = await criarManutencao(payload);
        if (pendingFiles.length) {
          await anexarArquivos(r.id, pendingFiles);
        }
        toast.success('OS criada com sucesso.');
        navigate(`/manutencoes/${r.id}/editar`);
      }
    }catch(e){
      toast.error(e.response?.data?.message || 'Erro ao salvar OS');
    }finally{ setSaving(false); }
  }

  function openFilePicker(){ fileInputRef.current?.click(); }

  async function handleFilesSelected(e){
    const files = e.target.files;
    if (!files || !files.length) return;

    if (id) {
      try {
        const { anexos } = await anexarArquivos(id, files);
        setForm(f => ({ ...f, anexos }));
        toast.success('Anexo(s) enviado(s).');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Falha ao enviar anexos.');
      } finally {
        e.target.value = '';
      }
    } else {
      setPendingFiles(prev => [...prev, ...Array.from(files)]);
      toast.info('Anexo(s) adicionado(s). Serão enviados ao salvar a OS.');
      e.target.value = '';
    }
  }

  async function handleRemoveAnexo(filename){
    if (!id) {
      setPendingFiles(prev => prev.filter(f => f.name !== filename));
      return;
    }
    try {
      const { anexos } = await removerAnexo(id, filename);
      setForm(f => ({ ...f, anexos }));
      toast.success('Anexo removido.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao remover anexo.');
    }
  }

  function isImage(mime){ return /^image\//.test(mime); }
  function isVideo(mime){ return /^video\//.test(mime); }

  if (loading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="p-4">
      {/* CABEÇALHO PADRÃO */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{id ? `Editar OS #${id}` : 'Nova Ordem de Serviço'}</h1>
          <p className="text-sm text-gray-500">Detalhes do reparo e laudo técnico.</p>
        </div>
        <button className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium" onClick={()=>navigate(-1)}>
          Voltar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Equipamento a ser reparado *</label>
            {id ? (
              <input className="w-full border rounded px-3 py-2 bg-gray-50 text-sm" value={equipSel?.label || `#${form.id_equipamento}`} readOnly />
            ) : (
              <div className="relative">
                <input
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                  placeholder="Buscar por tipo, marca, modelo ou patrimônio..."
                  value={query}
                  onChange={e=>{ setQuery(e.target.value); setEquipSel(null); setForm(f=>({...f, id_equipamento:''})); }}
                />
                {!!sugestoes.length && (
                  <ul className="absolute z-10 bg-white border mt-1 rounded w-full max-h-60 overflow-auto shadow-lg">
                    {sugestoes.map(eq => (
                      <li key={eq.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={()=>{ 
                            setEquipSel({ id: eq.id, label: `${eq.tipo} ${eq.marca||''} ${eq.modelo||''}`.trim() });
                            setForm(f=>({ ...f, id_equipamento: eq.id, data_inicio: f.data_inicio || new Date().toISOString().slice(0,10) }));
                            setQuery(`${eq.tipo} ${eq.marca||''} ${eq.modelo||''} (#${eq.id})`);
                            setSugestoes([]); 
                          }}>
                        <span className="font-medium">{eq.tipo}</span> {eq.marca} {eq.modelo} <span className="text-xs text-gray-400">#{eq.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {form.id_equipamento && !id && <div className="text-xs text-green-600 mt-1 font-medium">✓ Equipamento Selecionado</div>}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Início da Manutenção</label>
            <input type="date" name="data_inicio" value={toYMD(form.data_inicio) || ''} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Data de Fim (Conclusão)</label>
            <div className="flex gap-2">
              <input type="date" name="data_fim" value={toYMD(form.data_fim) || ''} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
              {!form.data_fim && (
                <button type="button" className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded text-sm font-medium whitespace-nowrap" onClick={()=>setForm(f=>({...f, data_fim: new Date().toISOString().slice(0,10)}))}>
                  Concluir Hoje
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Técnico Responsável ou Empresa Terceirizada</label>
            <input name="tecnico_responsavel" value={form.tecnico_responsavel} onChange={onChange} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Descrição do Problema (Laudo Inicial)</label>
            <textarea name="descricao_problema" value={form.descricao_problema} onChange={onChange} rows={3} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" placeholder="Relato do problema apresentado..." />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Solução Aplicada (Laudo Final)</label>
            <textarea name="solucao" value={form.solucao} onChange={onChange} rows={3} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" placeholder="Peças trocadas, serviços realizados..." />
          </div>

          {/* ======== ANEXOS ======== */}
          <div className="md:col-span-2 mt-2 p-4 border rounded bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Galeria de Anexos</label>
                <p className="text-xs text-gray-500">Fotos de avarias, notas fiscais ou laudos em PDF.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="border border-gray-300 bg-white hover:bg-gray-100 px-3 py-2 rounded text-sm font-medium flex items-center gap-1" onClick={openFilePicker}>
                  📎 Adicionar
                </button>
                {(pendingFiles.length > 0 && !id) && (
                  <span className="text-xs text-indigo-600 font-medium">{pendingFiles.length} pendente(s)</span>
                )}
              </div>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf" multiple onChange={handleFilesSelected} />

            {form.anexos?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {form.anexos.map(a => (
                  <div key={a.filename} className="border bg-white rounded p-2 flex flex-col gap-2 shadow-sm">
                    {isImage(a.mimetype) ? (
                      <img src={`${FILE_BASE}${a.url}`} alt={a.originalname} className="w-full h-32 object-cover rounded" />
                    ) : isVideo(a.mimetype) ? (
                      <video src={`${FILE_BASE}${a.url}`} controls className="w-full h-32 rounded bg-black" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded text-gray-500 text-xs text-center p-2 break-all">
                        {a.originalname}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-600 truncate max-w-[100px]" title={a.originalname}>{a.originalname}</span>
                      <button type="button" className="text-xs text-red-500 hover:text-red-700 font-medium" onClick={()=>handleRemoveAnexo(a.filename)}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded mt-2">
                Nenhum arquivo anexado a esta OS.
              </div>
            )}
          </div>

        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-2">
          <button type="button" className="border px-4 py-2 rounded text-sm font-medium hover:bg-gray-50" onClick={()=>navigate(-1)}>
            Cancelar
          </button>
          <button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm font-medium" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar OS'}
          </button>
        </div>
      </div>
    </div>
  );
}