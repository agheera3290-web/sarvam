import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Patient } from "@/api/entities";

export default function PatientLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState("entry");
  const [form, setForm] = useState({ email: "", mobile: "" });
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [regForm, setRegForm] = useState({ full_name:"", age:"", blood_group:"", mobile:"", emergency_contact:"", address:"", detailed_password:"", abha_id:"" });

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
  const generatePasskey = () => Math.random().toString(36).substring(2,8).toUpperCase();

  const sendOTP = async () => {
    if (!form.email) { setError("Please enter your email"); return; }
    setLoading(true); setError("");
    try {
      const code = generateOTP();
      setSentOtp(code);
      const patients = await Patient.filter({ email: form.email });
      if (patients.length > 0) setPatient(patients[0]);
      setStep("otp");
      alert(`OTP sent to ${form.email}.\n\nDemo OTP: ${code}`);
    } catch(e) { setError("Failed to send OTP. Try again."); }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (otp !== sentOtp) { setError("Invalid OTP. Try again."); return; }
    if (patient) { sessionStorage.setItem("sarvam_patient", JSON.stringify(patient)); navigate("/patient-dashboard"); }
    else { setStep("register"); }
  };

  const registerPatient = async () => {
    if (!regForm.full_name || !regForm.age || !regForm.blood_group || !regForm.detailed_password) { setError("Please fill all required fields"); return; }
    setLoading(true);
    try {
      const passkey = generatePasskey();
      const created = await Patient.create({ ...regForm, email: form.email, mobile: form.mobile || regForm.mobile, age: parseInt(regForm.age), basic_passkey: passkey, is_premium: false, qr_code: "temp" });
      const qr = `SARVAM-${created.id}`;
      await Patient.update(created.id, { qr_code: qr });
      const final = { ...created, qr_code: qr, basic_passkey: passkey };
      sessionStorage.setItem("sarvam_patient", JSON.stringify(final));
      navigate("/patient-dashboard");
    } catch(e) { setError("Registration failed. Try again."); }
    setLoading(false);
  };

  const inp = { width:"100%", padding:"12px 16px", borderRadius:10, border:"1px solid #1e3a5f", background:"#0a0f1e", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", marginBottom:12 };
  const btn = { width:"100%", padding:"13px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#0066ff,#0044cc)", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", marginTop:4 };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0f1e,#0d1b3e)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',sans-serif", padding:20 }}>
      <div style={{ background:"#0d1b3e", border:"1px solid #1e3a5f", borderRadius:20, padding:36, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
        <button onClick={()=>navigate("/")} style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:14, marginBottom:20 }}>← Back</button>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>👤</div>
          <h2 style={{ color:"#e2e8f0", fontSize:24, fontWeight:700, margin:0 }}>Patient Login</h2>
          <p style={{ color:"#64748b", fontSize:13, marginTop:6 }}>Access your health records</p>
        </div>
        {step==="entry" && <>
          <input style={inp} placeholder="Email address *" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} type="email" />
          <input style={inp} placeholder="Mobile number (optional)" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} type="tel" />
          {error && <p style={{ color:"#ef4444", fontSize:13, marginBottom:8 }}>{error}</p>}
          <button style={btn} onClick={sendOTP} disabled={loading}>{loading?"Sending...":"Send OTP"}</button>
        </>}
        {step==="otp" && <>
          <p style={{ color:"#94a3b8", fontSize:14, marginBottom:16, textAlign:"center" }}>OTP sent to <strong style={{ color:"#0066ff" }}>{form.email}</strong></p>
          <input style={inp} placeholder="Enter 6-digit OTP" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} />
          {error && <p style={{ color:"#ef4444", fontSize:13, marginBottom:8 }}>{error}</p>}
          <button style={btn} onClick={verifyOTP}>Verify OTP</button>
          <button onClick={sendOTP} style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid #1e3a5f", background:"transparent", color:"#94a3b8", fontSize:14, cursor:"pointer", marginTop:8 }}>Resend OTP</button>
        </>}
        {step==="register" && <>
          <p style={{ color:"#00ccaa", fontSize:13, marginBottom:16, textAlign:"center" }}>Welcome! Complete your profile to get your Health QR</p>
          {[{k:"full_name",l:"Full Name *",t:"text"},{k:"age",l:"Age *",t:"number"},{k:"mobile",l:"Mobile Number",t:"tel"},{k:"emergency_contact",l:"Emergency Contact",t:"tel"},{k:"address",l:"Address",t:"text"},{k:"abha_id",l:"ABHA ID (optional)",t:"text"},{k:"detailed_password",l:"Set Detailed Access Password *",t:"password"}].map(f=>(
            <input key={f.k} style={inp} placeholder={f.l} type={f.t} value={regForm[f.k]} onChange={e=>setRegForm({...regForm,[f.k]:e.target.value})} />
          ))}
          <select style={{...inp}} value={regForm.blood_group} onChange={e=>setRegForm({...regForm,blood_group:e.target.value})}>
            <option value="">Select Blood Group *</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          {error && <p style={{ color:"#ef4444", fontSize:13, marginBottom:8 }}>{error}</p>}
          <button style={btn} onClick={registerPatient} disabled={loading}>{loading?"Creating...":"Create Health Profile"}</button>
        </>}
      </div>
    </div>
  );
}
