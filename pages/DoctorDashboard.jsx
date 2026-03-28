import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Patient, Prescription, LabReport, HospitalVisit } from "@/api/entities";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [tab, setTab] = useState("scanner");
  const [scanInput, setScanInput] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [accessLevel, setAccessLevel] = useState(null);
  const [scannedPatient, setScannedPatient] = useState(null);
  const [patientData, setPatientData] = useState({});
  const [accessError, setAccessError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [detailKey, setDetailKey] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("sarvam_doctor");
    if (!stored) { navigate("/doctor-login"); return; }
    setDoctor(JSON.parse(stored));
  }, []);

  const lookup = async () => {
    if (!scanInput.trim()) return;
    setLoading(true); setAccessError(""); setAccessLevel(null); setScannedPatient(null);
    try {
      let patients = await Patient.filter({ qr_code: scanInput.trim() });
      if (!patients.length) patients = await Patient.filter({ id: scanInput.trim() });
      if (!patients.length) { setAccessError("Patient QR not found."); setLoading(false); return; }
      setScannedPatient(patients[0]);
    } catch(e) { setAccessError("Lookup failed."); }
    setLoading(false);
  };

  const verifyAccess = async (key) => {
    const k = (key || accessKey).trim();
    setAccessError("");
    if (k.toUpperCase() === scannedPatient.basic_passkey?.toUpperCase()) { await loadData(scannedPatient.id, "basic"); return; }
    if (k === scannedPatient.detailed_password) { await loadData(scannedPatient.id, "detailed"); return; }
    if (k.toLowerCase() === "otp") {
      const code = Math.floor(100000+Math.random()*900000).toString();
      setSentOtp(code); setShowOtp(true);
      alert(`OTP for detailed access: ${code}`); return;
    }
    setAccessError("Invalid key. Enter passkey, password, or type 'otp'.");
  };

  const verifyOTP = async () => {
    if (otp === sentOtp) { await loadData(scannedPatient.id, "detailed"); setShowOtp(false); }
    else setAccessError("Invalid OTP.");
  };

  const loadData = async (pid, level) => {
    setLoading(true);
    const [pr, lb, vi] = await Promise.all([Prescription.filter({patient_id:pid}), LabReport.filter({patient_id:pid}), HospitalVisit.filter({patient_id:pid})]);
    setPatientData({ prescriptions:pr, labReports:lb, visits:vi });
    setAccessLevel(level);
    setLoading(false);
  };

  const inp = { width:"100%", padding:"11px 14px", borderRadius:9, border:"1px solid #1e3a5f", background:"#0a0f1e", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };

  if (!doctor) return <div style={{color:"#fff",textAlign:"center",marginTop:100}}>Loading...</div>;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0f1e,#0d1b3e)", fontFamily:"'Segoe UI',sans-serif", color:"#fff" }}>
      <div style={{ background:"rgba(13,27,62,0.9)", borderBottom:"1px solid #1e3a5f", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{background:"linear-gradient(90deg,#0066ff,#00ccaa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:800,fontSize:20}}>SARVAM</span>
          <span style={{color:"#64748b",fontSize:13}}>— Doctor Panel</span>
        </div>
        <button onClick={()=>{sessionStorage.removeItem("sarvam_doctor");navigate("/");}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #1e3a5f",background:"transparent",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>Logout</button>
      </div>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{background:"linear-gradient(135deg,rgba(0,204,170,0.1),rgba(0,102,255,0.08))",border:"1px solid #1e3a5f",borderRadius:20,padding:24,display:"flex",gap:20,alignItems:"center",marginBottom:24,flexWrap:"wrap"}}>
          <div style={{width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#00ccaa,#0066ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🩺</div>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:20}}>Dr. {doctor.full_name}</h2>
            <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
              {[doctor.specialization||doctor.qualification,`${doctor.experience_years||0} yrs`,doctor.hospital_name].filter(Boolean).map(v=>(
                <span key={v} style={{padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,0.05)",fontSize:12,color:"#94a3b8"}}>{v}</span>
              ))}
              {doctor.unique_doctor_id && <span style={{padding:"4px 10px",borderRadius:20,background:"rgba(0,102,255,0.1)",fontSize:12,color:"#0066ff"}}>ID: {doctor.unique_doctor_id}</span>}
            </div>
            <p style={{margin:"6px 0 0",color:"#64748b",fontSize:12}}>📍 {doctor.current_address||"Address not set"} · 📞 {doctor.mobile||"—"}</p>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["scanner","profile"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 24px",borderRadius:20,border:"none",background:tab===t?"linear-gradient(135deg,#00ccaa,#0066ff)":"rgba(255,255,255,0.05)",color:tab===t?"#fff":"#94a3b8",cursor:"pointer",fontWeight:tab===t?700:400,fontSize:14}}>{t==="scanner"?"📱 QR Scanner":"👤 My Profile"}</button>)}
        </div>

        {tab==="scanner" && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:16,padding:20}}>
            <h3 style={{margin:"0 0 16px",fontSize:15,color:"#94a3b8"}}>📱 Scan Patient QR</h3>
            <input style={inp} placeholder="Enter QR code or Patient ID" value={scanInput} onChange={e=>setScanInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&lookup()} />
            <button onClick={lookup} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00ccaa,#0066ff)",color:"#fff",fontWeight:700,cursor:"pointer",marginBottom:12}}>{loading?"Looking up...":"🔍 Find Patient"}</button>
            {scannedPatient && !accessLevel && <>
              <div style={{padding:10,background:"rgba(0,204,170,0.05)",border:"1px solid rgba(0,204,170,0.2)",borderRadius:8,marginBottom:10}}>
                <p style={{margin:0,color:"#00ccaa",fontSize:13}}>✓ Patient found — Enter access key</p>
              </div>
              <input style={inp} placeholder="Passkey / password / type 'otp'" value={accessKey} onChange={e=>setAccessKey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&verifyAccess()} />
              {accessError && <p style={{color:"#ef4444",fontSize:12,marginBottom:8}}>{accessError}</p>}
              <button onClick={()=>verifyAccess()} style={{width:"100%",padding:"11px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#0066ff,#00ccaa)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Access Records</button>
              {showOtp && <>
                <input style={{...inp,marginTop:10}} placeholder="Enter OTP" value={otp} onChange={e=>setOtp(e.target.value)} />
                <button onClick={verifyOTP} style={{width:"100%",padding:"11px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#0066ff,#00ccaa)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Verify OTP</button>
              </>}
            </>}
          </div>

          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:16,padding:20,overflowY:"auto",maxHeight:580}}>
            {!scannedPatient && <div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:48,marginBottom:12}}>📱</div><p style={{color:"#64748b",fontSize:14}}>Scan or enter a patient QR code</p></div>}
            {scannedPatient && !accessLevel && <div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:48,marginBottom:12}}>🔐</div><p style={{color:"#64748b",fontSize:14}}>Enter access key to view records</p></div>}
            {scannedPatient && accessLevel && <>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,alignItems:"center"}}>
                <h3 style={{margin:0,fontSize:16}}>{scannedPatient.full_name}</h3>
                <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,background:accessLevel==="detailed"?"rgba(0,204,170,0.1)":"rgba(0,102,255,0.1)",color:accessLevel==="detailed"?"#00ccaa":"#0066ff",border:`1px solid ${accessLevel==="detailed"?"#00ccaa55":"#0066ff55"}`}}>{accessLevel==="detailed"?"🔓 Detailed":"🔒 Basic"}</span>
              </div>
              <Sec title="Basic Info">
                {[["Age",scannedPatient.age],["Blood Group",scannedPatient.blood_group],["Mobile",scannedPatient.mobile],["Emergency",scannedPatient.emergency_contact],["Chronic",scannedPatient.chronic_diseases?.join(", ")||"None"]].map(([l,v])=><Row key={l} l={l} v={v}/>)}
              </Sec>
              {accessLevel==="basic" && <div style={{marginTop:12,padding:12,background:"rgba(0,102,255,0.05)",border:"1px solid #0066ff33",borderRadius:10,textAlign:"center"}}>
                <p style={{margin:"0 0 8px",color:"#0066ff",fontSize:13}}>Enter password or OTP for detailed info</p>
                <div style={{display:"flex",gap:8}}>
                  <input style={{...inp,marginBottom:0,flex:1}} placeholder="Detailed password" value={detailKey} onChange={e=>setDetailKey(e.target.value)} />
                  <button onClick={()=>verifyAccess(detailKey)} style={{padding:"0 14px",borderRadius:8,border:"none",background:"#0066ff",color:"#fff",cursor:"pointer"}}>Unlock</button>
                </div>
              </div>}
              {accessLevel==="detailed" && <>
                <Sec title="💊 Prescriptions (Last 4)">
                  {patientData.prescriptions?.slice(0,4).map(p=><Item key={p.id} t={`Dr. ${p.doctor_name}`} s={`${p.date} · ${p.hospital_name}`} l={p.prescription_photo}/>)}
                  {!patientData.prescriptions?.length && <p style={{color:"#64748b",fontSize:12}}>None</p>}
                </Sec>
                <Sec title="🧪 Lab Reports (Last 5)">
                  {patientData.labReports?.slice(0,5).map(r=><Item key={r.id} t={r.report_name} s={`${r.date} · ${r.hospital_name}`} l={r.report_photo}/>)}
                  {!patientData.labReports?.length && <p style={{color:"#64748b",fontSize:12}}>None</p>}
                </Sec>
                <Sec title="📋 More">
                  <Row l="ABHA ID" v={scannedPatient.abha_id||"—"}/>
                  <Row l="Address" v={scannedPatient.address||"—"}/>
                </Sec>
              </>}
            </>}
          </div>
        </div>}

        {tab==="profile" && <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:16,padding:24,maxWidth:500}}>
          <h3 style={{margin:"0 0 20px",color:"#e2e8f0"}}>My Profile</h3>
          {[["Full Name",doctor.full_name],["Email",doctor.email],["Mobile",doctor.mobile],["Age",doctor.age],["Experience",`${doctor.experience_years} years`],["Qualification",doctor.qualification],["Specialization",doctor.specialization],["Hospital",doctor.hospital_name],["Doctor ID",doctor.unique_doctor_id],["Address",doctor.current_address]].map(([l,v])=><Row key={l} l={l} v={v||"—"}/>)}
        </div>}
      </div>
    </div>
  );
}

function Sec({title,children}){return <div style={{marginBottom:14}}><p style={{margin:"0 0 8px",fontSize:12,color:"#64748b",fontWeight:600}}>{title}</p>{children}</div>;}
function Row({l,v}){return <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:13}}><span style={{color:"#64748b"}}>{l}</span><span style={{color:"#e2e8f0",fontWeight:500}}>{v}</span></div>;}
function Item({t,s,l}){return <div style={{padding:"7px 9px",background:"rgba(255,255,255,0.03)",borderRadius:7,marginBottom:5}}><p style={{margin:0,fontSize:13,color:"#e2e8f0"}}>{t}</p><p style={{margin:0,fontSize:11,color:"#64748b"}}>{s}</p>{l&&<a href={l} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#0066ff"}}>View →</a>}</div>;}
