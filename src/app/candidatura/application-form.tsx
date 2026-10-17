"use client";

import {useState,type FormEvent} from "react";
import Link from "next/link";

const personalFields = [
  ["firstName","Nome",true],
  ["lastName","Sobrenome",true],
  ["email","E-mail",true],
  ["whatsapp","WhatsApp",true],
  ["profession","Profissão ou área de atuação",false],
  ["referral","Quem indicou você?",true],
] as const;

const commitments = [
  ["statute","Li e aceito integralmente o Estatuto 3.0, sem ressalvas."],
  ["attendance","Comprometo-me com a presença mínima de 75% e as regras sobre ausências."],
  ["privacy","Comprometo-me com a confidencialidade e a proibição de gravar discussões."],
  ["contact","Autorizo o contato e o tratamento dos dados para avaliação desta candidatura."],
] as const;

const countWords = (value:string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

export default function ApplicationForm(){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState<Record<string,string>>({});
  const [topics,setTopics]=useState(["","",""]);
  const [checks,setChecks]=useState<Record<string,boolean>>({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);

  const update=(key:string,value:string)=>
    setForm(old=>({...old,[key]:value}));

  const next=()=>{
    setError("");
    for(const [key,label,required] of personalFields){
      if(required&&!form[key]?.trim()){
        setError("Preencha o campo: "+label);
        return;
      }
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email||"")){
      setError("Informe um e-mail válido.");
      return;
    }
    setStep(1);
  };

  async function submit(e:FormEvent){
    e.preventDefault();
    if(step!==1||busy)return;
    setError("");

    if(countWords(form.bio||"")<50){
      setError("Sua apresentação deve conter pelo menos 50 palavras.");
      return;
    }
    if(!topics[0]?.trim()){
      setError("Informe pelo menos o Tema 1.");
      return;
    }
    if(!["yes","no"].includes(form.availability||"")){
      setError("Informe sua disponibilidade para os encontros.");
      return;
    }
    if(commitments.some(([id])=>!checks[id])){
      setError("Confirme todos os compromissos.");
      return;
    }

    setBusy(true);
    try{
      const res=await fetch("/api/applications",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          ...form,
          name:[form.firstName,form.lastName].join(" ").trim(),
          topics,
          acceptStatute:checks.statute,
          acceptAttendance:checks.attendance,
          acceptPrivacy:checks.privacy,
          acceptContact:checks.contact,
          website:form.website||""
        })
      });
      const data=await res.json();
      if(!res.ok)throw Error(data.error||"Não foi possível enviar.");
      setDone(true);
    }catch(e){
      setError(e instanceof Error?e.message:"Falha de conexão.");
    }finally{
      setBusy(false);
    }
  }

  function field(id:string,label:string,required:boolean){
    return <label key={id} className="apply-field">
      <span>{label}{required&&<b> *</b>}</span>
      <input
        required={required}
        type={id==="email"?"email":id==="whatsapp"?"tel":"text"}
        autoComplete={
          id==="firstName"?"given-name":
          id==="lastName"?"family-name":
          id==="email"?"email":
          id==="whatsapp"?"tel":"off"
        }
        value={form[id]||""}
        onChange={e=>update(id,e.target.value)}
      />
    </label>;
  }

  if(done)return <div className="apply-success" role="status">
    <div className="apply-success-icon">✓</div>
    <span className="og-kicker">CANDIDATURA RECEBIDA</span>
    <h2>Obrigado por dar<br/><em>o primeiro passo.</em></h2>
    <p>
      Sua candidatura foi enviada com sucesso!
      Nossa equipe analisará suas informações e, em até 24 a 48 horas,
      você deverá receber um e-mail com a confirmação e, caso sua
      candidatura seja aprovada, as próximas instruções.
    </p>
    <p>
      <strong>Importante:</strong> Fique atento à sua caixa de entrada
      e verifique também as pastas de Spam ou Lixo Eletrônico,
      pois nossa mensagem poderá ser direcionada para lá.
    </p>
    <Link className="og-button og-button-teal" href="/">
      Voltar ao início ↗
    </Link>
  </div>;

  return <form className="apply-form" onSubmit={submit} noValidate>
    <div className="apply-progress-header">
      <span className="og-kicker">CANDIDATURA · OGRUPO</span>
      <span>ETAPA {step+1} DE 2</span>
    </div>
    <div className="apply-progress">
      <div style={{width:`${(step+1)*50}%`}}/>
    </div>

    {step===0&&<>
      <h2>Primeiro, <em>você.</em></h2>
      <p className="apply-intro">
        Toda conversa começa com uma apresentação.
        Conte-nos um pouco sobre quem você é.
      </p>
      <div className="apply-fields">
        {personalFields.map(([id,label,required])=>
          field(id,label,required)
        )}
      </div>
    </>}

    {step===1&&<>
      <h2>Sua história. <em>Suas ideias.</em></h2>
      <p className="apply-intro">
        Compartilhe um pouco da sua trajetória e dos assuntos
        que gostaria de trazer para nossas conversas.
      </p>

      <label className="apply-field">
        <span>Conte um pouco sobre você <b>*</b></span>
        <textarea
          required
          rows={5}
          maxLength={4000}
          value={form.bio||""}
          onChange={e=>update("bio",e.target.value)}
          placeholder="Fale sobre sua trajetória, experiências profissionais, hobbies, interesses e o que gosta de fazer..."
        />
      </label>
      <div className="apply-word-count">
        <span>Mínimo de 50 palavras</span>
        <span>
          {countWords(form.bio||"")} / 50 palavras
        </span>
      </div>

      <h3>Temas para compartilhar</h3>
      <p className="apply-intro">
        Sugira até três assuntos em ordem de preferência.
        Apenas o primeiro é obrigatório.
      </p>
      <div className="apply-fields">
        {topics.map((value,i)=>
          <label key={i} className="apply-field">
            <span>Tema {i+1}{i===0&&<b> *</b>}</span>
            <input
              value={value}
              onChange={e=>setTopics(old=>
                old.map((v,j)=>j===i?e.target.value:v)
              )}
            />
          </label>
        )}
      </div>

      <div className="apply-availability">
        <p>
          <strong>
            Você pode participar dos encontros quinzenais às
            quintas-feiras, das 19h30 às 21h?
          </strong>
        </p>
        <div className="apply-radio-options">
          <label>
            <input type="radio" name="availability"
              checked={form.availability==="yes"}
              onChange={()=>update("availability","yes")}/>
            Sim
          </label>
          <label>
            <input type="radio" name="availability"
              checked={form.availability==="no"}
              onChange={()=>update("availability","no")}/>
            Não
          </label>
        </div>
      </div>

      <div className="apply-commitments">
        <h3>Nosso compromisso</h3>
        <p>
          Antes de confirmar, leia o{" "}
          <Link href="/estatuto" target="_blank" rel="noopener noreferrer">
            Estatuto 3.0 ↗
          </Link>.
        </p>
        {commitments.map(([id,label])=>
          <label key={id} className="apply-check">
            <input type="checkbox"
              checked={!!checks[id]}
              onChange={e=>setChecks(old=>({
                ...old,[id]:e.target.checked
              }))}/>
            <span>{label}</span>
          </label>
        )}
      </div>
    </>}

    <label className="honeypot" aria-hidden="true">
      Website
      <input tabIndex={-1} autoComplete="off"
        value={form.website||""}
        onChange={e=>update("website",e.target.value)}/>
    </label>

    {error&&<p className="apply-error" role="alert">{error}</p>}

    <div className="apply-actions">
      {step===1&&
        <button type="button" className="apply-back"
          onClick={()=>{setError("");setStep(0)}}>
          ← Voltar
        </button>
      }
      {step===0?
        <button type="button" className="apply-next" onClick={next}>
          Continuar ↗
        </button>:
        <button type="submit" className="apply-next" disabled={busy}>
          {busy?"Enviando...":"Enviar candidatura ↗"}
        </button>
      }
    </div>
  </form>;
}
