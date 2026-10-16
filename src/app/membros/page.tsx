"use client";
import {useEffect,useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {onAuthStateChanged,signOut} from "firebase/auth";
import {firebaseAuth} from "@/lib/firebase-client";

type Profile={id:string;name:string;email:string;profession:string;bio:string;companies:string;education:string;languages:string;interests:string;city:string;photoUrl:string;whatsapp:string;circleId:string};
type Member=Profile&{foundingMember:boolean};
type Meeting={id:string;title:string;startsAt:string;location:string;description:string;circleId:string};
type Tab="inicio"|"perfil"|"circulo"|"encontros"|"integrantes";
const tabs:{id:Tab;label:string}[]=[{id:"inicio",label:"Meu Espaço"},{id:"perfil",label:"Meu Perfil"},{id:"circulo",label:"Meu Círculo"},{id:"encontros",label:"Encontros"},{id:"integrantes",label:"Integrantes"}];
const editable=["profession","bio","companies","education","languages","interests","city","photoUrl","whatsapp"] as const;
const labels:Record<(typeof editable)[number],string>={profession:"Profissão / área de atuação",bio:"Minha história",companies:"Empresas em que trabalhei",education:"Formação / áreas de estudo",languages:"Idiomas",interests:"Interesses e assuntos favoritos",city:"Cidade",photoUrl:"Link HTTPS da foto de perfil",whatsapp:"WhatsApp (com código do país)"};
function Avatar({m}:{m:{name:string;photoUrl?:string}}){return <div className="hub-avatar">{m.photoUrl?<img src={m.photoUrl} alt={m.name}/>:<span>{m.name.charAt(0).toUpperCase()}</span>}</div>}
function MemberCard({m,onSelect}:{m:Member;onSelect:(m:Member)=>void}){return <article className="hub-person"><Avatar m={m}/><div>{m.foundingMember&&<span className="hub-tag">FUNDADOR</span>}<h3>{m.name}</h3><p>{m.profession||"Integrante do oGrupo"}</p><small>{m.city}</small></div><button type="button" onClick={()=>onSelect(m)}>Ver perfil ↗</button></article>}
export default function MemberArea(){
  const router=useRouter();
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[tab,setTab]=useState<Tab>("inicio");
  const [member,setMember]=useState<Profile|null>(null),[draft,setDraft]=useState<Profile|null>(null),[directory,setDirectory]=useState<Member[]>([]),[meetings,setMeetings]=useState<Meeting[]>([]);
  const [search,setSearch]=useState(""),[selected,setSelected]=useState<Member|null>(null),[saving,setSaving]=useState(false),[notice,setNotice]=useState("");
  useEffect(()=>{
    let alive=true;
    const unsubscribe=onAuthStateChanged(firebaseAuth(),async user=>{
      if(!user){if(alive)router.replace("/login");return;}
      try{
        const token=await user.getIdToken();
        const response=await fetch("/api/members",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
        if(!response.ok){if(alive){setError("Seu acesso ainda não está ativo. Conclua a verificação em Ativar conta.");setLoading(false);}return;}
        const data=await response.json();
        if(alive){setMember(data.member);setDraft(data.member);setDirectory(data.directory||[]);setMeetings(data.meetings||[]);setLoading(false);}
      }catch{if(alive){setError("Não foi possível carregar sua área.");setLoading(false);}}
    });
    return ()=>{alive=false;unsubscribe();};
  },[router]);
  async function logout(){await signOut(firebaseAuth());router.replace("/login");}
  async function save(e:FormEvent){e.preventDefault();if(!draft)return;setSaving(true);setNotice("");
    try{const token=await firebaseAuth().currentUser?.getIdToken();if(!token)throw Error("Sessão expirada.");
      const res=await fetch("/api/members/profile",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(draft)});
      const data=await res.json();if(!res.ok)throw Error(data.error||"Falha ao salvar.");
      const updated={...draft,...data.profile};setMember(updated);setDraft(updated);setDirectory(prev=>prev.map(m=>m.id===updated.id?{...m,...updated}:m));setNotice("Perfil atualizado com sucesso.");
    }catch(e){setNotice(e instanceof Error?e.message:"Não foi possível salvar.");}finally{setSaving(false);}
  }
  const filtered=directory.filter(m=>[m.name,m.profession,m.bio,m.companies,m.education,m.languages,m.interests].join(" ").toLowerCase().includes(search.toLowerCase()));
  const circle=member?.circleId?directory.filter(m=>m.circleId===member.circleId):[];
  const upcoming=meetings.filter(m=>!Number.isNaN(Date.parse(m.startsAt))&&Date.parse(m.startsAt)>=Date.now()).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
  const formatDate=(value:string)=>new Date(value).toLocaleString("pt-BR",{dateStyle:"full",timeStyle:"short"});
  if(loading)return <section className="wrap member-loading"><p>Verificando seu acesso...</p></section>;
  if(error||!member)return <section className="wrap member-loading"><h1>Acesso restrito</h1><p>{error}</p><p><Link href="/ativar">Ativar conta ↗</Link></p><button className="member-login-submit" onClick={logout}>Sair da conta</button></section>;
  return <div className="hub">
    <section className="hub-hero"><div className="wrap hub-hero-inner"><span className="og-kicker">ÁREA EXCLUSIVA · OGRUPO</span><h1>Bem-vindo, <em>{member.name.split(" ")[0]}.</em></h1><p>Conexões que continuam além dos encontros.</p></div></section>
    <div className="wrap hub-shell">
      <nav className="hub-tabs" aria-label="Navegação dos membros">{tabs.map(t=><button key={t.id} type="button" className={tab===t.id?"active":""} onClick={()=>{setTab(t.id);setSelected(null);setNotice("");}}>{t.label}</button>)}<button type="button" className="hub-signout" onClick={logout}>Sair ↗</button></nav>
      {tab==="inicio"&&<section className="hub-section"><span className="og-kicker">SEU ESPAÇO</span><h2>O círculo começa aqui.</h2><div className="hub-feature-grid">
        <article className="hub-feature hub-feature-primary"><span>PRÓXIMO ENCONTRO</span>{upcoming.length?<><h3>{upcoming[0].title}</h3><p>{formatDate(upcoming[0].startsAt)}</p><p>{upcoming[0].location}</p><button onClick={()=>setTab("encontros")}>Ver encontros ↗</button></>:<><h3>Novos encontros em breve.</h3><p>Quando um encontro for agendado, você encontrará os detalhes aqui.</p><button onClick={()=>setTab("encontros")}>Ver calendário ↗</button></>}</article>
        <article className="hub-feature"><span>MEU PERFIL</span><h3>Deixe que conheçam sua história.</h3><p>{member.bio?"Seu perfil está disponível para os integrantes.":"Conte um pouco sobre sua trajetória, interesses e experiências."}</p><button onClick={()=>setTab("perfil")}>{member.bio?"Editar perfil":"Completar perfil"} ↗</button></article>
        <article className="hub-feature"><span>MEU CÍRCULO</span><h3>{member.circleId?circle.length+" integrantes no seu círculo":"Seu grupo será anunciado."}</h3><p>{member.circleId?"Conheça os integrantes do seu grupo.":"Assim que você for associado a um círculo, ele aparecerá aqui."}</p><button onClick={()=>setTab("circulo")}>Ver meu círculo ↗</button></article>
      </div><div className="hub-welcome"><h3>Mais do que uma rede de contatos.</h3><p>O oGrupo é um espaço de escuta, troca e aprendizado. Conheça as pessoas, compartilhe suas ideias e mantenha viva a conversa entre encontros.</p></div></section>}
      {tab==="perfil"&&<section className="hub-section"><span className="og-kicker">MINHA IDENTIDADE</span><h2>Meu Perfil</h2><p className="hub-intro">Compartilhe apenas as informações que deseja mostrar aos demais membros. Nome e e-mail vêm da sua conta aprovada.</p><form className="hub-profile-form" onSubmit={save}><div className="hub-profile-heading"><Avatar m={draft||member}/><div><h3>{member.name}</h3><p>{member.email}</p></div></div><div className="hub-form-grid">{editable.map(key=><label key={key} className={key==="bio"?"hub-wide":""}><span>{labels[key]}</span>{key==="bio"?<textarea rows={5} maxLength={1200} value={draft?.[key]||""} onChange={e=>setDraft(p=>p?{...p,[key]:e.target.value}:p)}/>:<input maxLength={key==="photoUrl"?500:400} type={key==="photoUrl"?"url":"text"} value={draft?.[key]||""} onChange={e=>setDraft(p=>p?{...p,[key]:e.target.value}:p)}/>}</label>)}</div><p className="hub-privacy">Estas informações serão exibidas somente para integrantes ativos do oGrupo. Não inclua dados que prefira manter privados.</p><button type="submit" className="hub-save" disabled={saving}>{saving?"Salvando...":"Salvar meu perfil ↗"}</button>{notice&&<p role="status">{notice}</p>}</form></section>}
      {tab==="circulo"&&<section className="hub-section"><span className="og-kicker">CONEXÕES PRÓXIMAS</span><h2>Meu Círculo</h2><p className="hub-intro">As pessoas com quem você compartilha encontros e conversas.</p>{member.circleId?<div className="hub-people">{circle.map(m=><MemberCard key={m.id} m={m} onSelect={setSelected}/>)}</div>:<div className="hub-empty"><h3>Seu círculo está sendo formado.</h3><p>Quando a administração definir seu grupo, os integrantes aparecerão aqui.</p></div>}</section>}
      {tab==="encontros"&&<section className="hub-section"><span className="og-kicker">NOSSA AGENDA</span><h2>Encontros</h2><p className="hub-intro">Datas, temas e locais dos próximos encontros.</p>{upcoming.length?<div className="hub-events">{upcoming.map(m=><article className="hub-event" key={m.id}><div className="hub-event-date">{new Date(m.startsAt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</div><div><h3>{m.title}</h3><p>{formatDate(m.startsAt)}</p><p>{m.location}</p><p>{m.description}</p></div></article>)}</div>:<div className="hub-empty"><h3>Nenhum encontro agendado ainda.</h3><p>Assim que a administração publicar uma data, ela aparecerá aqui e no seu painel.</p></div>}</section>}
      {tab==="integrantes"&&<section className="hub-section"><span className="og-kicker">QUEM FAZ PARTE</span><h2>Integrantes</h2><p className="hub-intro">Um diretório privado para conhecer quem participa da conversa.</p><label className="hub-search"><span>Encontrar um integrante</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, profissão ou interesse..."/></label><div className="hub-people">{filtered.map(m=><MemberCard key={m.id} m={m} onSelect={setSelected}/>)}</div>{!filtered.length&&<p>Nenhum integrante encontrado.</p>}</section>}
      {selected&&<div className="hub-overlay" role="presentation" onClick={()=>setSelected(null)}><section className="hub-detail" role="dialog" aria-modal="true" aria-label={"Perfil de "+selected.name} onClick={e=>e.stopPropagation()}><button type="button" className="hub-detail-close" onClick={()=>setSelected(null)} aria-label="Fechar">✕</button><Avatar m={selected}/><h2>{selected.name}</h2><p className="hub-detail-role">{selected.profession}</p>{([["Minha história",selected.bio],["Empresas",selected.companies],["Formação",selected.education],["Idiomas",selected.languages],["Interesses",selected.interests],["Cidade",selected.city]] as const).filter(x=>x[1]).map(([label,value])=><div className="hub-detail-field" key={label}><strong>{label}</strong><p>{value}</p></div>)}<div className="hub-detail-actions"><a href={"mailto:"+selected.email}>Enviar e-mail ↗</a>{selected.whatsapp&&<a href={"https://wa.me/"+selected.whatsapp.replace(/\D/g,"")} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}</div></section></div>}
    </div>
  </div>;
}
