import {NextRequest,NextResponse} from "next/server";
import {adminAuth,db} from "@/lib/firebase-admin";
import {randomBytes} from "node:crypto";



async function authorized(req:NextRequest){
  const token=req.headers.get("authorization")?.replace(/^Bearer /,"");
  if(!token)return false;
  try{
    const user=await adminAuth().verifyIdToken(token,true);
    const allowed=(process.env.OGRUPO_ADMIN_EMAILS||"")
      .split(",").map(s=>s.trim().toLowerCase());
    return Boolean(
      user.email_verified&&user.email&&
      allowed.includes(user.email.toLowerCase())
    );
  }catch{return false}
}

const validId=(id:unknown)=>
  typeof id==="string"&&/^[A-Za-z0-9_-]{10,128}$/.test(id);

export async function GET(req:NextRequest){
  if(!await authorized(req))
    return NextResponse.json({error:"Não autorizado"},{status:403});
  const snap=await db().collection("applications")
    .orderBy("createdAt","desc").limit(100).get();
  return NextResponse.json({
    items:snap.docs.map(d=>({id:d.id,...d.data()}))
  },{headers:{"Cache-Control":"no-store"}});
}

async function invite(email:string,name:string){
  const apiKey=process.env.RESEND_API_KEY;
  const sender=process.env.OGRUPO_FROM_EMAIL;
  const site=process.env.OGRUPO_SITE_URL;

  if(!apiKey||!sender||!site)
    throw Error("Configure RESEND_API_KEY, OGRUPO_FROM_EMAIL e OGRUPO_SITE_URL.");

  const origin=new URL(site).origin;
  if(!origin.startsWith("https://"))
    throw Error("OGRUPO_SITE_URL deve usar HTTPS.");

  const link=await adminAuth().generatePasswordResetLink(email,{
    url:origin+"/ativar"
  });

  const html=`
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172d35">
      <h1>Bem-vindo ao oGrupo</h1>
      <p>Olá, ${escapeHtml(name)}.</p>
      <p>Sua candidatura foi aprovada. Você está convidado a
      ativar sua conta e participar do nosso círculo.</p>
      <p>Use o botão abaixo para definir sua senha.</p>
      <p style="margin:30px 0">
        <a href="${escapeHtml(link)}"
          style="background:#138f9a;color:white;padding:15px 24px;
          text-decoration:none;border-radius:8px">
          Ativar minha conta
        </a>
      </p>
      <p>Depois, entre no site, verifique seu e-mail e confirme
      a autorização de compartilhamento do seu perfil.</p>
      <p>Se não solicitou participação, ignore esta mensagem.</p>
      <p>oGrupo</p>
    </div>`;

  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      Authorization:"Bearer "+apiKey,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      from:"oGrupo <"+sender+">",
      to:[email],
      subject:"Seu convite para o oGrupo",
      html
    }),
    cache:"no-store"
  });

  const result=await response.json().catch(()=>({}));
  if(!response.ok)
    throw Error("Resend: "+String(result.message||response.status));

  return String(result.id||"sent");
}

function escapeHtml(value:string){
  return value.replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  })[c]||c);
}

export async function PATCH(req:NextRequest){
  if(!await authorized(req))
    return NextResponse.json({error:"Não autorizado"},{status:403});

  let body;
  try{body=await req.json()}
  catch{return NextResponse.json({error:"Dados inválidos"},{status:400})}

  const {id,status}=body;
  if(!validId(id)||!["approved","rejected","pending"].includes(status))
    return NextResponse.json({error:"Dados inválidos"},{status:400});

  const database=db();
  const ref=database.collection("applications").doc(id);
  const snap=await ref.get();
  if(!snap.exists)
    return NextResponse.json({error:"Candidatura não encontrada."},{status:404});

  const data=snap.data()!;
  const email=String(data.email||"").trim().toLowerCase();
  const name=String(data.name||"").trim();
  const memberRef=database.collection("members").doc(id);

  if(status!=="approved"){
    await database.runTransaction(async tx=>{
      const latest=await tx.get(ref);
      if(!latest.exists)throw Error("NOT_FOUND");
      tx.update(ref,{status,reviewedAt:new Date().toISOString()});
      tx.delete(memberRef);
    });
    return NextResponse.json({ok:true});
  }

  if(!email||!name)
    return NextResponse.json(
      {error:"Candidatura sem nome ou e-mail."},{status:400}
    );

  try{
    let authUser;
    try{
      authUser=await adminAuth().getUserByEmail(email);
    }catch(e){
      if((e as {code?:string}).code!=="auth/user-not-found")
        throw e;
      authUser=await adminAuth().createUser({
        email,
        displayName:name,
        password:randomBytes(48).toString("hex"),
        emailVerified:false
      });
    }

    const existing=await memberRef.get();
    const old=existing.data();
    if(old?.authUid&&old.authUid!==authUser.uid)
      throw Error("Conta vinculada a outro usuário.");

    const now=new Date().toISOString();
    await database.runTransaction(async tx=>{
      const latest=await tx.get(ref);
      if(!latest.exists)throw Error("NOT_FOUND");
      tx.update(ref,{status:"approved",reviewedAt:now});
      tx.set(memberRef,{
        applicationId:id,
        authUid:authUser.uid,
        name,
        email,
        profession:String(data.profession||""),
        bio:String(data.bio||""),
        whatsapp:String(data.whatsapp||""),
        topics:Array.isArray(data.topics)?data.topics:[],
        status:old?.status==="active"?"active":"pending_activation",
        directoryConsent:old?.directoryConsent===true,
        updatedAt:now
      },{merge:true});
    });

    if(old?.status==="active")
      return NextResponse.json({ok:true,alreadyActive:true});

    try{
      const resendId=await invite(email,name);
      await memberRef.update({
        invitationSentAt:new Date().toISOString(),
        invitationId:resendId,
        invitationError:null
      });
      return NextResponse.json({ok:true,invitationSent:true});
    }catch(e){
      const reason=e instanceof Error?e.message:"Falha no envio";
      await memberRef.update({invitationError:reason});
      return NextResponse.json({
        ok:false,
        approved:true,
        invitationSent:false,
        error:"Candidatura aprovada, mas o convite não foi enviado: "+reason+
          " Clique em Aprovar novamente para tentar reenviar."
      },{status:502});
    }
  }catch(e){
    console.error("Approval failed",e);
    return NextResponse.json({
      error:"Não foi possível concluir a aprovação."
    },{status:500});
  }
}

export async function DELETE(req:NextRequest){
  if(!await authorized(req))
    return NextResponse.json({error:"Não autorizado"},{status:403});

  let body;
  try{body=await req.json()}
  catch{return NextResponse.json({error:"Dados inválidos"},{status:400})}

  if(!validId(body?.id))
    return NextResponse.json({error:"ID inválido"},{status:400});

  const database=db();
  const ref=database.collection("applications").doc(body.id);
  try{
    await database.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists)throw Error("NOT_FOUND");
      tx.delete(ref);
      tx.delete(database.collection("members").doc(body.id));
    });
    return NextResponse.json({ok:true});
  }catch{
    return NextResponse.json({
      error:"Registro não encontrado."
    },{status:404});
  }
}
