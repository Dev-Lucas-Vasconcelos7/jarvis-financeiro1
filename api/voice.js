import jwt from 'jsonwebtoken'
export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store')
  if(process.env.VERCEL_ENV!=='preview') return res.status(404).end()
  if(req.method!=='POST') return res.status(405).end()
  try {
    const token=(req.headers.cookie||'').match(/(?:^|; )jv=([^;]+)/)?.[1]
    if(!token||!jwt.verify(token,process.env.JWT_SECRET).id) return res.status(401).end()
  } catch { return res.status(401).end() }
  const key=process.env.FISH_AUDIO_API_KEY
  if(!key) return res.status(503).json({error:'Voz não configurada.'})
  const treatment=req.body?.address
  const greeting=treatment==='senhora'?'Bem-vinda de volta, senhora.':treatment==='neutro'?'Que bom ter você de volta.':'Bem-vindo de volta, senhor.'
  const report=req.body?.report
  if(report!==undefined&&(req.body?.consent!==true||typeof report!=='string'||report.length>2200||!report.trim())) return res.status(400).json({error:'Relatório inválido ou sem autorização.'})
  const text=req.body?.ack===true?'Um momento.':report||greeting+' Estou à disposição para ajudar você a organizar suas finanças.'
  try {
    const response=await fetch('https://api.fish.audio/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',model:'s2.1-pro-free'},body:JSON.stringify({text,reference_id:'a5b93aeddcc948c19ea04f0afe9d178c',format:'mp3'}),signal:AbortSignal.timeout(25000)})
    if(!response.ok) return res.status(502).json({error:'Fish Audio indisponível ('+response.status+').'})
    const audio=Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Type','audio/mpeg')
    return res.status(200).send(audio)
  } catch { return res.status(502).json({error:'Não foi possível gerar a voz.'}) }
}
