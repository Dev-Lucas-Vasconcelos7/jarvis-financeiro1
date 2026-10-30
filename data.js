import { sql, uid } from './_lib.js'
export default async function handler(req, res) {
  const id = uid(req)
  if (!id) return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' })
  const b = req.body || {}, a = req.query.a
  try {
    if (req.method === 'GET') {
      const [services, expenses, goals] = await Promise.all([
        sql`select id, name, date::text as date, value::float as value, pay, note from services where user_id = ${id} order by date desc, id desc`,
        sql`select id, descr, date::text as date, value::float as value from expenses where user_id = ${id} order by date desc, id desc`,
        sql`select goal::float as goal from goals where user_id = ${id}`])
      return res.json({ services, expenses, goal: goals[0]?.goal || 0 })
    }
    if (req.method === 'POST') {
      const v = Number(b.value)
      if (!(v > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) return res.status(400).json({ error: 'Dados inválidos.' })
      if (a === 'service') {
        const r = await sql`insert into services(user_id, name, date, value, pay, note) values(${id}, ${String(b.name || 'Serviço').slice(0, 120)}, ${b.date}, ${v}, ${String(b.pay || 'Pix').slice(0, 30)}, ${String(b.note || '').slice(0, 300)}) returning id`
        return res.json(r[0])
      }
      if (a === 'expense') {
        const r = await sql`insert into expenses(user_id, descr, date, value) values(${id}, ${String(b.descr || 'Despesa').slice(0, 120)}, ${b.date}, ${v}) returning id`
        return res.json(r[0])
      }
    }
    if (req.method === 'PUT' && a === 'goal') {
      await sql`insert into goals(user_id, goal) values(${id}, ${Number(b.goal) || 0}) on conflict (user_id) do update set goal = excluded.goal`
      return res.json({ ok: 1 })
    }
    if (req.method === 'DELETE') {
      const i = Number(req.query.i)
      if (req.query.t === 'service') await sql`delete from services where id = ${i} and user_id = ${id}`
      else if (req.query.t === 'expense') await sql`delete from expenses where id = ${i} and user_id = ${id}`
      return res.json({ ok: 1 })
    }
    res.status(404).json({})
  } catch (e) { res.status(500).json({ error: 'Erro no servidor.' }) }
}
