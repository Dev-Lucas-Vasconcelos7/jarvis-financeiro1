import { useState } from 'react'
const money = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const date = d => [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')
const offset = n => { const d=new Date(); d.setDate(d.getDate()+n); return date(d) }
const total = rows => rows.reduce((s,x)=>s+(Number(x.value)||0),0)
export default function Future({D}) {
 const [profile,setProfile]=useState('variable'), [income,setIncome]=useState(''), [cost,setCost]=useState(''), [purchase,setPurchase]=useState(''), [parts,setParts]=useState('1')
 const today=offset(0), recent=x=>x.date>=offset(-15)&&x.date<today
 const rev=total(D.services.filter(recent)), exp=total(D.expenses.filter(recent))
 const count=D.services.filter(recent).length+D.expenses.filter(recent).length
 const balance=total(D.services.filter(x=>x.date<=today))-total(D.expenses.filter(x=>x.date<=today))
 const fixed=profile==='fixed'||profile==='mixed', variable=profile!=='fixed'
 const fixedNet=(Math.max(0,Number(income)||0)-Math.max(0,Number(cost)||0))/30
 const daily=(fixed?fixedNet:0)+(variable?(rev-exp)/15:0)
 const payment=Math.max(0,Number(purchase)||0)/Number(parts)
 return <><div className="card"><h3>JARVIS FUTURE · Experimental</h3><p className="mut">Estimativas lineares, não garantias. Saldo registrado = receitas menos despesas registradas, não saldo bancário.</p><label>Perfil <select value={profile} onChange={e=>setProfile(e.target.value)}><option value="variable">Renda variável</option><option value="fixed">Renda fixa</option><option value="mixed">Renda mista</option></select></label>
 {fixed&&<><label>Receita fixa mensal (R$)<input type="number" min="0" value={income} onChange={e=>setIncome(e.target.value)}/></label><label>Despesas fixas mensais (R$)<input type="number" min="0" value={cost} onChange={e=>setCost(e.target.value)}/></label><p className="mut">Valores distribuídos ao longo de 30 dias; não considera vencimentos. No perfil misto, evite duplicar valores do histórico.</p></>}
 {variable&&<p className="mut">{count? 'Base: últimos 15 dias completos, incluindo dias sem lançamentos.':'Sem histórico recente suficiente; componente variável estimado em zero.'}</p>}</div>
 <div className="grid mt">{[7,15,30].map(n=><div className="card" key={n}><small>Saldo registrado projetado · {n} dias</small><b className={balance+daily*n<0?'r':'g'}>{money(balance+daily*n)}</b></div>)}</div>
 <div className="card mt"><h3>Resultado estimado · 15 dias</h3><b>{money(daily*15)}</b><p>Resultado dos 15 dias anteriores: {money(rev-exp)}</p>{balance+daily*15<0?<p className="r">Risco de saldo negativo.</p>:<p className="mut">Projeção não negativa; confira compromissos futuros.</p>}</div>
 <div className="card mt"><h3>Simular compra</h3><label>Valor (R$)<input type="number" min="0" value={purchase} onChange={e=>setPurchase(e.target.value)}/></label><label>Parcelas sem juros<select value={parts} onChange={e=>setParts(e.target.value)}>{[1,3,6,12].map(n=><option key={n} value={n}>{n}</option>)}</select></label><p>Primeiro pagamento: {money(payment)}</p><p>Saldo projetado em 15 dias após primeiro pagamento: {money(balance+daily*15-payment)}</p><small>Não inclui demais parcelas ou juros; não é recomendação de compra.</small></div></>
}
