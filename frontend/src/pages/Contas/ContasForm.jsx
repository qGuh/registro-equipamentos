import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import * as contasApi from '../../services/contas';

function isAdminUser(user) {
  const p = String(user?.perfil || user?.role || user?.tipo || '').toLowerCase();
  return p === 'admin' || p === 'administrador';
}

export default function ContasForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } 
    catch { return null; }
  }, []);

  const isAdmin = isAdminUser(user);

  const obterConta = contasApi.obterConta || contasApi.default?.obterConta;
  const criarConta = contasApi.criarConta || contasApi.default?.criarConta;
  const atualizarConta = contasApi.atualizarConta || contasApi.default?.atualizarConta;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [colabQuery, setColabQuery] = useState('');
  const [colabOptions, setColabOptions] = useState([]);
  const [colabOpen, setColabOpen] = useState(false);
  const [colabLoading, setColabLoading] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    sistema: '', url: '', login: '', email: '', senha: '',
    categoria: '', colaborador_id: '', status: 'ativo', observacao: '',
  });

  const [showPass, setShowPass] = useState(false);

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setColabOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    let alive = true;
    const term = colabQuery.trim();
    if (!term) { setColabOptions([]); return; }

    const t = setTimeout(async () => {
      try {
        setColabLoading(true);
        const res = await api.get('/colaboradores', { params: { q: term, page: 1, pageSize: 10 } });
        const payload = res.data;
        const items = payload?.items || payload?.data || payload?.rows || (Array.isArray(payload) ? payload : []);
        if (!alive) return;
        setColabOptions(Array.isArray(items) ? items : []);
      } catch {
        if (!alive) return;
        setColabOptions([]);
      } finally {
        if (alive) setColabLoading(false);
      }
    }, 250);

    return () => { alive = false; clearTimeout(t); };
  }, [colabQuery]);

  function pickColaborador(c) {
    setField('colaborador_id', c.id);
    setColabQuery(c.nome);
    setColabOpen(false);
  }

  useEffect(() => {
    async function load() {
      if (!isEdit) return;
      if (!obterConta) { setError('services/contas.js não exporta obterConta.'); return; }
      setLoading(true); setError('');
      try {
        const data = await obterConta(id);
        setForm((p) => ({
          ...p,
          sistema: data?.plataforma ?? data?.sistema ?? '',
          url: data?.url ?? '',
          login: data?.login ?? '',
          email: data?.email ?? '',
          senha: data?.senha ?? '', 
          categoria: data?.categoria ?? '',
          colaborador_id: data?.colaborador_id ?? '',
          status: data?.status ?? 'ativo',
          observacao: data?.observacao ?? '',
        }));
        setColabQuery(data?.colaborador_nome ?? '');
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Erro ao carregar conta.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEdit, obterConta]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isAdmin) { setError('Somente usuário Admin pode salvar/alterar contas.'); return; }
    try {
      setLoading(true);
      const payload = { ...form, colaborador_id: form.colaborador_id || null };
      if (!isEdit) await criarConta(payload);
      else await atualizarConta(id, payload);
      navigate('/contas');
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Erro ao salvar conta.');
    } finally {
      setLoading(false);
    }
  }

  async function copySenha() {
    if (!isAdmin) return;
    try {
      await navigator.clipboard.writeText(form.senha || '');
      alert('Senha copiada!');
    } catch {
      alert('Não foi possível copiar a senha.');
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Conta' : 'Nova Conta de Acesso'}</h1>
          <p className="text-sm text-gray-500">Cadastre acessos de plataformas e e-mails.</p>
        </div>
        <button className="border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium" onClick={() => navigate('/contas')}>
          Voltar
        </button>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Sistema / Serviço *</label>
            <input value={form.sistema} onChange={(e) => setField('sistema', e.target.value)} placeholder="Ex: Gmail, ERP, Asana..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" required />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Categoria</label>
            <input value={form.categoria} onChange={(e) => setField('categoria', e.target.value)} placeholder="Ex: E-mail corporativo, Licença Adobe..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div className="md:col-span-2" ref={dropdownRef}>
            <label className="block text-xs text-gray-600 mb-1">Colaborador Vinculado (Opcional)</label>
            <input value={colabQuery} onChange={(e) => { setColabQuery(e.target.value); setColabOpen(true); setField('colaborador_id', ''); }} onFocus={() => setColabOpen(true)} placeholder="Digite para buscar..." className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
            {colabOpen && (
              <div className="relative">
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded border border-gray-200 bg-white shadow-lg">
                  {colabLoading && <div className="px-3 py-2 text-sm text-gray-500">Buscando...</div>}
                  {!colabLoading && colabOptions.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Nenhum colaborador encontrado.</div>}
                  {colabOptions.map((c) => (
                    <button type="button" key={c.id} onClick={() => pickColaborador(c)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100">
                      <span className="text-gray-900">{c.nome}</span>
                      <span className="text-xs text-gray-500">{c.setor || ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">URL de Acesso</label>
            <input value={form.url} onChange={(e) => setField('url', e.target.value)} placeholder="https://" className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Login / Usuário</label>
            <input value={form.login} onChange={(e) => setField('login', e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">E-mail de Cadastro</label>
            <input value={form.email} onChange={(e) => setField('email', e.target.value)} type="email" className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Senha de Acesso</label>
            <div className="flex gap-2">
              <input type={showPass ? 'text' : 'password'} value={form.senha} onChange={(e) => setField('senha', e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" disabled={!isAdmin} placeholder={!isAdmin ? 'Apenas administradores podem gerenciar senhas.' : ''} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="border border-gray-300 bg-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-50" disabled={!isAdmin}>
                {showPass ? 'Ocultar' : 'Ver'}
              </button>
              <button type="button" onClick={copySenha} className="border border-gray-300 bg-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-50" disabled={!isAdmin}>
                Copiar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-gray-50">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Observações Gerais</label>
            <textarea value={form.observacao} onChange={(e) => setField('observacao', e.target.value)} rows={3} className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-2">
          <button type="button" className="border px-4 py-2 rounded text-sm font-medium hover:bg-gray-50" onClick={() => navigate('/contas')}>
            Cancelar
          </button>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm font-medium" disabled={loading || !isAdmin}>
            {loading ? 'Salvando...' : 'Salvar Conta'}
          </button>
        </div>
      </form>
    </div>
  );
}