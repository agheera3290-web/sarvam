import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Doctor, HospitalStaff, PatientVisitLog } from "@/api/entities";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [tab, setTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [visitLogs, setVisitLogs] = useState([]);
  const [addDoctorId, setAddDoctorId] = useState("");
  const [staffForm, setStaffForm] = useState({ name:"", role:"", phone:"", email:"", joining_date:"" });
  const [visitForm, setVisitForm] = useState({ patient_name:"", patient_age:"", patient_phone:"", date_visited:"", reason:"", doctor_name:"" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("sarvam_hospital");
    if (!stored) { navigate("/admin-login"); return; }
    const h = JSON.parse(stored);
    setHospital(h);
    loadData(h.id, h.unique_hospital_id);
  }, []);

  const loadData = async (hid, huid) => {
    const [d, s, l] = await Promise.all([Doctor.filter({hospital_id:huid}), HospitalStaff.filter({hospital_id:hid}), PatientVisitLog.filter({hospital_id:hid})]);
    setDoctors(d); setStaff(s); setVisitLogs(l);
  };

  const approve = async (doc) => {
    const uid = `DOC-${Date.now().toString(36).toUpperCase()}`;
    await Doctor.update(doc.id, { status:"approved", unique_doctor_id:uid });
    setDoctors(doctors.map(d=>d.id===doc.id?{...d,status:"approved",unique_doctor_id:uid}:d));
    show(`✓ Dr. ${doc.full_name} approved. ID: ${uid}`);
  };
  const reject = async (doc) => {
    await Doctor.update(doc.id, { status:"rejected" });
    setDoctors(doctors.map(d=>d.id===doc.id?{...d,status:"rejected"}:d));
    show(`✗ Dr. ${doc.full_name} rejected.`);
  };
  const addDoctor = async () => {
    if (!addDoctorId.trim()) return;
    setLoading(true);
    try {
      const docs = await Doctor.filter({ unique_doctor_id: addDoctorId.trim() });
      if (!docs.length) { show("Doctor ID not found."); setLoading(false); return; }
      await Doctor.update(docs[0].id, { hospital_id:hospital.unique_hospital_id, hospital_name:hospital.hospital_name, status:"approved" });
      loadData(hospital.id, hospital.unique_hospital_id);
      setAddDoctorId("");
      show(`✓ Dr. ${docs[0].full_name} added.`);
    } catch(e) { show("Failed."); }
    setLoading(false);
  };
  const addStaff = async () => {
    if (!staffForm.name) return;
    setLoading(true);
    await HospitalStaff.create({...staffForm, hospital_id:hospital.id});
    loadData(hospital.id, hospital.unique_hospital_id);
    setStaffForm({name:"",role:"",phone:"",email:"",joining_date:""});
    show("✓ Staff member added."); setLoading(false);
  };
  const addVisit = async () => {
    if (!visitForm.patient_name) return;
    setLoading(true);
    await PatientVisitLog.create({...visitForm, hospital_id:hospital.id, patient_age:parseInt(visitForm.patient_age)||0});
    loadData(hospital.id, hospital.unique_hospital_id);
    setVisitForm({patient_name:"",patient_age:"",patient_phone:"",date_visited:"",reason:"",doctor_name:""});
    show("✓ Visit log added."); setLoading(false);
  };
  const show = (m) => { setMsg(m); setTimeout(()=>setMsg(""),3000); };

  const inp = { width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid #1e3a5f", background:"#0a0f1e", color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:10 };

  if (!hospital) return <div style={{color:"#fff",textAlign:"center",marginTop:100}}>Loading...</div>;
  const pending = doctors.filter(d=>d.status==="pending");
  const approved = doctors.filter(d=>d.status==="approved");

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0f1e,#0d1b3e)",fontFamily:"'Segoe UI',sans-serif",color:"#fff"}}>
      <div style={{background:"rgba(13,27,62,0.9)",borderBottom:"1px solid #1e3a5f",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{background:"linear-gradient(90deg,#0066ff,#00ccaa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:800,fontSize:20}}>SARVAM</span>
          <span style={{color:"#64748b",fontSize:13}}>— Admin Panel</span>
        </div>
        <button onClick={()=>{sessionStorage.removeItem("sarvam_hospital");navigate("/");}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #1e3a5f",background:"transparent",color:"#94a3b8",fontSize:13,cursor:"pointer"}}>Logout</button>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>
        <div style={{background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(0,102,255,0.08))",border:"1px solid #1e3a5f",borderRadius:20,padding:24,marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div>
              <h2 style={{margin:0,fontSize:22}}>{hospital.hospital_name}</h2>
              <p style={{margin:"6px 0 0",color:"#64748b",fontSize:13}}>{hospital.address}, {hospital.city}, {hospital.state}</p>
              <p style={{margin:"4px 0 0",color:"#64748b",fontSize:13}}>📞 {hospital.phone} · 📧 {hospital.gmail}</p>
            </div>
            <div style={{padding:"10px 16px",borderRadius:10,background:"rgba(124,58,237,0.1)",border:"1px solid #7c3aed55",textAlign:"right"}}>
              <p style={{margin:0,color:"#64748b",fontSize:11}}>Hospital ID</p>
              <p style={{margin:0,color:"#7c3aed",fontWeight:800,fontSize:18,letterSpacing:2}}>{hospital.unique_hospital_id}</p>
            </div>
          </div>
        </div>

        {msg && <div style={{padding:"12px 16px",background:"rgba(0,204,170,0.1)",border:"1px solid #00ccaa55",borderRadius:10,marginBottom:16,color:"#00ccaa",fontSize:14}}>{msg}</div>}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginBottom:24}}>
          {[{l:"Pending",v:pending.length,c:"#f59e0b"},{l:"Approved Doctors",v:approved.length,c:"#00ccaa"},{l:"Staff",v:staff.length,c:"#0066ff"},{l:"Visit Logs",v:visitLogs.length,c:"#7c3aed"}].map(s=>(
            <div key={s.l} style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:12,padding:"16px 12px",textAlign:"center"}}>
              <p style={{margin:0,fontSize:28,fontWeight:800,color:s.c}}>{s.v}</p>
              <p style={{margin:"4px 0 0",fontSize:11,color:"#64748b"}}>{s.l}</p>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {["doctors","add-doctor","staff","visit-logs"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 20px",borderRadius:20,border:"none",background:tab===t?"linear-gradient(135deg,#7c3aed,#0066ff)":"rgba(255,255,255,0.05)",color:tab===t?"#fff":"#94a3b8",cursor:"pointer",fontWeight:tab===t?700:400,fontSize:14}}>{t.replace("-"," ").replace(/\b\w/g,l=>l.toUpperCase())}</button>)}
        </div>

        {tab==="doctors" && <div>
          {pending.length>0 && <>
            <h3 style={{color:"#f59e0b",marginBottom:12,fontSize:15}}>⏳ Pending ({pending.length})</h3>
            {pending.map(doc=>(
              <div key={doc.id} style={{background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:16,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                <div>
                  <p style={{margin:0,fontWeight:600,fontSize:15}}>Dr. {doc.full_name}</p>
                  <p style={{margin:"4px 0 0",color:"#64748b",fontSize:13}}>{doc.qualification} · {doc.specialization} · {doc.experience_years} yrs</p>
                  <p style={{margin:"2px 0 0",color:"#64748b",fontSize:12}}>{doc.email} · {doc.mobile}</p>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>approve(doc)} style={{padding:"8px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#00ccaa,#0066ff)",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>✓ Approve</button>
                  <button onClick={()=>reject(doc)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid #ef4444",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:13}}>✗ Reject</button>
                </div>
              </div>
            ))}
          </>}
          <h3 style={{color:"#00ccaa",marginBottom:12,fontSize:15}}>✓ Approved ({approved.length})</h3>
          {approved.map(doc=>(
            <div key={doc.id} style={{background:"rgba(0,204,170,0.03)",border:"1px solid rgba(0,204,170,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:8}}>
              <p style={{margin:0,fontWeight:600}}>Dr. {doc.full_name}</p>
              <p style={{margin:"4px 0 0",color:"#64748b",fontSize:13}}>{doc.qualification} · ID: {doc.unique_doctor_id}</p>
            </div>
          ))}
          {!approved.length && <p style={{color:"#64748b",fontSize:13}}>No approved doctors yet.</p>}
        </div>}

        {tab==="add-doctor" && <div style={{maxWidth:500}}>
          <h3 style={{color:"#e2e8f0",marginBottom:12}}>Add Doctor by Unique ID</h3>
          <p style={{color:"#64748b",fontSize:13,marginBottom:16}}>Add a doctor who already has a SARVAM Doctor ID to your hospital.</p>
          <div style={{display:"flex",gap:8}}>
            <input style={{...inp,marginBottom:0,flex:1}} placeholder="Doctor Unique ID" value={addDoctorId} onChange={e=>setAddDoctorId(e.target.value)} />
            <button onClick={addDoctor} disabled={loading} style={{padding:"0 20px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7c3aed,#0066ff)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Add</button>
          </div>
        </div>}

        {tab==="staff" && <div>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:16,padding:20,maxWidth:500,marginBottom:24}}>
            <h3 style={{margin:"0 0 16px",color:"#e2e8f0",fontSize:15}}>Add Staff Member</h3>
            {[{k:"name",l:"Name *",t:"text"},{k:"role",l:"Role",t:"text"},{k:"phone",l:"Phone",t:"tel"},{k:"email",l:"Email",t:"email"},{k:"joining_date",l:"Joining Date",t:"date"}].map(f=>(
              <input key={f.k} style={inp} placeholder={f.l} type={f.t} value={staffForm[f.k]} onChange={e=>setStaffForm({...staffForm,[f.k]:e.target.value})} />
            ))}
            <button onClick={addStaff} disabled={loading} style={{padding:"12px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7c3aed,#0066ff)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Add Staff</button>
          </div>
          {staff.map(s=><div key={s.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:10,padding:"12px 16px",marginBottom:8}}><p style={{margin:0,fontWeight:600,fontSize:14}}>{s.name}</p><p style={{margin:"4px 0 0",color:"#64748b",fontSize:13}}>{s.role} · {s.phone} · {s.email}</p></div>)}
        </div>}

        {tab==="visit-logs" && <div>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:16,padding:20,maxWidth:500,marginBottom:24}}>
            <h3 style={{margin:"0 0 16px",color:"#e2e8f0",fontSize:15}}>Add Patient Visit</h3>
            {[{k:"patient_name",l:"Patient Name *",t:"text"},{k:"patient_age",l:"Age",t:"number"},{k:"patient_phone",l:"Phone",t:"tel"},{k:"date_visited",l:"Date",t:"date"},{k:"reason",l:"Reason / Diagnosis",t:"text"},{k:"doctor_name",l:"Doctor Name",t:"text"}].map(f=>(
              <input key={f.k} style={inp} placeholder={f.l} type={f.t} value={visitForm[f.k]} onChange={e=>setVisitForm({...visitForm,[f.k]:e.target.value})} />
            ))}
            <button onClick={addVisit} disabled={loading} style={{padding:"12px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#7c3aed,#0066ff)",color:"#fff",fontWeight:700,cursor:"pointer"}}>Add Visit Log</button>
          </div>
          {visitLogs.map(v=><div key={v.id} style={{background:"rgba(255,255,255,0.02)",border:"1px solid #1e3a5f",borderRadius:10,padding:"12px 16px",marginBottom:8}}><p style={{margin:0,fontWeight:600,fontSize:14}}>{v.patient_name} (Age: {v.patient_age})</p><p style={{margin:"4px 0 0",color:"#64748b",fontSize:13}}>{v.date_visited} · {v.reason} · Dr. {v.doctor_name}</p><p style={{margin:"2px 0 0",color:"#64748b",fontSize:12}}>📞 {v.patient_phone}</p></div>)}
        </div>}
      </div>
    </div>
  );
}
