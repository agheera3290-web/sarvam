import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hospital, Doctor, Patient } from "@/api/entities";

export default function DevPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("hospitals");
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [h,d,p] = await Promise.all([Hospital.list(), Doctor.list(), Patient.list()]);
    setHospitals(h); setDoctors(d); setPatients(p);
    setLoading(false);
  };

  const approveHospital = async (h) => {
    const uid = `HOSP-${Date.now().toString(36).toUpperCase()}`;
    await Hospital.update(h.id, { status:"approved", unique_hospital_id:uid });
    loadAll(); show(`✓ ${h.hospital_name} approved. ID: ${uid}`);
  };
  const rejectHospital = async (h) => {
    await Hospital.update(h.id, { status:"rejected" });
    loadAll(); show(`✗ ${h.hospital_name} rejected.`);
  };
  const togglePremium = async (p) => {
    await Patient.update(p.id, { is_premium: !p.is_premium });
    loadAll(); show(`✓ ${p.full_name} premium ${!p.is_premium?"enabled":"disabled"}.`);
  };
  const show = (m) => { setMsg(m); setTimeout(()=>setMsg(""),4000); };

  const pending = hospitals.filter(h=>h.status==="pending");
  const approved = hospitals.filter(h=>h.status==="approved");

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e,#1a0a2e)",fontFamily:"'Segoe UI',sans-serif",color:"#fff"}}>
      <div style={{background:"rgba(10,5,20,0.95)",borderBottom:"1px solid #2d1b4e",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{background:"linear-gradient(90deg,#7c3aed,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900,fontSize:22,letterSpacing:4}}>SARVAM</span>
          <span style={{padding:"4px 10px",borderRadius:20,background:"rgba(124,58,237,0.2)",border:"1px solid #7c3aed55",color:"#7c3aed",fontSize:12,fontWeight:600}}>DEV PANEL</span>
        </div>
        <button onClick={()=>navigate("/")} style={{padding:"8px 16px",borderRadius:8,border:"1px solid #2d1b4e",background:"transparent",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>Exit</button>
      </div>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:28}}>
          {[{l:"Total Hospitals",v:hospitals.length,c:"#7c3aed"},{l:"Pending",v:pending.length,c:"#f59e0b"},{l:"Active Hospitals",v:approved.length,c:"#00ccaa"},{l:"Total Doctors",v:doctors.length,c:"#0066ff"},{l:"Total Patients",v:patients.length,c:"#ec4899"},{l:"Premium Patients",v:patients.filter(p=>p.is_premium).length,c:"gold"}].map(s=>(
            <div key={s.l} style={{background:"rgba(124,58,237,0.05)",border:"1px solid #2d1b4e",borderRadius:12,padding:"16px 12px",textAlign:"center"}}>
              <p style={{margin:0,fontSize:30,fontWeight:800,color:s.c}}>{s.v}</p>
              <p style={{margin:"4px 0 0",fontSize:11,color:"#64748b"}}>{s.l}</p>
            </div>
          ))}
        </div>

        {msg && <div style={{padding:"12px 16px",background:"rgba(124,58,237,0.1)",border:"1px solid #7c3aed55",borderRadius:10,marginBottom:16,color:"#a78bfa",fontSize:14}}>{msg}</div>}

        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {["hospitals","doctors","patients"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 24px",borderRadius:20,border:"none",background:tab===t?"linear-gradient(135deg,#7c3aed,#ec4899)":"rgba(255,255,255,0.04)",color:tab===t?"#fff":"#94a3b8",cursor:"pointer",fontWeight:tab===t?700:400,fontSize:14,textTransform:"capitalize"}}>{t}</button>)}
        </div>

        {tab==="hospitals" && <div>
          {pending.length>0 && <>
            <h3 style={{color:"#f59e0b",marginBottom:12,fontSize:15}}>⏳ Pending Hospital Approvals ({pending.length})</h3>
            {pending.map(h=>(
              <div key={h.id} style={{background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:14,padding:18,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <p style={{margin:0,fontWeight:700,fontSize:16}}>{h.hospital_name}</p>
                    <p style={{margin:"4px 0 0",color:"#64748b",fontSize:13}}>{h.address}, {h.city}, {h.state}</p>
                    <p style={{margin:"4px 0 0",color:"#64748b",fontSize:13}}>📧 {h.gmail} · 📞 {h.phone}</p>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <button onClick={()=>approveHospital(h)} style={{padding:"10px 20px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#00ccaa,#0066ff)",color:"#fff",cursor:"pointer",fontWeight:700}}>✓ Approve</button>
                    <button onClick={()=>rejectHospital(h)} style={{padding:"10px 20px",borderRadius:8,border:"1px solid #ef4444",background:"transparent",color:"#ef4444",cursor:"pointer"}}>✗ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </>}
          <h3 style={{color:"#00ccaa",marginBottom:12,fontSize:15}}>✓ Approved Hospitals ({approved.length})</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
            {approved.map(h=>(
              <div key={h.id} style={{background:"rgba(0,204,170,0.03)",border:"1px solid rgba(0,204,170,0.15)",borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <p style={{margin:0,fontWeight:700}}>{h.hospital_name}</p>
                  <span style={{color:"#7c3aed",fontWeight:800,fontSize:13}}>{h.unique_hospital_id}</span>
                </div>
                <p style={{margin:0,color:"#64748b",fontSize:12}}>{h.city}, {h.state} · {h.gmail}</p>
              </div>
            ))}
          </div>
        </div>}

        {tab==="doctors" && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {doctors.map(d=>(
            <div key={d.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid #2d1b4e",borderRadius:12,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <p style={{margin:0,fontWeight:700}}>Dr. {d.full_name}</p>
                <span style={{padding:"3px 8px",borderRadius:20,fontSize:11,background:d.status==="approved"?"rgba(0,204,170,0.1)":d.status==="pending"?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)",color:d.status==="approved"?"#00ccaa":d.status==="pending"?"#f59e0b":"#ef4444"}}>{d.status}</span>
              </div>
              <p style={{margin:0,color:"#64748b",fontSize:12}}>{d.qualification} · {d.specialization}</p>
              <p style={{margin:"4px 0 0",color:"#64748b",fontSize:12}}>{d.hospital_name} · {d.email}</p>
              {d.unique_doctor_id && <p style={{margin:"4px 0 0",color:"#7c3aed",fontSize:12,fontWeight:600}}>ID: {d.unique_doctor_id}</p>}
            </div>
          ))}
        </div>}

        {tab==="patients" && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {patients.map(p=>(
            <div key={p.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid #2d1b4e",borderRadius:12,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <p style={{margin:0,fontWeight:700}}>{p.full_name}</p>
                {p.is_premium && <span style={{padding:"3px 8px",borderRadius:20,fontSize:11,background:"rgba(255,215,0,0.1)",color:"gold"}}>⭐ Premium</span>}
              </div>
              <p style={{margin:0,color:"#64748b",fontSize:12}}>{p.email} · Age: {p.age} · {p.blood_group}</p>
              <p style={{margin:"4px 0 0",color:"#64748b",fontSize:11}}>QR: {p.qr_code}</p>
              <button onClick={()=>togglePremium(p)} style={{marginTop:10,padding:"6px 14px",borderRadius:8,border:`1px solid ${p.is_premium?"#ef444455":"rgba(255,215,0,0.3)"}`,background:p.is_premium?"rgba(239,68,68,0.1)":"rgba(255,215,0,0.1)",color:p.is_premium?"#ef4444":"gold",cursor:"pointer",fontSize:12}}>
                {p.is_premium?"Remove Premium":"Grant Premium"}
              </button>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
