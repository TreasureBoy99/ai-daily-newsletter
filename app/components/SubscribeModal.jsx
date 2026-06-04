'use client';
import { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SubscribeModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) { setEmail(''); setStatus('idle'); setMessage(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email}) });
      const data = await res.json();
      if (res.ok) { setStatus('success'); setMessage(data.message || '已发送确认邮件，请查收！'); }
      else { setStatus('error'); setMessage(data.error || '订阅失败，请稍后重试'); }
    } catch { setStatus('error'); setMessage('网络错误，请检查网络后重试'); }
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.5)'}} onClick={(e)=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'white',borderRadius:'16px',padding:'32px',maxWidth:'440px',width:'90%',position:'relative',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
        <button onClick={onClose} style={{position:'absolute',top:'16px',right:'16px',background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:'4px'}}><X size={20}/></button>
        {status === 'success' ? (
          <div style={{textAlign:'center',padding:'16px 0'}}>
            <CheckCircle size={48} color='#22c55e' style={{margin:'0 auto 16px',display:'block'}}/>
            <h3 style={{fontSize:'18px',fontWeight:'700',marginBottom:'8px'}}>确认邮件已发送！</h3>
            <p style={{color:'#64748b',fontSize:'14px',lineHeight:'1.6'}}>{message}</p>
            <p style={{color:'#94a3b8',fontSize:'13px',marginTop:'12px'}}>24小时内有效，请查收邮件点击确认链接。</p>
          </div>
        ) : (
          <>
            <div style={{textAlign:'center',marginBottom:'24px'}}>
              <div style={{fontSize:'40px',marginBottom:'12px'}}>&#128231;</div>
              <h2 style={{fontSize:'20px',fontWeight:'700'}}>订阅每日 AI 简报</h2>
              <p style={{color:'#64748b',fontSize:'14px',marginTop:'6px',lineHeight:'1.5'}}>聚合40+顶级AI源，每日邮件送达，不错过任何重要进展</p>
            </div>
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div style={{position:'relative'}}>
                <Mail size={16} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
                <input type='email' value={email} onChange={(e)=>setEmail(e.target.value)} placeholder='your@email.com' required
                  style={{width:'100%',padding:'12px 12px 12px 40px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
                  onFocus={(e)=>{e.target.style.borderColor='#6366f1';}} onBlur={(e)=>{e.target.style.borderColor='#e2e8f0';}}/>
              </div>
              {status==='error' && <div style={{display:'flex',alignItems:'center',gap:'8px',color:'#ef4444',fontSize:'13px',padding:'8px 12px',background:'#fef2f2',borderRadius:'8px'}}><AlertCircle size={14}/>{message}</div>}
              <button type='submit' disabled={status==='loading'||!email}
                style={{padding:'12px',background:email?'#6366f1':'#c7d2fe',color:'white',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:email?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',transition:'all 0.2s'}}>
                {status==='loading' ? <><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> 发送中...</> : '订阅简报'}
              </button>
            </form>
            <p style={{textAlign:'center',color:'#94a3b8',fontSize:'12px',marginTop:'16px'}}>自由订阅/退订，绝不发送垃圾邮件</p>
          </>
        )}
      </div>
    </div>
  );
}
