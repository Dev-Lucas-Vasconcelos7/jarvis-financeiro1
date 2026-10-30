import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'
export const sql = neon(process.env.DATABASE_URL)
export const sign = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
export function uid(req) {
  const m = (req.headers.cookie || '').match(/(?:^|; )jv=([^;]+)/)
  if (!m) return null
  try { return jwt.verify(m[1], process.env.JWT_SECRET).id } catch { return null }
}
export const setCookie = (res, t) =>
  res.setHeader('Set-Cookie', `jv=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${t ? 2592000 : 0}`)
