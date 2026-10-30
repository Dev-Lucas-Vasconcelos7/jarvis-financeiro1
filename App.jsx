import { useState, useEffect } from 'react'
const R = n => (n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pad = n => String(n).padStart(2, '0')
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
const TD = iso(new Date()), MN = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const sum = a => a.reduce((s, x) => s + x.value, 0), fd = d => d.split('-').reverse().join('/')
const num = s => { s = String(s ?? '').trim().replace(/[^\d.,]/g, ''); if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); return parseFloat(s) }
async function api(p, m = 'GET', b) {
  const r = await fetch('/api/' + p, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(j.error || 'Erro de conexão'), { status: r.status })
  return j
}
function stats(D, m) {
  const s = D.services.filter(x => x.date.startsWith(m)), e = D.expenses.filter(x => x.date.startsWith(m)), days = {}
  s.forEach(x => days[x.date] = (days[x.date] || 0) + x.value)
  const ds = Object.entries(days).sort((a, b) => b[1] - a[1]), rev = sum(s), exp = sum(e)
  return { s, e, rev, exp, days, nd: ds.length, best: ds[0], avg: ds.length ? rev / ds.length : 0, profit: rev - exp }
}
const lastMonths = k => { const d = new Date(); return Array.from({ length: k }, (_, i) => iso(new Date(d.getFullYear(), d.getMonth() - (k - 1 - i), 1)).slice(0, 7)) }
function Bars({ items, two }) {
  const W = 600, H = 150, mx = Math.max(1, ...items.map(i => Math.max(i.v, i.v2 || 0))), bw = W / items.length
  return <svg viewBox={`0 0 ${W} ${H + 22}`}>{items.map((i, k) => { const x = k * bw, h = i.v / mx * H, h2 = (i.v2 || 0) / mx * H
    return <g key={k}><rect x={x + bw * .15} y={H - h} width={bw * (two ? .35 : .7)} height={h} rx="2" fill="#22d3ee" opacity=".85" />
      {two && <rect x={x + bw * .5} y={H - h2} width={bw * .35} height={h2} rx="2" fill="#f87171" opacity=".8" />}
      <text x={x + bw / 2} y={H + 15} fontSize={items.length > 12 ? 8 : 11} fill="#7b8fb5" textAnchor="middle">{i.l}</text></g> })}</svg>
}
function Cal({ m, days }) {
  const [y, mo] = m.split('-').map(Number), f = new Date(y, mo - 1, 1).getDay(), n = new Date(y, mo, 0).getDate()
  return <div className="cal">{'DSTQQSS'.split('').map((x, i) => <div className="h" key={'h' + i}>{x}</div>)}
    {Array.from({ length: f }, (_, i) => <div key={'f' + i} style={{ visibility: 'hidden' }} />)}
    {Array.from({ length: n }, (_, i) => { const v = days[m + '-' + pad(i + 1)]; return <div key={i} className={v ? 'w' : ''}>{i + 1}{v ? <em>{Math.round(v)}</em> : null}</div> })}</div>
}
function Painel({ D }) {
  const m = TD.slice(0, 7), st = stats(D, m), y = TD.slice(0, 4), yr = sum(D.services.filter(x => x.date.startsWith(y)))
  const day = sum(D.services.filter(x => x.date === TD)), pc = D.goal ? Math.min(100, st.rev / D.goal * 100) : 0
  const [yy, mm] = m.split('-').map(Number), nd = new Date(yy, mm, 0).getDate()
  const dd = Array.from({ length: nd }, (_, i) => ({ l: i + 1, v: st.days[m + '-' + pad(i + 1)] || 0 }))
  const cm = lastMonths(6).map(q => { const t = stats(D, q); return { l: MN[+q.slice(5) - 1], v: t.rev, v2: t.exp } })
  const K = ({ l, v, c }) => <div className="card"><small>{l}</small><b className={c}>{v}</b></div>
  return <>
    <div className="grid"><K l="Hoje" v={R(day)} c="c" /><K l="Mês" v={R(st.rev)} /><K l="Ano" v={R(yr)} /><K l="Média / dia trabalhado" v={R(st.avg)} />
      <K l="Serviços no mês" v={st.s.length} /><K l="Dias trabalhados" v={st.nd} /><K l="Despesas no mês" v={R(st.exp)} c="r" /><K l="Lucro real" v={R(st.profit)} c={st.profit < 0 ? 'r' : 'g'} /></div>
    <div className="card"><h3>Meta mensal</h3>{D.goal ? <><div className="bar"><i style={{ width: pc + '%' }} /></div>{pc.toFixed(0)}% de {R(D.goal)} — {st.rev >= D.goal ? <b className="g">meta atingida!</b> : <>faltam <b className="c">{R(D.goal - st.rev)}</b></>}</> : <span className="mut">Defina sua meta na aba Metas.</span>}</div>
    <div className="card mt"><h3>Faturamento diário — {MN[mm - 1]}</h3><Bars items={dd} /></div>
    <div className="card mt"><h3>Faturamento <span className="c">■</span> × despesas <span className="r">■</span> (6 meses)</h3><Bars items={cm} two /></div>
    <div className="card mt"><h3>Calendário de serviços</h3><Cal m={m} days={st.days} /></div></>
}
function Servicos({ D, act }) {
  const [msg, setMsg] = useState('')
  const send = (kind) => async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)), val = num(v.value), f = e.target
    if (!(val > 0) || !v.date || !(v.name || v.descr || '').trim()) return setMsg('Preencha nome, data e um valor válido (ex.: 250 ou 250,50).')
    try { await act[kind]({ ...v, value: val }); setMsg(''); f.reset() } catch (x) { setMsg(x.message) }
  }
  const rows = [...D.services.map(x => ({ ...x, k: 'service' })), ...D.expenses.map(x => ({ ...x, name: x.descr, pay: 'despesa', k: 'expense' }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60)
  return <>
    <div className="card"><h3>Novo serviço</h3><form onSubmit={send('addS')} noValidate>
      <input name="name" placeholder="Serviço" /><input name="date" type="date" defaultValue={TD} />
      <input name="value" inputMode="decimal" placeholder="Valor R$ (ex.: 250,00)" />
      <select name="pay"><option>Pix</option><option>Dinheiro</option><option>Cartão</option><option>Transferência</option></select>
      <input name="note" placeholder="Observação" /><button className="btn pri">Registrar</button></form></div>
    <div className="card mt"><h3>Nova despesa</h3><form onSubmit={send('addE')} noValidate>
      <input name="descr" placeholder="Despesa" /><input name="date" type="date" defaultValue={TD} />
      <input name="value" inputMode="decimal" placeholder="Valor R$ (ex.: 40,00)" /><button className="btn pri">Lançar</button></form></div>
    {msg && <div className="card mt r">{msg}</div>}
    <div className="card mt"><h3>Histórico</h3><div className="sc"><table><thead><tr><th>Data</th><th>Item</th><th>Valor</th><th>Pagto</th><th /></tr></thead><tbody>
      {rows.map(x => <tr key={x.k + x.id}><td>{fd(x.date)}</td><td>{x.name}{x.note ? <span className="mut"> · {x.note}</span> : null}</td>
        <td className={x.k === 'expense' ? 'r' : 'g'}>{x.k === 'expense' ? '−' : ''}{R(x.value)}</td><td>{x.pay}</td>
        <td><button className="btn" onClick={() => act.del(x.k, x.id)}>✕</button></td></tr>)}
      {!rows.length && <tr><td colSpan="5" className="mut">Nenhum registro ainda.</td></tr>}</tbody></table></div></div></>
}
function Metas({ D, act }) {
  const st = stats(D, TD.slice(0, 7))
  return <div className="card"><h3>Meta mensal de faturamento</h3>
    <form onSubmit={e => { e.preventDefault(); act.goal(num(new FormData(e.target).get('goal')) || 0) }}>
      <input name="goal" inputMode="decimal" defaultValue={D.goal || ''} placeholder="R$ por mês" /><button className="btn pri">Salvar meta</button></form>
    {D.goal > 0 && <><div className="bar"><i style={{ width: Math.min(100, st.rev / D.goal * 100) + '%' }} /></div>Faltam <b className="c">{R(Math.max(0, D.goal - st.rev))}</b> este mês.</>}</div>
}
function Relat({ D }) {
  const [mon, setMon] = useState(TD.slice(0, 7)), st = stats(D, mon)
  const K = ({ l, v, c }) => <div className="card"><small>{l}</small><b className={c}>{v}</b></div>
  return <><div className="card"><h3>Relatório mensal</h3><input type="month" value={mon} onChange={e => setMon(e.target.value || mon)} /></div>
    <div className="grid"><K l="Faturamento" v={R(st.rev)} /><K l="Despesas" v={R(st.exp)} c="r" /><K l="Lucro real" v={R(st.profit)} c={st.profit < 0 ? 'r' : 'g'} />
      <K l="Média diária" v={R(st.avg)} /><K l="Melhor dia" v={st.best ? fd(st.best[0]) + ' · ' + R(st.best[1]) : '—'} /><K l="Serviços / dias" v={st.s.length + ' / ' + st.nd} /></div>
    <div className="card mt"><h3>Histórico dos serviços</h3><div className="sc"><table><tbody>
      {[...st.s].sort((a, b) => a.date.localeCompare(b.date)).map(x => <tr key={x.id}><td>{fd(x.date)}</td><td>{x.name}</td><td className="g">{R(x.value)}</td><td>{x.pay}</td></tr>)}
      {!st.s.length && <tr><td className="mut">Sem serviços neste mês.</td></tr>}</tbody></table></div></div></>
}
function IA({ D, act }) {
  const [log, setLog] = useState([{ j: 1, t: 'Às suas ordens. Digite ou fale um comando.' }]), [pend, setPend] = useState(null), [q, setQ] = useState('')
  const say = t => { setLog(l => [...l, { j: 1, t }]); try { const u = new SpeechSynthesisUtterance(t); u.lang = 'pt-BR'; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch {} }
  const price = /(?:por\s*)?(?:r\$\s*)?\d+(?:[.,]\d+)*\s*(?:reais)?/i
  const run = raw => {
    setLog(l => [...l, { t: raw }])
    const t = raw.trim().replace(/^jarvis[,:]?\s*/i, ''), low = t.toLowerCase()
    const m = t.match(/r\$\s*(\d+(?:[.,]\d+)*)/i) || t.match(/(\d+(?:[.,]\d+)*)\s*(?:reais)?\s*$/i) || t.match(/(\d+(?:[.,]\d+)*)/), v = m ? num(m[1]) : 0
    const dt = /ontem/.test(low) ? iso(new Date(Date.now() - 864e5)) : TD
    if (/relat[oó]rio|resumo/.test(low)) { const s = stats(D, TD.slice(0, 7)); say(`Faturamento do mês: ${R(s.rev)}. Despesas: ${R(s.exp)}. Lucro real: ${R(s.profit)}. ${s.nd} dias trabalhados, ${s.s.length} serviços, média de ${R(s.avg)} por dia.` + (D.goal ? ` Faltam ${R(Math.max(0, D.goal - s.rev))} para a meta.` : '')) }
    else if (/meta/.test(low) && v) { act.goal(v).then(() => say(`Meta mensal definida em ${R(v)}.`)).catch(e => say(e.message)) }
    else if (/gastei|despesa|paguei|comprei/.test(low) && v) { const d = t.replace(/^(gastei|paguei|comprei|registrei uma despesa( de)?)\s*/i, '').replace(price, '').replace(/\b(ontem|hoje)\b/gi, '').replace(/^\s*(com|em|de|no|na)\s+/i, '').replace(/\s+/g, ' ').trim() || 'Despesa'; setPend({ k: 'addE', descr: d, value: v, date: dt }); say(`Despesa: ${d}, ${R(v)}, em ${fd(dt)}. Posso lançar?`) }
    else if (v) { const pay = /pix/.test(low) ? 'Pix' : /dinheiro/.test(low) ? 'Dinheiro' : /cart[aã]o/.test(low) ? 'Cartão' : 'Pix'
      let n = t.replace(/^(registrei|fiz|realizei|concluí|conclui|lancei)\s*(um|uma|o|a)?\s*/i, '').replace(price, '').replace(/\b(?:no|via|em|com)?\s*(?:pix|dinheiro|cart[aã]o)\b/gi, '').replace(/\b(ontem|hoje|por)\b/gi, '').replace(/\s+/g, ' ').trim()
      n = n ? n[0].toUpperCase() + n.slice(1) : 'Serviço'; setPend({ k: 'addS', name: n, value: v, date: dt, pay, note: '' }); say(`Serviço: ${n}, ${R(v)}, ${pay}, em ${fd(dt)}. Confirma o lançamento?`) }
    else say('Não entendi o comando. Tente: “registrei uma formatação por R$ 80”.')
  }
  const ok = async yes => { const p = pend; setPend(null); if (!yes) return say('Cancelado.'); try { await act[p.k](p); say('Lançado com sucesso.') } catch (e) { say('Não consegui lançar: ' + e.message) } }
  const mic = () => { const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return say('Reconhecimento de voz não suportado neste navegador.'); const r = new SR(); r.lang = 'pt-BR'; r.onresult = e => run(e.results[0][0].transcript); r.start() }
  return <div className="card"><h3>JARVIS IA</h3><div className="chat">{log.map((l, i) => <p key={i} className={l.j ? 'j' : ''}>{l.t}</p>)}</div>
    {pend && <div className="row" style={{ marginBottom: 8 }}><button className="btn pri" onClick={() => ok(true)}>Confirmar</button><button className="btn" onClick={() => ok(false)}>Cancelar</button></div>}
    <form className="row" style={{ display: 'flex' }} onSubmit={e => { e.preventDefault(); if (q.trim()) { run(q); setQ('') } }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="JARVIS, registrei uma montagem de hardware por R$ 250" /><button className="btn pri">Enviar</button><button type="button" className="btn" onClick={mic}>🎙</button></form>
    <div className="mut" style={{ fontSize: 12 }}>Exemplos: “gastei R$ 40 com cabo”, “meta de 5000”, “relatório”.</div></div>
}
function Auth({ onIn }) {
  const [reg, setReg] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const go = async e => { e.preventDefault(); setBusy(true); setErr(''); const v = Object.fromEntries(new FormData(e.target))
    try { await api('auth?a=' + (reg ? 'register' : 'login'), 'POST', v); onIn(v.email) } catch (x) { setErr(x.message) } setBusy(false) }
  return <div className="lock card"><span className="logo">JARVIS</span><div className="mut">{reg ? 'Crie sua conta' : 'Entre na sua conta'}</div>
    <form onSubmit={go} noValidate><input name="email" type="email" placeholder="E-mail" autoComplete="email" /><input name="password" type="password" placeholder="Senha (mín. 6 caracteres)" autoComplete={reg ? 'new-password' : 'current-password'} />
      <button className="btn pri" disabled={busy}>{busy ? 'Aguarde…' : reg ? 'Criar conta e entrar' : 'Entrar'}</button></form>
    <div className="r">{err}</div><button className="link" onClick={() => { setReg(!reg); setErr('') }}>{reg ? 'Já tenho conta' : 'Criar minha conta'}</button></div>
}
export default function App() {
  const [user, setUser] = useState(undefined), [D, setD] = useState({ services: [], expenses: [], goal: 0 }), [tab, setTab] = useState('painel'), [err, setErr] = useState('')
  const load = () => api('data').then(setD).catch(e => { if (e.status === 401) setUser(null); else setErr(e.message) })
  useEffect(() => { api('auth?a=me').then(u => setUser(u.email)).catch(() => setUser(null)) }, [])
  useEffect(() => { if (user) load() }, [user])
  const wrap = fn => async (...a) => { try { setErr(''); const r = await fn(...a); await load(); return r } catch (e) { if (e.status === 401) setUser(null); setErr(e.message); throw e } }
  const act = {
    addS: wrap(v => api('data?a=service', 'POST', v)), addE: wrap(v => api('data?a=expense', 'POST', v)),
    goal: wrap(g => api('data?a=goal', 'PUT', { goal: g })), del: wrap((k, id) => api(`data?t=${k}&i=${id}`, 'DELETE')) }
  if (user === undefined) return <div className="wrap mut">Carregando…</div>
  if (!user) return <Auth onIn={setUser} />
  const T = [['painel', 'Painel'], ['servicos', 'Serviços'], ['metas', 'Metas'], ['relat', 'Relatórios'], ['ia', 'JARVIS IA']]
  return <div className="wrap"><div className="top"><span className="logo">JARVIS</span><span className="mut">{user}</span>
    <button className="btn" onClick={() => api('auth?a=logout', 'POST').then(() => setUser(null))}>Sair</button></div>
    <div className="nav">{T.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    {err && <div className="card r" style={{ marginBottom: 10 }}>{err}</div>}
    {tab === 'painel' && <Painel D={D} />}{tab === 'servicos' && <Servicos D={D} act={act} />}{tab === 'metas' && <Metas D={D} act={act} />}
    {tab === 'relat' && <Relat D={D} />}{tab === 'ia' && <IA D={D} act={act} />}</div>
}
