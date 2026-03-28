import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hospital } from "@/api/entities";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ gmail:"", password:"" });
  const [regForm, setRegForm] = useState({ hospital_name:"", gmail:"", phone:"", address:"", city:"", state:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);

  const inp = { width:"100%", padding:"12px 16px", borderRadius:10, border:"1px solid #1e3a5f", background:"#0a0f1e", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", marginBottom:12 };
  const btn = { width:"100%", padding:"13px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#7c3aed,#0066ff)", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", marginTop:4 };

  const handleLogin = async () => {
    if (!form.gmail || !form.password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    try {
      const hospitals = await Hospital.filter({ gmail: form.gmail });
      if (!hospitals.length) { setError("Hospital not found. Please register."); setLoading(false); return; }
      const h = hospitals[0];
      if (h.status === "pending") { setMode("pending"); setLoading(false); return; }
      if (h.status === "rejected") { setError("Your hospital registration was rejected."); setLoading(false); return; }
      if (h.password !== form.password) { setError("Invalid password."); setLoading(false); return; }
      sessionStorage.setItem("sarvam_hospital", JSON.stringify(h));
      navigate("/admin-dashboard");
    } catch(e) { setError("Login failed."); }
    setLoading(false);
  };

  const sendOTP = () => {
    if (!regForm.hospital_name || !regForm.gmail || !regForm.password) { setError("Fill hospital name, Gmail and password first"); return; }
    const code = Math.floor(100000+Math.random()*900000).toString();
    setSentOtp(code); setOtpStep(true); setError("");
    alert(`OTP: ${code} (sent to ${regForm.gmail})`);
  };

  const handleRegister = async () => {
    if (otp !== sentOtp) { setError("Invalid OTP"); return; }
    setLoading(true); setError("");
    try {
      await Hospital.create({ ...regForm, status:"pending" });
      setMode("pending");
    } catch(e) { setError("Registration failed."); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e,#0d1b3e)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',sans-serif",padding:20}}>
      <div style={{background:"#0d1b3e",border:"1px solid #1e3a5f",borderRadius:20,padding:36,width:"100%",maxWidth:460,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
        <button onClick={()=>navigate("/")} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14,marginBottom:20}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:40,marginBottom:8}}>🏥</div>
          <h2 style={{color:"#e2e8f0",fontSize:24,fontWeight:700,margin:0}}>Hospital Admin Login</h2>
          <p style={{color:"#64748b",fontSize:13,marginTop:6}}>Register or manage your hospital on SARVAM</p>
        </div>

        {mode==="login" && <>
          <input style={inp} placeholder="Hospital Gmail" type="email" value={form.gmail} onChange={e=>setForm({...form,gmail:e.target.value})} />
          <input style={inp} placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
          {error && <p style={{color:"#ef4444",fontSize:13,marginBottom:8}}>{error}</p>}
          <button style={btn} onClick={handleLogin} disabled={loading}>{loading?"Logging in...":"Login"}</button>
          <p style={{textAlign:"center",color:"#64748b",fontSize:13,marginTop:16}}>New hospital? <span onClick={()=>setMode("register")} style={{color:"#7c3aed",cursor:"pointer"}}>Register here</span></p>
        </>}

        {mode==="register" && <>
          <p style={{color:"#7c3aed",fontSize:13,marginBottom:16,textAlign:"center"}}>Register — Developer will review and approve</p>
          {[{k:"hospital_name",l:"Hospital Name *",t:"text"},{k:"gmail",l:"Hospital Gmail *",t:"email"},{k:"phone",l:"Phone *",t:"tel"},{k:"address",l:"Address *",t:"text"},{k:"city",l:"City *",t:"text"},{k:"state",l:"State *",t:"text"},{k:"password",l:"Set Password *",t:"password"}].map(f=>(
            <input key={f.k} style={inp} placeholder={f.l} type={f.t} value={regForm[f.k]} onChange={e=>setRegForm({...regForm,[f.k]:e.target.value})} />
          ))}
          {!otpStep
            ? <button style={btn} onClick={sendOTP}>Get OTP to Verify Gmail</button>
            : <>
              <p style={{color:"#94a3b8",fontSize:13,marginBottom:8}}>OTP sent to {regForm.gmail}</p>
              <input style={inp} placeholder="Enter OTP" value={otp} onChange={e=>setOtp(e.target.value)} />
              {error && <p style={{color:"#ef4444",fontSize:13,marginBottom:8}}>{error}</p>}
              <button style={btn} onClick={handleRegister} disabled={loading}>{loading?"Submitting...":"Submit for Approval"}</button>
              <button onClick={sendOTP} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:10,border:"1px solid #1e3a5f",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:13}}>Resend OTP</button>
            </>
          }
          <button onClick={()=>setMode("login")} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:10,border:"1px solid #1e3a5f",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:14}}>Already registered? Login</button>
        </>}

        {mode==="pending" && <div style={{textAlign:"center"}}>
          <div style={{fontSize:60,marginBottom:16}}>⏳</div>
          <h3 style={{color:"#e2e8f0",marginBottom:8}}>Under Review</h3>
          <p style={{color:"#64748b",fontSize:14,lineHeight:1.7}}>Your hospital is being reviewed by the <strong style={{color:"#7c3aed"}}>SARVAM Developer</strong>. You'll receive your unique Hospital ID once approved.</p>
          <button onClick={()=>navigate("/")} style={{marginTop:20,padding:"12px 24px",borderRadius:10,border:"none",background:"rgba(255,255,255,0.05)",color:"#94a3b8",cursor:"pointer"}}>Back to Home</button>
        </div>}
      </div>
    </div>
  );
}
