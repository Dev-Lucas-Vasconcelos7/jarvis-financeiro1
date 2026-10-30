import bcrypt from 'bcryptjs'
import { sql, sign, uid, setCookie } from './_lib.js'
export default async function handler(req, res) {
  const a = req.query.a, b = req.body || {}
  try {
    if (a === 'me') {
      const id = uid(req); if (!id) return res.status(401).json({})
      const u = (await sql`select id, email from users where id = ${id}`)[0]
      return u ? res.json(u) : res.status(401).json({})
    }
    if (a === 'logout') { setCookie(res, ''); return res.json({ ok: 1 }) }
    const email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '')
    if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 6)
      return res.status(400).json({ error: 'E-mail inválido ou senha com menos de 6 caracteres.' })
    if (a === 'register') {
      if ((await sql`select 1 from users where email = ${email}`).length)
        return res.status(409).json({ error: 'Este e-mail já está cadastrado.' })
      const u = (await sql`insert into users(email, hash) values(${email}, ${await bcrypt.hash(pw, 10)}) returning id`)[0]
      setCookie(res, sign(u.id)); return res.json({ email })
    }
    if (a === 'login') {
      const u = (await sql`select id, hash from users where email = ${email}`)[0]
      if (!u || !(await bcrypt.compare(pw, u.hash))) return res.status(401).json({ error: 'E-mail ou senha incorretos.' })
      setCookie(res, sign(u.id)); return res.json({ email })
    }
    res.status(404).json({})
  } catch (e) { res.status(500).json({ error: 'Erro no servidor.' }) }
}
