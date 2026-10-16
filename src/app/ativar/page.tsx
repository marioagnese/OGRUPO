"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  type User
} from "firebase/auth";
import {firebaseAuth} from "@/lib/firebase-client";

export default function Activate(){
  const router=useRouter();
  const [user,setUser]=useState<User|null>(null);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  useEffect(()=>{
    return onAuthStateChanged(firebaseAuth(),setUser);
  },[]);

  async function login(){
    setBusy(true);
    setMessage("");
    try{
      await signInWithEmailAndPassword(firebaseAuth(),email,password);
    }catch{
      setMessage("Não foi possível entrar. Confira seu e-mail e senha.");
    }finally{setBusy(false)}
  }

  async function sendVerification(){
    if(!user)return;
    setBusy(true);
    setMessage("");
    try{
      await sendEmailVerification(user,{
        url:window.location.origin+"/ativar"
      });
      setMessage("Enviamos um e-mail de verificação. Abra o link e volte aqui.");
    }catch{
      setMessage("Não foi possível enviar a verificação. Tente novamente.");
    }finally{setBusy(false)}
  }

  async function activate(){
    if(!user||!consent)return;
    setBusy(true);
    setMessage("");
    try{
      await user.reload();
      const token=await user.getIdToken(true);
      const res=await fetch("/api/members/activate",{
        method:"POST",
        headers:{
          Authorization:"Bearer "+token,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({directoryConsent:true})
      });
      const data=await res.json();
      if(!res.ok)throw Error(data.error||"Não foi possível ativar.");
      router.push("/membros");
    }catch(e){
      setMessage(e instanceof Error?e.message:"Falha na ativação.");
    }finally{setBusy(false)}
  }

  return <>
    <section className="member-hero">
      <div className="wrap">
        <span className="og-kicker">BEM-VINDO AO OGRUPO</span>
        <h1>Seu lugar<br/><em>na conversa.</em></h1>
        <p>Falta pouco para fazer parte do nosso círculo.</p>
      </div>
    </section>
    <section className="wrap member-login-layout">
      <div className="member-login-intro">
        <span className="og-kicker">ATIVAÇÃO DE CONTA</span>
        <h2>Confiança começa com transparência.</h2>
        <p>
          O diretório é privado e acessível apenas aos membros
          aprovados e ativados. Seu nome, profissão, apresentação,
          e-mail e WhatsApp poderão ser vistos por esses integrantes.
        </p>
        <p>
          Não compartilhe informações que não deseja tornar
          disponíveis aos demais membros.
        </p>
      </div>
      <div className="member-login-card">
        <h2>Ativar participação</h2>
        {!user?<>
          <p>
            Depois de definir sua senha pelo link recebido,
            entre com suas credenciais para concluir a ativação.
          </p>
          <div className="member-login-form">
            <label>E-mail
              <input type="email" value={email}
                onChange={e=>setEmail(e.target.value)}/>
            </label>
            <label>Senha
              <input type="password" value={password}
                onChange={e=>setPassword(e.target.value)}/>
            </label>
            <button className="member-login-submit"
              disabled={busy||!email||!password} onClick={login}>
              Entrar para ativar ↗
            </button>
          </div>
        </>:<>
          <p>Conectado como <strong>{user.email}</strong></p>
          {!user.emailVerified&&
            <button className="member-login-submit"
              disabled={busy} onClick={sendVerification}>
              Enviar verificação de e-mail ↗
            </button>}
          <label className="apply-check" style={{margin:"24px 0"}}>
            <input type="checkbox" checked={consent}
              onChange={e=>setConsent(e.target.checked)}/>
            <span>
              Autorizo que meu nome, profissão, apresentação,
              e-mail e WhatsApp sejam exibidos no diretório
              privado, exclusivamente para membros ativos do oGrupo.
            </span>
          </label>
          <button className="member-login-submit"
            disabled={busy||!consent} onClick={activate}>
            {busy?"Aguarde...":"Confirmar e ativar ↗"}
          </button>
        </>}
        {message&&<p className="member-login-message" role="status">
          {message}
        </p>}
        <p style={{marginTop:24}}>
          <Link href="/login">Ir para o login</Link>
        </p>
      </div>
    </section>
  </>;
}
