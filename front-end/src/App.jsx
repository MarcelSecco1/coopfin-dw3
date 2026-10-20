import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { contasApi, lancamentosApi, login } from './api.js';

const storedSession = () => {
  try { return JSON.parse(localStorage.getItem('coopfin-session') || 'null'); } catch { return null; }
};
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const dateLabel = (value) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h2"/><path d="M7 5V3h10v2"/></>,
    arrow: <><path d="M7 7h11v11"/><path d="M18 7 6 19"/><path d="M7 11v8h8"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    exit: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.8 5Z"/></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await onLogin(username, password); } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="login-layout">
    <section className="login-brand">
      <div className="brand-mark"><span className="brand-symbol">c</span><span>coopfin</span></div>
      <div className="brand-copy"><div className="eyebrow light"><span className="eyebrow-dot"/> FINANÇAS EM EQUILÍBRIO</div><h1>Um jeito mais claro de cuidar do que é de todos.</h1><p>Organize contas e acompanhe os movimentos da sua cooperativa em um só lugar.</p></div>
      <div className="login-foot"><span>GESTÃO FINANCEIRA COOPERATIVA</span><span>01 — 02</span></div>
      <div className="brand-orbit orbit-one"/><div className="brand-orbit orbit-two"/><div className="brand-orbit orbit-three"/>
    </section>
    <section className="login-panel"><div className="login-form-wrap">
      <div className="mobile-brand brand-mark"><span className="brand-symbol">c</span><span>coopfin</span></div>
      <div className="eyebrow"><span className="eyebrow-dot"/> ÁREA DO COOPERADO</div>
      <h2>Bem-vindo de volta.</h2><p className="login-subtitle">Entre com seus dados para acessar o financeiro.</p>
      <form className="login-form" onSubmit={submit}>
        <label>Usuário<input autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Seu usuário" required autoFocus/></label>
        <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required/></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button button-primary login-submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}<Icon name="chevron" size={18}/></button>
      </form>
      <div className="secure-note"><span className="secure-lock">✓</span> Acesso seguro e protegido</div>
    </div><div className="login-legal">COOPFIN <span>•</span> CONTROLE FINANCEIRO</div></section>
  </main>;
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => { const close = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-heading"><div><span className="eyebrow">FINANCEIRO</span><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><Icon name="close"/></button></div>{children}
  </section></div>;
}

function App() {
  const [session, setSession] = useState(storedSession);
  const [page, setPage] = useState('overview');
  const [contas, setContas] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [greeting, setGreeting] = useState(getGreeting);

  const logout = useCallback(() => { localStorage.removeItem('coopfin-session'); setSession(null); setContas([]); setLancamentos([]); }, []);
  const refresh = useCallback(async () => {
    if (!session?.token) return;
    setLoading(true); setError('');
    try {
      const [accountRows, entryRows] = await Promise.all([contasApi.getAll(session.token), lancamentosApi.getAll(session.token)]);
      setContas(accountRows); setLancamentos(entryRows);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setError(''); }, [page]);
  useEffect(() => { setFormError(''); }, [modal]);
  useEffect(() => { window.addEventListener('auth:expired', logout); return () => window.removeEventListener('auth:expired', logout); }, [logout]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(timer);
  }, []);

  async function handleLogin(username, password) {
    const result = await login(username, password);
    localStorage.setItem('coopfin-session', JSON.stringify(result)); setSession(result);
  }

  const summary = useMemo(() => {
    const paidIn = lancamentos.filter(item => item.status === 'pago' && item.natureza === 'entrada').reduce((sum, item) => sum + Number(item.valor), 0);
    const paidOut = lancamentos.filter(item => item.status === 'pago' && item.natureza === 'saida').reduce((sum, item) => sum + Number(item.valor), 0);
    const pending = lancamentos.filter(item => item.status === 'pendente' && item.natureza === 'entrada').reduce((sum, item) => sum + Number(item.valor), 0);
    const balance = contas.reduce((sum, item) => sum + Number(item.saldoInicial), 0) + paidIn - paidOut;
    return { paidIn, pending, balance };
  }, [contas, lancamentos]);

  async function saveRecord(event) {
    event.preventDefault(); if (!modal) return;
    setSaving(true);
    const api = modal.kind === 'conta' ? contasApi : lancamentosApi;
    try {
      if (modal.record?.id) await api.update(modal.record.id, modal.payload, session.token);
      else await api.insert(modal.payload, session.token);
      setModal(null); setToast(modal.record ? 'Alterações salvas.' : 'Cadastro realizado.'); await refresh();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  }

  async function openEdit(kind, record) {
    try {
      const current = await (kind === 'conta' ? contasApi : lancamentosApi).getById(record.id, session.token);
      setModal({ kind, record: current });
    } catch (e) { await refresh(); setError(e.message); }
  }

  async function deleteRecord(kind, record) {
    const label = kind === 'conta' ? 'conta' : 'lançamento';
    const linkedEntries = kind === 'conta' ? lancamentos.filter(item => item.contaId === record.id).length : 0;
    const warning = linkedEntries ? ` ${linkedEntries === 1 ? 'O lançamento dela também será removido.' : `Os ${linkedEntries} lançamentos dela também serão removidos.`}` : '';
    if (!window.confirm(`Remover ${label} “${kind === 'conta' ? record.nome : record.descricao}”?${warning}`)) return;
    try {
      await (kind === 'conta' ? contasApi : lancamentosApi).remove(record.id, session.token);
      setToast('Registro removido.'); await refresh();
    } catch (e) { setError(e.message); }
  }

  if (!session?.token) return <LoginScreen onLogin={handleLogin}/>;

  const recent = [...lancamentos].slice(0, 5);
  const filteredEntries = lancamentos.filter(item => `${item.descricao} ${item.contaNome} ${item.status}`.toLowerCase().includes(search.toLowerCase()));
  const filteredAccounts = contas.filter(item => `${item.nome} ${item.instituicao} ${item.tipo}`.toLowerCase().includes(search.toLowerCase()));
  const typeNames = { corrente: 'Conta corrente', poupanca: 'Poupança', caixa: 'Caixa', investimento: 'Investimentos' };

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand-mark sidebar-brand" href="#inicio" onClick={e => { e.preventDefault(); setPage('overview'); }}><span className="brand-symbol">c</span><span>coopfin</span></a>
      <div className="workspace-switch"><div className="workspace-icon">C</div><div><strong>Cooperativa</strong><span>Gestão financeira</span></div><span className="workspace-caret">⌄</span></div>
      <div className="nav-label">VISÃO GERAL</div><button className={`nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => setPage('overview')}><Icon name="grid"/> Painel</button>
      <div className="nav-label nav-label-spaced">GESTÃO FINANCEIRA</div>
      <button className={`nav-item ${page === 'entries' ? 'active' : ''}`} onClick={() => setPage('entries')}><Icon name="arrow"/> Lançamentos<span className="nav-count">{lancamentos.length}</span></button>
      <button className={`nav-item ${page === 'accounts' ? 'active' : ''}`} onClick={() => setPage('accounts')}><Icon name="wallet"/> Contas</button>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-mark">?</div><strong>Precisa de ajuda?</strong><span>Seu financeiro, sem complicação.</span></div><button className="user-row" onClick={logout}><div className="avatar">{session.user?.username?.slice(0, 1).toUpperCase() || 'A'}</div><div className="user-info"><strong>{session.user?.username || 'Administrador'}</strong><span>Administrador</span></div><Icon name="exit" size={17}/></button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumb"><span>Financeiro</span><Icon name="chevron" size={15}/><strong>{page === 'overview' ? 'Painel' : page === 'entries' ? 'Lançamentos' : 'Contas'}</strong></div><div className="topbar-right"><span className="today-label"><Icon name="calendar" size={16}/>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span><div className="avatar avatar-small">{session.user?.username?.slice(0, 1).toUpperCase() || 'A'}</div></div></header>
      <div className="page-content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> SEU RESUMO FINANCEIRO</div><h1>{page === 'overview' ? `${greeting}, ${session.user?.username || 'cooperado'}.` : page === 'entries' ? 'Lançamentos' : 'Contas financeiras'}<span className="heading-period">{page === 'overview' ? 'Aqui está o panorama da sua cooperativa.' : page === 'entries' ? 'Acompanhe entradas e saídas da cooperativa.' : 'Organize os recursos da cooperativa.'}</span></h1></div><div className="heading-actions">{page === 'accounts' && <button className="button button-primary" onClick={() => setModal({ kind: 'conta' })}><Icon name="plus" size={18}/> Nova conta</button>}{page === 'entries' && <button className="button button-primary" onClick={() => setModal({ kind: 'lancamento' })}><Icon name="plus" size={18}/> Novo lançamento</button>}{page === 'overview' && <button className="button button-primary" onClick={() => setModal({ kind: 'lancamento' })}><Icon name="plus" size={18}/> Novo lançamento</button>}</div></div>
      {error && <div className="notice-error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Fechar aviso"><Icon name="close" size={16}/></button></div>}
      {page === 'overview' && <>
        <section className="metric-grid"><Metric label="Saldo em contas" value={money(summary.balance)} detail="Saldo inicial + entradas − saídas" icon="wallet" tone="green"/><Metric label="Entradas pagas" value={money(summary.paidIn)} detail="Recebimentos confirmados" icon="arrow" tone="blue"/><Metric label="A receber" value={money(summary.pending)} detail="Entradas pendentes" icon="calendar" tone="amber"/><Metric label="Contas ativas" value={String(contas.length).padStart(2, '0')} detail="Contas cadastradas" icon="grid" tone="lilac"/></section>
        <section className="overview-grid"><div className="panel recent-panel"><div className="panel-heading"><div><h2>Movimentações recentes</h2><p>Últimos lançamentos registrados</p></div><button className="text-button" onClick={() => setPage('entries')}>Ver todos <Icon name="chevron" size={15}/></button></div><EntryTable entries={recent} loading={loading} onEdit={record => openEdit('lancamento', record)} onDelete={record => deleteRecord('lancamento', record)}/></div>
          <div className="panel accounts-panel"><div className="panel-heading"><div><h2>Suas contas</h2><p>{contas.length} contas ativas</p></div><button className="icon-button subtle" onClick={() => setPage('accounts')} aria-label="Ver contas"><Icon name="chevron"/></button></div>{contas.length === 0 ? <EmptyState title="Nenhuma conta cadastrada" text="Cadastre uma conta para começar." action="Adicionar conta" onAction={() => setModal({ kind: 'conta' })}/> : <div className="account-list">{contas.slice(0, 4).map(account => <div className="account-row" key={account.id}><div className="account-icon"><Icon name="wallet" size={18}/></div><div className="account-main"><strong>{account.nome}</strong><span>{typeNames[account.tipo]}{account.instituicao ? ` · ${account.instituicao}` : ''}</span></div><strong className="account-balance">{money(account.saldoInicial)}</strong></div>)}</div>}<button className="add-account" onClick={() => setModal({ kind: 'conta' })}><Icon name="plus" size={17}/> Adicionar conta</button></div></section>
        <div className="bottom-note"><div className="note-check"><Icon name="check" size={15}/></div><span>Seus dados estão sincronizados com segurança.</span><span className="note-divider"/> Atualizado agora</div>
      </>}
      {page === 'entries' && <section className="panel list-panel"><div className="panel-heading table-heading"><div><h2>Todos os lançamentos</h2><p>{filteredEntries.length} registros encontrados</p></div><div className="search-box"><Icon name="search" size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lançamento" aria-label="Buscar lançamento"/></div></div><EntryTable entries={filteredEntries} loading={loading} onEdit={record => openEdit('lancamento', record)} onDelete={record => deleteRecord('lancamento', record)}/></section>}
      {page === 'accounts' && <section className="panel list-panel"><div className="panel-heading table-heading"><div><h2>Todas as contas</h2><p>{filteredAccounts.length} contas encontradas</p></div><div className="search-box"><Icon name="search" size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conta" aria-label="Buscar conta"/></div></div>{filteredAccounts.length === 0 && !loading ? <EmptyState title="Nenhuma conta encontrada" text="Cadastre sua primeira conta financeira." action="Adicionar conta" onAction={() => setModal({ kind: 'conta' })}/> : <div className="account-cards">{filteredAccounts.map(account => <article className="account-card" key={account.id}><div className="account-card-top"><div className="account-icon"><Icon name="wallet"/></div><span className="type-pill">{typeNames[account.tipo]}</span></div><h3>{account.nome}</h3><p>{account.instituicao || 'Sem instituição informada'}</p><strong>{money(account.saldoInicial)}</strong><div className="row-actions"><button onClick={() => openEdit('conta', account)}><Icon name="edit" size={16}/> Editar</button><button className="danger-action" onClick={() => deleteRecord('conta', account)}><Icon name="trash" size={16}/> Remover</button></div></article>)}</div>}</section>}
    </div><footer className="page-footer"><span>COOPFIN <span className="footer-dot">•</span> FINANÇAS COOPERATIVAS</span><span>DESENVOLVIDO PARA CUIDAR DO QUE É DE TODOS</span></footer></main>
    {modal && <RecordModal key={`${modal.kind}-${modal.record?.id || 'new'}`} modal={modal} contas={contas} onClose={() => setModal(null)} onSave={saveRecord} saving={saving} error={formError}/>}
    {toast && <div className="toast" role="status"><span className="toast-check"><Icon name="check" size={16}/></span>{toast}</div>}
  </div>;
}

function Metric({ label, value, detail, icon, tone }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon name={icon} size={18}/></span></div><strong className="metric-value">{value}</strong><span className="metric-detail"><i/> {detail}</span></article>;
}

function EntryTable({ entries, loading, onEdit, onDelete }) {
  return <div className="table-wrap"><table className="entries-table"><thead><tr><th>DESCRIÇÃO</th><th>CONTA</th><th>DATA</th><th>VALOR</th><th>STATUS</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
    {loading ? <tr><td className="table-empty" colSpan="6">Carregando registros…</td></tr> : entries.length === 0 ? <tr><td className="table-empty" colSpan="6">Nenhum lançamento por aqui.</td></tr> : entries.map(entry => <tr key={entry.id}><td><div className="entry-name"><span className={`entry-type-mark ${entry.natureza}`}><Icon name="arrow" size={16}/></span><div><strong>{entry.descricao}</strong><span>{entry.natureza === 'entrada' ? 'Entrada' : 'Saída'} · #{String(entry.id).padStart(4, '0')}</span></div></div></td><td>{entry.contaNome}</td><td className="date-cell">{dateLabel(entry.data)}</td><td className={`value-cell ${entry.natureza}`}>{entry.natureza === 'saida' ? '− ' : '+ '}{money(entry.valor)}</td><td><span className={`status-pill ${entry.status}`}>{entry.status === 'pago' ? 'Pago' : 'Pendente'}</span></td><td><div className="table-actions"><button aria-label="Editar lançamento" onClick={() => onEdit(entry)}><Icon name="edit" size={16}/></button><button aria-label="Remover lançamento" onClick={() => onDelete(entry)}><Icon name="trash" size={16}/></button></div></td></tr>)}
  </tbody></table></div>;
}

function EmptyState({ title, text, action, onAction }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name="wallet" size={23}/></div><h3>{title}</h3><p>{text}</p>{action && <button className="button button-secondary" onClick={onAction}><Icon name="plus" size={17}/>{action}</button>}</div>;
}

function RecordModal({ modal, contas, onClose, onSave, saving, error }) {
  const isAccount = modal.kind === 'conta';
  const record = modal.record;
  const [form, setForm] = useState(isAccount ? {
    nome: record?.nome || '', tipo: record?.tipo || 'corrente', instituicao: record?.instituicao || '', saldoInicial: record?.saldoInicial ?? '',
  } : {
    descricao: record?.descricao || '', valor: record?.valor || '', natureza: record?.natureza || 'entrada', data: record?.data || today(), contaId: record?.contaId || contas[0]?.id || '', status: record?.status || 'pendente',
  });
  function update(event) { setForm(current => ({ ...current, [event.target.name]: event.target.value })); }
  return <Modal title={`${record ? 'Editar' : 'Nova'} ${isAccount ? 'conta' : 'movimentação'}`} subtitle={isAccount ? 'Preencha os dados da conta financeira.' : 'Registre uma entrada ou compromisso financeiro.'} onClose={onClose}>
    <form className="record-form" onSubmit={event => { event.preventDefault(); modal.payload = isAccount ? { ...form, saldoInicial: Number(form.saldoInicial || 0) } : { ...form, valor: Number(form.valor), contaId: Number(form.contaId) }; onSave(event); }}>
      {isAccount ? <><label>Nome da conta<input name="nome" value={form.nome} onChange={update} placeholder="Ex.: Conta movimento" required maxLength="120" autoFocus/></label><div className="form-grid"><label>Tipo<select name="tipo" value={form.tipo} onChange={update}><option value="corrente">Conta corrente</option><option value="poupanca">Poupança</option><option value="caixa">Caixa</option><option value="investimento">Investimentos</option></select></label><label>Saldo inicial<input name="saldoInicial" type="number" step="0.01" value={form.saldoInicial} onChange={update} placeholder="0,00" required/></label></div><label>Instituição financeira<input name="instituicao" value={form.instituicao} onChange={update} placeholder="Ex.: Banco Cooperativo" maxLength="120"/></label></>
      : <><label>Descrição<input name="descricao" value={form.descricao} onChange={update} placeholder="Ex.: Mensalidade cooperativa" required maxLength="180" autoFocus/></label><div className="form-grid"><label>Natureza<select name="natureza" value={form.natureza} onChange={update}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label><label>Valor<input name="valor" type="number" min="0.01" step="0.01" value={form.valor} onChange={update} placeholder="0,00" required/></label></div><div className="form-grid"><label>Data<input name="data" type="date" value={form.data} onChange={update} required/></label><label>Status<select name="status" value={form.status} onChange={update}><option value="pendente">Pendente</option><option value="pago">Pago</option></select></label></div><label>Conta financeira<select name="contaId" value={form.contaId} onChange={update} required disabled={!contas.length}><option value="">Selecione uma conta</option>{contas.map(account => <option value={account.id} key={account.id}>{account.nome}</option>)}</select></label>{!contas.length && <div className="inline-hint">Cadastre uma conta financeira antes de adicionar lançamentos.</div>}</>}
      {error && <div className="form-error" role="alert">{error}</div>}<div className="modal-footer"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving || (!isAccount && !contas.length)}>{saving ? 'Salvando…' : record ? 'Salvar alterações' : 'Salvar registro'}</button></div>
    </form>
  </Modal>;
}

export default App;
