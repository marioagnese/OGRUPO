import {NextRequest,NextResponse} from "next/server";
import {adminAuth,db} from "@/lib/firebase-admin";



export async function POST(req:NextRequest){
  const origin=req.headers.get("origin");
  if(!origin||origin!==new URL(req.url).origin)
    return NextResponse.json({error:"Origem não autorizada."},{status:403});

  const token=req.headers.get("authorization")?.replace(/^Bearer /,"");
  if(!token)
    return NextResponse.json({error:"Entre na sua conta."},{status:401});

  try{
    const decoded=await adminAuth().verifyIdToken(token,true);
    const email=decoded.email?.trim().toLowerCase();

    if(!email||!decoded.email_verified)
      return NextResponse.json({
        error:"Confirme seu endereço de e-mail antes de continuar."
      },{status:403});

    const body=await req.json();
    if(body.directoryConsent!==true)
      return NextResponse.json({
        error:"A autorização de compartilhamento é necessária."
      },{status:400});

    const database=db();
    const snap=await database.collection("members")
      .where("email","==",email).limit(10).get();

    const member=snap.docs.find(d=>{
      const m=d.data();
      return m.authUid===decoded.uid&&
        ["pending_activation","active"].includes(m.status);
    });

    if(!member)
      return NextResponse.json({
        error:"Nenhuma candidatura aprovada vinculada à sua conta."
      },{status:403});

    const application=await database.collection("applications")
      .doc(member.id).get();

    if(!application.exists||application.data()?.status!=="approved")
      return NextResponse.json({
        error:"A aprovação não está mais válida."
      },{status:403});

    await database.runTransaction(async tx=>{
      const current=await tx.get(member.ref);
      const currentApplication=await tx.get(application.ref);
      if(
        !current.exists||
        current.data()?.authUid!==decoded.uid||
        !["pending_activation","active"].includes(current.data()?.status)||
        currentApplication.data()?.status!=="approved"
      )throw Error("NOT_APPROVED");

      tx.update(member.ref,{
        status:"active",
        directoryConsent:true,
        directoryConsentAt:new Date().toISOString(),
        activatedAt:current.data()?.activatedAt||new Date().toISOString()
      });
    });

    return NextResponse.json({ok:true});
  }catch{
    return NextResponse.json({
      error:"Não foi possível ativar sua conta."
    },{status:403});
  }
}
