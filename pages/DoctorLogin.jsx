import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Doctor, Hospital } from "@/api/entities";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"" });
  const [regForm, setRegForm] = useState({ full_name:"", email:"", mobile:"", age:"", experience_years:"", qualification:"", specialization:"", hospital_id:"", current_address:"" });
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDoctor, setPendingDoctor] = useState(null);

  const inp = { width:"100%", padding:"12px 16px", borderRadius:10, border:"1px solid #1e3a5f", background:"#0a0f1e", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", marginBottom:12 };
  const btn = { width:"100%", padding:"13px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#00ccaa,#0066ff)", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", marginTop:4 };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");
    try {
      const docs = await Doctor.filter({ email: form.email });
      if (!docs.length) { setError("Doctor not found. Please register."); setLoading(false); return; }
      const doc = docs[0];
      if (doc.status === "pending") { setPendingDoctor(doc); setMode("pending"); setLoading(false); return; }
      if (doc.status === "rejected") { setError("Registration was rejected by hospital."); setLoading(false); return; }
      if (!doc.password) { setPendingDoctor(doc); setMode("set-password"); setLoading(false); return; }
      if (doc.password !== form.password) { setError("Invalid password."); setLoading(false); return; }
      sessionStorage.setItem("sarvam_doctor", JSON.stringify(doc));
      navigate("/doctor-dashboard");
    } catch(e) { setError("Login failed."); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regForm.full_name || !regForm.email || !regForm.hospital_id || !regForm.qualification) { setError("Fill all required fields"); return; }
    setLoading(true); setError("");
    try {
      const hospitals = await Hospital.filter({ unique_hospital_id: regForm.hospital_id });
      if (!hospitals.length) { setError("Hospital ID not found."); setLoading(false); return; }
      if (hospitals[0].status !== "approved") { setError("This hospital is not yet approved on SARVAM."); setLoading(false); return; }
      await Doctor.create({ ...regForm, age:parseInt(regForm.age)||0, experience_years:parseInt(regForm.experience_years)||0, hospital_name:hospitals[0].hospital_name, status:"pending" });
      setMode("pending");
    } catch(e) { setError("Registration failed."); }
    setLoading(false);
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await Doctor.update(pendingDoctor.id, { password: newPassword });
      sessionStorage.setItem("sarvam_doctor", JSON.stringify({ ...pendingDoctor, password: newPassword }));
      navigate("/doctor-dashboard");
    } catch(e) { setError("Failed to set password."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0f1e,#0d1b3e)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',sans-serif", padding:20 }}>
      <div style={{ background:"#0d1b3e", border:"1px solid #1e3a5f", borderRadius:20, padding:36, width:"100%", maxWidth:460, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
        <button onClick={()=>navigate("/")} style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:14, marginBottom:20 }}>← Back</button>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{fontSize:40,marginBottom:8}}>🩺</div>
          <h2 style={{color:"#e2e8f0",fontSize:24,fontWeight:700,margin:0}}>Doctor Login</h2>
          <p style={{color:"#64748b",fontSize:13,marginTop:6}}>Connect with your hospital on SARVAM</p>
        </div>

        {mode==="login" && <>
          <input style={inp} placeholder="Email address" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
          <input style={inp} placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
          {error && <p style={{color:"#ef4444",fontSize:13,marginBottom:8}}>{error}</p>}
          <button style={btn} onClick={handleLogin} disabled={loading}>{loading?"Logging in...":"Login"}</button>
          <p style={{textAlign:"center",color:"#64748b",fontSize:13,marginTop:16}}>New doctor? <span onClick={()=>setMode("register")} style={{color:"#00ccaa",cursor:"pointer"}}>Register here</span></p>
        </>}

        {mode==="register" && <>
          <p style={{color:"#00ccaa",fontSize:13,marginBottom:16,textAlign:"center"}}>Register — request goes to hospital admin for approval</p>
          {[{k:"full_name",l:"Full Name *",t:"text"},{k:"email",l:"Email *",t:"email"},{k:"mobile",l:"Mobile *",t:"tel"},{k:"age",l:"Age",t:"number"},{k:"experience_years",l:"Years of Experience",t:"number"},{k:"qualification",l:"Qualification (MBBS, MD...) *",t:"text"},{k:"specialization",l:"Specialization",t:"text"},{k:"hospital_id",l:"Hospital Unique ID *",t:"text"},{k:"current_address",l:"Current Address",t:"text"}].map(f=>(
            <input key={f.k} style={inp} placeholder={f.l} type={f.t} value={regForm[f.k]} onChange={e=>setRegForm({...regForm,[f.k]:e.target.value})} />
          ))}
          {error && <p style={{color:"#ef4444",fontSize:13,marginBottom:8}}>{error}</p>}
          <button style={btn} onClick={handleRegister} disabled={loading}>{loading?"Submitting...":"Submit Registration"}</button>
          <button onClick={()=>setMode("login")} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:10,border:"1px solid #1e3a5f",background:"transparent",color:"#94a3b8",cursor:"pointer",fontSize:14}}>Already registered? Login</button>
        </>}

        {mode==="pending" && <div style={{textAlign:"center"}}>
          <div style={{fontSize:60,marginBottom:16}}>⏳</div>
          <h3 style={{color:"#e2e8f0",marginBottom:8}}>Approval Pending</h3>
          <p style={{color:"#64748b",fontSize:14,lineHeight:1.7}}>Your registration has been sent to <strong style={{color:"#00ccaa"}}>hospital admin</strong> for approval. Once approved, you can set your password and login.</p>
          <button onClick={()=>navigate("/")} style={{marginTop:20,padding:"12px 24px",borderRadius:10,border:"none",background:"rgba(255,255,255,0.05)",color:"#94a3b8",cursor:"pointer"}}>Back to Home</button>
        </div>}

        {mode==="set-password" && <>
          <p style={{color:"#00ccaa",fontSize:14,marginBottom:16,textAlign:"center"}}>🎉 You've been approved! Set your password.</p>
          <p style={{color:"#64748b",fontSize:13,marginBottom:12,textAlign:"center"}}>Doctor ID: <strong style={{color:"#0066ff"}}>{pendingDoctor?.unique_doctor_id}</strong></p>
          <input style={inp} type="password" placeholder="Set your password (min 6 chars)" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          {error && <p style={{color:"#ef4444",fontSize:13,marginBottom:8}}>{error}</p>}
          <button style={btn} onClick={handleSetPassword} disabled={loading}>{loading?"Saving...":"Set Password & Enter"}</button>
        </>}
      </div>
    </div>
  );
}
