"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {onAuthStateChanged,signOut} from "firebase/auth";
import {firebaseAuth} from "@/lib/firebase-client";

type Member={
  id:string;
  name:string;
  profession:string;
  bio:string;
  email:string;
  whatsapp:string;
  photoUrl:string;
  foundingMember:boolean;
};

export default function MemberArea(){
  const router=useRouter();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [name,setName]=useState("");
  const [directory,setDirectory]=useState<Member[]>([]);
  const [search,setSearch]=useState("");

  useEffect(()=>{
    let alive=true;

    const unsubscribe=onAuthStateChanged(firebaseAuth(),async user=>{
      if(!user){
        if(alive)router.replace("/login");
        return;
      }

      try{
        const token=await user.getIdToken();
        const res=await fetch("/api/members",{
          headers:{Authorization:"Bearer "+token},
          cache:"no-store"
        });

        if(!res.ok){
          if(alive){
            setError("Seu acesso não está ativo ou seu e-mail não foi verificado.");
            setLoading(false);
          }
          return;
        }

        const data=await res.json();
        if(alive){
          setName(data.member.name);
          setDirectory(data.directory);
          setLoading(false);
        }
      }catch{
        if(alive){
          setError("Não foi possível carregar a área dos membros.");
          setLoading(false);
        }
      }
    });

    return ()=>{
      alive=false;
      unsubscribe();
    };
  },[router]);

  async function logout(){
    await signOut(firebaseAuth());
    router.replace("/login");
  }

  const filtered=directory.filter(m=>
    (m.name+" "+m.profession+" "+m.bio)
      .toLowerCase().includes(search.toLowerCase())
  );

  if(loading)return <section className="wrap member-loading">
    <p>Verificando seu acesso...</p>
  </section>;

  if(error)return <section className="wrap member-loading">
    <h1>Acesso restrito</h1>
    <p>{error}</p>
    <button className="member-login-submit" onClick={logout}>
      Sair da conta
    </button>
    <p><Link href="/">Voltar ao início</Link></p>
  </section>;

  return <>
    <section className="member-hero">
      <div className="wrap">
        <span className="og-kicker">NOSSO CÍRCULO</span>
        <h1>Bem-vindo,<br/><em>{name.split(" ")[0]}.</em></h1>
        <p>As melhores conexões continuam além dos encontros.</p>
        <button className="member-logout" onClick={logout}>
          Sair da conta ↗
        </button>
      </div>
    </section>

    <section className="wrap member-directory">
      <div className="member-directory-heading">
        <div>
          <span className="og-kicker">ÁREA DOS MEMBROS</span>
          <h2>Quem faz parte<br/><em>da conversa.</em></h2>
          <p>
            Um espaço de confiança e proximidade.
            Este diretório é exclusivo dos integrantes aprovados.
          </p>
        </div>
        <div className="member-directory-search">
          <label htmlFor="member-search">Encontrar um integrante</label>
          <input id="member-search" value={search}
            placeholder="Buscar por nome ou interesse..."
            onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="member-grid">
        {filtered.map(m=><article className="member-card" key={m.id}>
          <div className="member-avatar">
            {m.photoUrl?
              <img src={m.photoUrl} alt={m.name}/>:
              <span>{m.name.charAt(0).toUpperCase()}</span>}
          </div>
          {m.foundingMember&&<span className="member-founder">
            MEMBRO FUNDADOR
          </span>}
          <h3>{m.name}</h3>
          {m.profession&&<p className="member-profession">{m.profession}</p>}
          {m.bio&&<p className="member-bio">{m.bio}</p>}
          <div className="member-contact">
            <a href={"mailto:"+m.email}>{m.email}</a>
            {m.whatsapp&&<a href={
              "https://wa.me/"+m.whatsapp.replace(/\D/g,"")
            } target="_blank" rel="noopener noreferrer">
              WhatsApp ↗
            </a>}
          </div>
        </article>)}
      </div>
      {filtered.length===0&&<p>Nenhum integrante encontrado.</p>}
    </section>
  </>;
}
