import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [showDevInput, setShowDevInput] = useState(false);
  const [devPassphrase, setDevPassphrase] = useState("");
  const [devError, setDevError] = useState("");
  const clickTimer = useRef(null);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (newCount >= 3) { setShowDevInput(true); setClickCount(0); }
    else { clickTimer.current = setTimeout(() => setClickCount(0), 800); }
  };

  const handleDevSubmit = () => {
    if (devPassphrase === "rudranshsarvam") { navigate("/dev"); }
    else { setDevError("Invalid passphrase."); setTimeout(() => setDevError(""), 2000); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0f1e,#0d1b3e,#0a1628)", fontFamily:"'Segoe UI',sans-serif", color:"#fff", overflowX:"hidden" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", textAlign:"center", padding:"40px 20px", position:"relative" }}>
        <div style={{ position:"absolute", top:"10%", left:"5%", width:300, height:300, borderRadius:"50%", background:"rgba(0,150,255,0.05)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"10%", right:"5%", width:400, height:400, borderRadius:"50%", background:"rgba(0,200,150,0.05)", filter:"blur(80px)" }} />
        <div onClick={handleLogoClick} style={{ cursor:"default", userSelect:"none", marginBottom:8 }}>
          <div style={{ width:90, height:90, borderRadius:"50%", background:"linear-gradient(135deg,#0066ff,#00ccaa)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 0 40px rgba(0,102,255,0.4)", fontSize:36 }}>🏥</div>
          <h1 onClick={()=>navigate("/admin-login")} style={{ fontSize:"clamp(48px,8vw,80px)", fontWeight:900, background:"linear-gradient(90deg,#0066ff,#00ccaa,#0066ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", letterSpacing:8, cursor:"pointer", margin:0, lineHeight:1 }}>SARVAM</h1>
        </div>
        <p style={{ fontSize:"clamp(14px,2.5vw,20px)", color:"#94a3b8", maxWidth:600, lineHeight:1.7, marginBottom:16 }}>Smart. Accessible. Reliable. Verified. Accessible. Medical.</p>
        <p style={{ fontSize:"clamp(12px,1.8vw,16px)", color:"#64748b", maxWidth:500, lineHeight:1.6, marginBottom:48 }}>Your complete digital health identity — one QR, all your records, anywhere, anytime.</p>
        {showDevInput && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
            <div style={{ background:"#0d1b3e", border:"1px solid #1e3a5f", borderRadius:16, padding:32, width:320, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔐</div>
              <p style={{ color:"#94a3b8", marginBottom:16, fontSize:14 }}>Enter passphrase</p>
              <input type="password" value={devPassphrase} onChange={e=>setDevPassphrase(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleDevSubmit()} placeholder="••••••••••••••" autoFocus style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:"1px solid #1e3a5f", background:"#0a0f1e", color:"#fff", fontSize:16, outline:"none", boxSizing:"border-box", marginBottom:8 }} />
              {devError && <p style={{ color:"#ef4444", fontSize:12, marginBottom:8 }}>{devError}</p>}
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button onClick={()=>{setShowDevInput(false);setDevPassphrase("");}} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #1e3a5f", background:"transparent", color:"#94a3b8", cursor:"pointer", fontSize:14 }}>Cancel</button>
                <button onClick={handleDevSubmit} style={{ flex:1, padding:"10px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#0066ff,#00ccaa)", color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600 }}>Enter</button>
              </div>
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:24, flexWrap:"wrap", justifyContent:"center", width:"100%", maxWidth:900 }}>
          <LoginCard icon="👤" title="Patient Login" desc="Access your health records, QR card & medical history" onClick={()=>navigate("/patient-login")} color="#0066ff" />
          <LoginCard icon="🩺" title="Doctor Login" desc="Connect with your hospital, scan patient QR codes" onClick={()=>navigate("/doctor-login")} color="#00ccaa" />
        </div>
        <div style={{ marginTop:80, maxWidth:900, width:"100%", padding:"0 20px" }}>
          <h2 style={{ fontSize:28, fontWeight:700, marginBottom:32, color:"#e2e8f0" }}>Why SARVAM?</h2>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center" }}>
            <WhyCard icon="💰" title="Transparent Pricing" desc="No hidden costs. See real market rates for every procedure." />
            <WhyCard icon="📁" title="Digital Records" desc="No more physical folders. All records in one secure QR." />
            <WhyCard icon="🌍" title="Specialist Access" desc="Connect with specialists anywhere via telemedicine." />
          </div>
        </div>
        <p style={{ marginTop:60, fontSize:12, color:"#334155" }}>© 2026 SARVAM Health Platform. All rights reserved.</p>
      </div>
    </div>
  );
}

function LoginCard({ icon, title, desc, onClick, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background:`${color}18`, border:`1px solid ${color}55`, borderRadius:20, padding:"32px 28px", width:260, cursor:"pointer", transition:"all 0.3s ease", boxShadow:hovered?`0 8px 40px ${color}44`:"none", transform:hovered?"translateY(-4px)":"none" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <h3 style={{ fontSize:20, fontWeight:700, marginBottom:8, color:"#e2e8f0" }}>{title}</h3>
      <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6 }}>{desc}</p>
    </div>
  );
}

function WhyCard({ icon, title, desc }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"24px 20px", width:240, textAlign:"left" }}>
      <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
      <h4 style={{ fontSize:16, fontWeight:700, marginBottom:6, color:"#e2e8f0" }}>{title}</h4>
      <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>{desc}</p>
    </div>
  );
}
