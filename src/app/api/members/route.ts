import {NextRequest,NextResponse} from "next/server";
import {adminAuth,db} from "@/lib/firebase-admin";



export async function GET(req:NextRequest){
  const token=req.headers.get("authorization")?.replace(/^Bearer /,"");
  if(!token)
    return NextResponse.json({error:"Autenticação necessária."},{status:401});

  try{
    const decoded=await adminAuth().verifyIdToken(token,true);
    const email=decoded.email?.trim().toLowerCase();

    if(!email||!decoded.email_verified)
      return NextResponse.json({error:"E-mail não verificado."},{status:403});

    const matches=await db().collection("members")
      .where("email","==",email).limit(10).get();

    const member=matches.docs.find(d=>{
      const m=d.data();
      return m.authUid===decoded.uid&&
        m.status==="active"&&m.directoryConsent===true;
    });

    if(!member)
      return NextResponse.json({error:"Membro não ativado."},{status:403});

    const all=await db().collection("members")
      .where("status","==","active").limit(200).get();

    const directory=all.docs
      .filter(d=>d.data().directoryConsent===true)
      .map(doc=>{
        const m=doc.data();
        return {
          id:doc.id,
          name:String(m.name||""),
          profession:String(m.profession||""),
          bio:String(m.bio||""),
          email:String(m.email||""),
          whatsapp:String(m.whatsapp||""),
          photoUrl:typeof m.photoUrl==="string"&&
            /^https:\/\//.test(m.photoUrl)?m.photoUrl:"",
          foundingMember:Boolean(m.foundingMember)
        };
      })
      .sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));

    return NextResponse.json({
      member:{name:String(member.data().name||""),email},
      directory
    },{headers:{"Cache-Control":"private, no-store"}});
  }catch{
    return NextResponse.json({
      error:"Não foi possível verificar sua sessão."
    },{status:401});
  }
}
