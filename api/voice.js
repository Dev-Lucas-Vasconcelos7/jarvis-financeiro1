import jwt from 'jsonwebtoken'
export default async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store')
  const production=process.env.VERCEL_ENV==='production'
  if(process.env.VERCEL_ENV!=='preview'&&!(production&&process.env.JARVIS_VOICE_ENABLED==='true')) return res.status(404).json({error:'Voz desativada neste ambiente.'})
  if(req.method!=='POST') return res.status(405).end()
  let userId
  try {
    const token=(req.headers.cookie||'').match(/(?:^|; )jv=([^;]+)/)?.[1]
    if(!token||!(userId=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']}).id)) return res.status(401).end()
  } catch { return res.status(401).end() }
  const key=process.env.FISH_AUDIO_API_KEY
  if(!key) return res.status(503).json({error:'Voz não configurada.'})
  const treatment=req.body?.address
  const greeting=treatment==='senhora'?'Bem-vinda de volta, senhora.':treatment==='neutro'?'Que bom ter você de volta.':'Bem-vindo de volta, senhor.'
  const report=req.body?.report
  if(report!==undefined&&(req.body?.consent!==true||typeof report!=='string'||report.length>2200||!report.trim())) return res.status(400).json({error:'Relatório inválido ou sem autorização.'})
  // Shared atomic rate limiter; production fails closed without configuration.
  const redis=process.env.VOICE_REDIS_REST_URL, redisToken=process.env.VOICE_REDIS_REST_TOKEN
  if(production||redis||redisToken){
    if(!redis||!redisToken)return res.status(503).json({error:'Proteção de voz não configurada.'})
    try{
      const script="local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n"
      const command=['EVAL',script,'1','jarvis:voice:'+process.env.VERCEL_ENV+':'+String(userId),'60']
      const limit=await fetch(redis,{method:'POST',headers:{Authorization:'Bearer '+redisToken,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(3000)})
      if(!limit.ok)throw new Error('rate limiter')
      const data=await limit.json()
      if(!Number.isInteger(data.result))throw new Error('rate limiter')
      if(data.result>20){res.setHeader('Retry-After','60');return res.status(429).json({error:'Limite temporário de voz. Aguarde um minuto.'})}
    }catch{return res.status(503).json({error:'Proteção de voz temporariamente indisponível.'})}
  }
  const text=req.body?.ack===true?'Um momento.':report||greeting+' Estou à disposição para ajudar você a organizar suas finanças.'
  try {
    const response=await fetch('https://api.fish.audio/v1/tts',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',model:'s2.1-pro-free'},body:JSON.stringify({text,reference_id:'a5b93aeddcc948c19ea04f0afe9d178c',format:'mp3'}),signal:AbortSignal.timeout(25000)})
    if(!response.ok) return res.status(502).json({error:'Fish Audio indisponível ('+response.status+').'})
    const audio=Buffer.from(await response.arrayBuffer())
    if(!audio.length)return res.status(502).json({error:'Fish Audio retornou áudio vazio.'})
    res.setHeader('Content-Type','audio/mpeg')
    return res.status(200).send(audio)
  } catch { return res.status(502).json({error:'Não foi possível gerar a voz.'}) }
}
