import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Patient, Prescription, LabReport, HospitalVisit } from "@/api/entities";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [tab, setTab] = useState("overview");
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [visits, setVisits] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showQRCard, setShowQRCard] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("sarvam_patient");
    if (!stored) { navigate("/patient-login"); return; }
    const p = JSON.parse(stored);
    setPatient(p);
    loadData(p.id);
    genQR(p.qr_code || `SARVAM-${p.id}`);
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(() => {
      setNearbyHospitals([
        { name:"City General Hospital", distance:"1.2 km", speciality:"Multi-specialty" },
        { name:"Apollo Clinic", distance:"3.5 km", speciality:"Cardiology" },
        { name:"Primary Health Center", distance:"5.8 km", speciality:"General" },
      ]);
    });
  }, []);

  const loadData = async (pid) => {
    const [pr, lb, vi] = await Promise.all([Prescription.filter({patient_id:pid}), LabReport.filter({patient_id:pid}), HospitalVisit.filter({patient_id:pid})]);
    setPrescriptions(pr.sort((a,b)=>new Date(b.date)-new Date(a.date)));
    setLabReports(lb.sort((a,b)=>new Date(b.date)-new Date(a.date)));
    setVisits(vi.sort((a,b)=>new Date(b.date_visited)-new Date(a.date_visited)));
  };

  const genQR = async (text) => {
    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,size,size);
    ctx.fillStyle = "#0066ff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    ctx.fillText("SARVAM QR", size/2, 20);
    ctx.font = "9px monospace"; ctx.fillStyle = "#333";
    const lines = text.match(/.{1,18}/g) || [text];
    lines.forEach((l,i)=>ctx.fillText(l, size/2, 45+i*14));
    ctx.strokeStyle = "#0066ff"; ctx.lineWidth = 3;
    ctx.strokeRect(10,30,140,100);
    setQrDataUrl(canvas.toDataURL());
  };

  const askAI = async () => {
    if (!patient?.is_premium) { setShowUpgrade(true); return; }
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiResponse("");
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer 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"},
        body:JSON.stringify({ model:"openai/gpt-oss-20b", messages:[{role:"system",content:"You are a helpful health assistant. Provide simple home remedies for common conditions like fever, cold, headache, stomachache, vomiting. Always recommend seeing a doctor for serious symptoms."},{role:"user",content:aiQuery}], max_tokens:512 })
      });
      const data = await res.json();
      setAiResponse(data.choices?.[0]?.message?.content || "No response.");
    } catch(e) { setAiResponse("AI assistant temporarily unavailable."); }
    setAiLoading(false);
  };

  const deleteVisit = async (id) => { await HospitalVisit.delete(id); setVisits(visits.filter(v=>v.id!==id)); };
  const printCard = () => { const w=window.open("","_blank"); w.document.write(`<html><body style="margin:20px;font-family:sans-serif">${document.getElementById("qr-card").innerHTML}</body></html>`); w.print(); };

  if (!patient) return <div style={{color:"#fff",textAlign:"center",marginTop:100}}>Loading...</div>;
  const tabs = ["overview","records","visits",...(patient.is_premium?["ai-assist","premium"]:[])];

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0a0f1e,#0d1b3e)", fontFamily:"'Segoe UI',sans-serif", color:"#fff" }}>
      <div style={{ background:"rgba(13,27,62,0.9)", borderBottom:"1px solid #1e3a5f", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <span style={{ background:"linear-gradient(90deg,#0066ff,#00ccaa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontWeight:800, fontSize:20 }}>SARVAM</span>
        <div style={{ display:"flex", gap:10 }}>
          {!patient.is_premium && <button onClick={()=>setShowUpgrade(true)} style={{ padding:"8px 14px", borderRadius:20, border:"1px solid gold", background:"rgba(255,215,0,0.1)", color:"gold", fontSize:13, cursor:"pointer" }}>⭐ Upgrade</button>}
          <button onClick={()=>{sessionStorage.clear();navigate("/");}} style={{ padding:"8px 14px", borderRadius:8, border:"1px solid #1e3a5f", background:"transparent", color:"#94a3b8", fontSize:13, cursor:"pointer" }}>Logout</button>
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px" }}>
        <div style={{ background:"linear-gradient(135deg,rgba(0,102,255,0.12),rgba(0,204,170,0.08))", border:"1px solid #1e3a5f", borderRadius:20, padding:24, display:"flex", gap:20, alignItems:"center", marginBottom:24, flexWrap:"wrap" }}>
          <div style={{ width:70, height:70, borderRadius:"50%", background:"linear-gradient(135deg,#0066ff,#00ccaa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{patient.full_name?.[0]||"P"}</div>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0, fontSize:22 }}>{patient.full_name}</h2>
            <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
              {[{l:"Age",v:patient.age},{l:"Blood",v:patient.blood_group,c:"#ef4444"},{l:"Mobile",v:patient.mobile||"—"}].map(t=>(
                <span key={t.l} style={{ padding:"4px 10px", borderRadius:20, background:"rgba(255,255,255,0.05)", fontSize:12, color:t.c||"#94a3b8" }}>{t.l}: <strong>{t.v}</strong></span>
              ))}
              {patient.is_premium && <span style={{ padding:"4px 10px", borderRadius:20, background:"rgba(255,215,0,0.1)", fontSize:12, color:"gold" }}>⭐ Premium</span>}
            </div>
          </div>
          <button onClick={()=>setShowQRCard(true)} style={{ padding:"12px 20px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#0066ff,#00ccaa)", color:"#fff", fontWeight:700, cursor:"pointer" }}>📱 My Health QR</button>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {tabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{ padding:"10px 20px", borderRadius:20, border:"none", background:tab===t?"linear-gradient(135deg,#0066ff,#00ccaa)":"rgba(255,255,255,0.05)", color:tab===t?"#fff":"#94a3b8", cursor:"pointer", fontWeight:tab===t?700:400, fontSize:14, textTransform:"capitalize" }}>{t.replace("-"," ")}</button>)}
        </div>

        {tab==="overview" && <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
          <Card title="📞 Contact Info"><Row l="Email" v={patient.email}/><Row l="Mobile" v={patient.mobile||"—"}/><Row l="Emergency" v={patient.emergency_contact||"—"}/></Card>
          <Card title="🩸 Medical Info"><Row l="Blood Group" v={patient.blood_group}/><Row l="ABHA ID" v={patient.abha_id||"Not set"}/><Row l="Chronic" v={patient.chronic_diseases?.join(", ")||"None"}/></Card>
          <Card title="💊 Recent Prescriptions">{prescriptions.slice(0,2).map(p=><Item key={p.id} title={`Dr. ${p.doctor_name}`} sub={`${p.date} · ${p.hospital_name}`}/>)}{!prescriptions.length&&<p style={{color:"#64748b",fontSize:13}}>No prescriptions yet</p>}</Card>
          <Card title="🏥 Nearby Hospitals">{nearbyHospitals.map((h,i)=><Item key={i} title={h.name} sub={`${h.distance} · ${h.speciality}`}/>)}{!nearbyHospitals.length&&<p style={{color:"#64748b",fontSize:13}}>Allow location to see nearby hospitals</p>}</Card>
        </div>}

        {tab==="records" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card title="🧪 Lab Reports (Last 5)">{labReports.slice(0,5).map(r=><Item key={r.id} title={r.report_name} sub={`${r.date} · ${r.hospital_name}`} link={r.report_photo}/>)}{!labReports.length&&<p style={{color:"#64748b",fontSize:13}}>None yet</p>}</Card>
          <Card title="💊 Prescriptions (Last 4)">{prescriptions.slice(0,4).map(p=><Item key={p.id} title={`Dr. ${p.doctor_name}`} sub={`${p.date} · ${p.hospital_name}`} link={p.prescription_photo}/>)}{!prescriptions.length&&<p style={{color:"#64748b",fontSize:13}}>None yet</p>}</Card>
        </div>}

        {tab==="visits" && <Card title="🏥 Hospital Visit History">
          {visits.map(v=>(
            <div key={v.id} style={{ marginBottom:10, padding:"12px 16px", background:"rgba(255,255,255,0.03)", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{margin:0,fontSize:14,fontWeight:600}}>{v.hospital_name}</p><p style={{margin:"3px 0 0",color:"#64748b",fontSize:12}}>{v.date_visited} · {v.city} · {v.reason} · Dr. {v.doctor_name}</p></div>
              <button onClick={()=>deleteVisit(v.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", color:"#ef4444", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>Delete</button>
            </div>
          ))}
          {!visits.length && <p style={{color:"#64748b",fontSize:13}}>No visits recorded yet</p>}
        </Card>}

        {tab==="ai-assist" && <Card title="🤖 AI Health Assistant">
          <p style={{color:"#64748b",fontSize:13,marginBottom:16}}>Ask about fever, cold, headache, stomachache, vomiting...</p>
          <textarea value={aiQuery} onChange={e=>setAiQuery(e.target.value)} placeholder="Describe your symptoms..." style={{ width:"100%", padding:12, borderRadius:10, border:"1px solid #1e3a5f", background:"#0a0f1e", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", minHeight:80, resize:"vertical", marginBottom:12 }} />
          <button onClick={askAI} disabled={aiLoading} style={{ padding:"12px 24px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#0066ff,#00ccaa)", color:"#fff", fontWeight:700, cursor:"pointer" }}>{aiLoading?"Thinking...":"Ask AI"}</button>
          {aiResponse && <div style={{ marginTop:16, padding:16, background:"rgba(0,204,170,0.05)", border:"1px solid rgba(0,204,170,0.2)", borderRadius:10 }}><p style={{margin:0,fontSize:14,lineHeight:1.7}}>{aiResponse}</p></div>}
        </Card>}

        {tab==="premium" && <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
          {[{icon:"💊",title:"Online Consultation",desc:"Consult a doctor for ₹50 / 5 mins"},{icon:"📍",title:"Nearby Doctors",desc:"Find doctors within 5-10 km"},{icon:"🚨",title:"Emergency Mode",desc:"Get nearby doctor numbers instantly"},{icon:"🔍",title:"Search Hospital",desc:"Find hospital by unique ID"}].map(c=>(
            <div key={c.title} style={{ background:"rgba(255,215,0,0.03)", border:"1px solid rgba(255,215,0,0.2)", borderRadius:16, padding:20 }}>
              <div style={{fontSize:32,marginBottom:8}}>{c.icon}</div>
              <h4 style={{color:"#e2e8f0",margin:"0 0 6px"}}>{c.title}</h4>
              <p style={{color:"#64748b",fontSize:13}}>{c.desc}</p>
            </div>
          ))}
        </div>}
      </div>

      {showQRCard && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:"#0d1b3e", borderRadius:20, padding:24, width:360 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{margin:0,color:"#e2e8f0"}}>Health QR Card</h3>
              <button onClick={()=>setShowQRCard(false)} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:20}}>×</button>
            </div>
            <div id="qr-card" style={{ background:"linear-gradient(135deg,#0a0f1e,#0d1b3e)", border:"2px solid #0066ff", borderRadius:16, padding:20, textAlign:"center" }}>
              <div style={{ background:"linear-gradient(90deg,#0066ff,#00ccaa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontSize:22, fontWeight:900, letterSpacing:4, marginBottom:4 }}>SARVAM</div>
              <p style={{color:"#64748b",fontSize:10,margin:"0 0 12px"}}>Health QR Platform</p>
              {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{width:160,height:160}} />}
              <div style={{ marginTop:12, background:"rgba(0,102,255,0.1)", borderRadius:8, padding:8 }}>
                <p style={{margin:0,color:"#e2e8f0",fontSize:14,fontWeight:700}}>{patient.full_name}</p>
                <p style={{margin:0,color:"#64748b",fontSize:11}}>Age: {patient.age} | Blood: {patient.blood_group}</p>
              </div>
              <div style={{ marginTop:10, borderTop:"1px dashed #1e3a5f", paddingTop:10 }}>
                <p style={{margin:"0 0 4px",color:"#64748b",fontSize:10}}>BASIC ACCESS PASSKEY</p>
                <p style={{margin:0,color:"#0066ff",fontSize:22,fontWeight:900,letterSpacing:5}}>{patient.basic_passkey}</p>
                <p style={{margin:"4px 0 0",color:"#334155",fontSize:9}}>Show QR + passkey for basic info access</p>
              </div>
            </div>
            <button onClick={printCard} style={{ width:"100%", marginTop:12, padding:12, borderRadius:10, border:"none", background:"linear-gradient(135deg,#0066ff,#00ccaa)", color:"#fff", fontWeight:700, cursor:"pointer" }}>🖨️ Print Health Card</button>
          </div>
        </div>
      )}

      {showUpgrade && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:"#0d1b3e", borderRadius:20, padding:32, width:340, textAlign:"center" }}>
            <div style={{fontSize:48,marginBottom:12}}>⭐</div>
            <h3 style={{color:"#e2e8f0",margin:"0 0 8px"}}>Upgrade to Premium</h3>
            <p style={{color:"#64748b",fontSize:14,marginBottom:20}}>Unlock AI assistant, online consultations, emergency mode & more.</p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowUpgrade(false)} style={{ flex:1, padding:12, borderRadius:10, border:"1px solid #1e3a5f", background:"transparent", color:"#94a3b8", cursor:"pointer" }}>Later</button>
              <button style={{ flex:1, padding:12, borderRadius:10, border:"none", background:"linear-gradient(135deg,gold,#f59e0b)", color:"#0a0f1e", fontWeight:700, cursor:"pointer" }}>Upgrade ₹99/mo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid #1e3a5f", borderRadius:16, padding:20 }}><h3 style={{margin:"0 0 14px",fontSize:15,color:"#94a3b8"}}>{title}</h3>{children}</div>;
}
function Row({ l, v }) {
  return <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#64748b"}}>{l}</span><span style={{color:"#e2e8f0",fontWeight:500}}>{v}</span></div>;
}
function Item({ title, sub, link }) {
  return <div style={{marginBottom:8,padding:8,background:"rgba(255,255,255,0.03)",borderRadius:8}}><p style={{margin:0,fontSize:13,color:"#e2e8f0"}}>{title}</p><p style={{margin:0,fontSize:11,color:"#64748b"}}>{sub}</p>{link&&<a href={link} target="_blank" rel="noreferrer" style={{color:"#0066ff",fontSize:11}}>View →</a>}</div>;
}
