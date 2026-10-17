import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {db} from "@/lib/firebase-admin";

const clean=(v:unknown,max=500)=>
  typeof v==="string"?v.trim().slice(0,max):"";

const countWords=(v:string)=>
  v.trim().split(/\s+/).filter(Boolean).length;

export async function POST(req:NextRequest){
  if(process.env.OGRUPO_APPLICATIONS_ENABLED!=="true")
    return NextResponse.json(
      {error:"Candidaturas ainda não estão abertas."},{status:503}
    );

  const origin=req.headers.get("origin");
  if(!origin||origin!==new URL(req.url).origin)
    return NextResponse.json(
      {error:"Origem não autorizada."},{status:403}
    );

  const length=Number(req.headers.get("content-length")||0);
  if(length>12000)
    return NextResponse.json(
      {error:"Dados muito extensos."},{status:413}
    );

  try{
    const v=await req.json();
    if(clean(v.website))
      return NextResponse.json({ok:true},{status:201});

    const firstName=clean(v.firstName,60);
    const lastName=clean(v.lastName,60);
    const name=[firstName,lastName].filter(Boolean).join(" ");
    const email=clean(v.email,200).toLowerCase();
    const whatsapp=clean(v.whatsapp,40);
    const bio=clean(v.bio,4000);
    const availability=clean(v.availability,10);
    const profession=clean(v.profession,120);
    const referral=clean(v.referral,120);
    const topics=Array.isArray(v.topics)
      ?v.topics.slice(0,3).map((x:unknown)=>clean(x,200))
      :[];

    if(
      !firstName||!lastName||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
      !whatsapp||!referral||
      countWords(bio)<50||
      !["yes","no"].includes(availability)||
      !topics[0]||
      v.acceptStatute!==true||
      v.acceptAttendance!==true||
      v.acceptPrivacy!==true||
      v.acceptContact!==true
    ){
      return NextResponse.json(
        {error:"Confira os campos obrigatórios, a apresentação de 50 palavras e os compromissos."},
        {status:400}
      );
    }

    const hash=createHash("sha256").update(email).digest("hex");
    const database=db();
    const ref=database.collection("applications").doc("email_"+hash);

    const saved=await database.runTransaction(async tx=>{
      const previous=await tx.get(ref);
      if(previous.exists)return false;
      const now=new Date().toISOString();
      tx.create(ref,{
        name,firstName,lastName,email,whatsapp,bio,
        availability,profession,referral,topics,
        status:"pending",
        statuteVersion:"3.0",
        acceptedAt:now,createdAt:now
      });
      return true;
    });

    if(!saved)
      return NextResponse.json(
        {error:"Já existe uma candidatura com este e-mail. Entre em contato com a administração."},
        {status:409}
      );

    return NextResponse.json({ok:true},{status:201});
  }catch(e){
    console.error("Application submission failed",e);
    return NextResponse.json(
      {error:"Não foi possível enviar."},{status:500}
    );
  }
}
