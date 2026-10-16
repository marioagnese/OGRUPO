import {NextRequest,NextResponse} from "next/server";
import {adminAuth,db} from "@/lib/firebase-admin";

async function currentMember(req:NextRequest){
  const token=req.headers.get("authorization")?.replace(/^Bearer /,"");
  if(!token) return null;
  const decoded=await adminAuth().verifyIdToken(token,true);
  if(!decoded.email_verified||!decoded.email)return null;
  const matches=await db().collection("members").where("email","==",decoded.email.trim().toLowerCase()).limit(10).get();
  return matches.docs.find(d=>d.data().authUid===decoded.uid&&d.data().status==="active"&&d.data().directoryConsent===true)||null;
}
const clean=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
export async function PATCH(req:NextRequest){
  const origin=req.headers.get("origin");
  const referer=req.headers.get("referer");
  const fetchSite=req.headers.get("sec-fetch-site");
  const browserSameOrigin=fetchSite==="same-origin"&&!!referer&&!!origin&&
    (()=>{try{return new URL(referer).origin===origin;}catch{return false;}})();
  const serverOrigin=new URL(req.url).origin;
  const proxyHost=req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host=req.headers.get("host")?.split(",")[0]?.trim();
  const hostOrigins=[proxyHost,host].filter((h):h is string=>Boolean(h)).flatMap(h=>[`https://${h}`,`http://${h}`]);
  if(!origin||!(browserSameOrigin||[serverOrigin,...hostOrigins].includes(origin)))
    return NextResponse.json({error:"Origem não autorizada."},{status:403});
  try{
    const member=await currentMember(req);
    if(!member)return NextResponse.json({error:"Acesso restrito."},{status:403});
    const body=await req.json();
    if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Dados inválidos."},{status:400});
    const fields=["profession","bio","companies","education","languages","interests","city","whatsapp"];
    for(const key of fields)if(body[key]!==undefined&&typeof body[key]!=="string")return NextResponse.json({error:"Dados inválidos."},{status:400});
    const updates={
      profession:clean(body.profession,120),bio:clean(body.bio,1200),
      companies:clean(body.companies,400),education:clean(body.education,400),
      languages:clean(body.languages,180),interests:clean(body.interests,400),
      city:clean(body.city,120),whatsapp:clean(body.whatsapp,40),
      updatedAt:new Date().toISOString()
    };
    await member.ref.update(updates);
    return NextResponse.json({ok:true,profile:updates},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Não foi possível salvar seu perfil."},{status:400});}
}
