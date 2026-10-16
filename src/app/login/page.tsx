"use client";

import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import {firebaseAuth} from "@/lib/firebase-client";

export default function Login(){
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [resetMode,setResetMode]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();
    if(busy)return;
    setBusy(true);
    setMessage("");

    try{
      if(resetMode){
        await sendPasswordResetEmail(firebaseAuth(),email.trim());
        setMessage("Se este e-mail possui uma conta, você receberá instruções para redefinir sua senha.");
        return;
      }

      const credential=await signInWithEmailAndPassword(
        firebaseAuth(),email.trim(),password
      );

      const token=await credential.user.getIdToken();
      const response=await fetch("/api/members",{
        headers:{Authorization:"Bearer "+token},
        cache:"no-store"
      });

      if(response.status===403){
        router.push("/ativar");
        return;
      }
      if(!response.ok){
        await signOut(firebaseAuth());
        setMessage(
          "Sua conta ainda não possui acesso ativo ao oGrupo. " +
          "Verifique se sua candidatura foi aprovada e seu e-mail confirmado."
        );
        return;
      }

      router.push("/membros");
    }catch{
      setMessage(resetMode
        ?"Não foi possível concluir a solicitação. Tente novamente."
        :"Não foi possível entrar. Verifique suas credenciais.");
    }finally{
      setBusy(false);
    }
  }

  return <>
    <section className="member-hero">
      <div className="wrap">
        <span className="og-kicker">ÁREA EXCLUSIVA · OGRUPO</span>
        <h1>Boas conversas<br/><em>continuam aqui.</em></h1>
        <p>Um espaço reservado para quem faz parte do círculo.</p>
      </div>
    </section>

    <section className="wrap member-login-layout">
      <div className="member-login-intro">
        <span className="og-kicker">BEM-VINDO DE VOLTA</span>
        <h2>O próximo encontro começa com a conexão.</h2>
        <p>
          Acesse sua área para conhecer os demais integrantes
          e manter as conversas vivas entre os encontros.
        </p>
        <Link href="/candidatura">Ainda não é membro? Candidate-se ↗</Link>
      </div>

      <div className="member-login-card">
        <span className="og-kicker">ACESSO AOS MEMBROS</span>
        <h2>{resetMode?"Recuperar acesso":"Entrar no oGrupo"}</h2>
        <p>
          {resetMode
            ?"Informe seu e-mail para receber as instruções."
            :"Entre com o e-mail e a senha da sua conta ativada."}
        </p>

        <form onSubmit={submit} className="member-login-form">
          <label>
            E-mail
            <input type="email" required autoComplete="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}/>
          </label>

          {!resetMode&&<label>
            Senha
            <input type="password" required
              autoComplete="current-password"
              value={password}
              onChange={e=>setPassword(e.target.value)}/>
          </label>}

          {message&&<p className="member-login-message" role="status">
            {message}
          </p>}

          <button className="member-login-submit" type="submit"
            disabled={busy}>
            {busy?"Aguarde...":
              resetMode?"Enviar instruções ↗":"Entrar ↗"}
          </button>
        </form>

        <button className="member-login-switch" type="button"
          onClick={()=>{
            setResetMode(!resetMode);
            setMessage("");
          }}>
          {resetMode?"← Voltar ao login":"Esqueceu sua senha?"}
        </button>
      </div>
    </section>
  </>;
}
