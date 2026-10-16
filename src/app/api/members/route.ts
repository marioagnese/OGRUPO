import {NextRequest,NextResponse} from "next/server";
import {adminAuth,db} from "@/lib/firebase-admin";
import {getStorage} from "firebase-admin/storage";



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

    const bucket=getStorage().bucket("ogrupo-a29d4.firebasestorage.app");
    async function photo(m:Record<string,unknown>){
      const path=typeof m.photoPath==="string"?m.photoPath:"";
      if(path.startsWith("member-photos/")){
        try{const [url]=await bucket.file(path).getSignedUrl({action:"read",expires:Date.now()+60*60*1000});return url;}catch{return "";}
      }
      return typeof m.photoUrl==="string"&&/^https:\/\//.test(m.photoUrl)?m.photoUrl:"";
    }
    const directory=await Promise.all(all.docs
      .filter(d=>d.data().directoryConsent===true)
      .map(async doc=>{
        const m=doc.data();
        return {
          id:doc.id,
          name:String(m.name||""),
          profession:String(m.profession||""),
          bio:String(m.bio||""),
          email:String(m.email||""),
          whatsapp:String(m.whatsapp||""),
          photoUrl:await photo(m),
          foundingMember:Boolean(m.foundingMember),
          companies:String(m.companies||""),
          education:String(m.education||""),
          languages:String(m.languages||""),
          interests:String(m.interests||""),
          city:String(m.city||""),
          circleId:String(m.circleId||"")
        };
      }));
    directory.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));

    const own=member.data();
    const meetingsSnap=await db().collection("meetings").orderBy("startsAt","asc").limit(100).get();
    const meetings=meetingsSnap.docs.map(d=>{
      const m=d.data();
      return {id:d.id,title:String(m.title||""),startsAt:String(m.startsAt||""),
        location:String(m.location||""),description:String(m.description||""),
        circleId:String(m.circleId||"")};
    }).filter(m=>m.title&&m.startsAt&&(!m.circleId||m.circleId===String(own.circleId||"")));
    return NextResponse.json({
      member:{id:member.id,name:String(own.name||""),email,
        profession:String(own.profession||""),bio:String(own.bio||""),
        companies:String(own.companies||""),education:String(own.education||""),
        languages:String(own.languages||""),interests:String(own.interests||""),
        city:String(own.city||""),photoUrl:await photo(own),
        whatsapp:String(own.whatsapp||""),circleId:String(own.circleId||"")},
      meetings,
      directory
    },{headers:{"Cache-Control":"private, no-store"}});
  }catch{
    return NextResponse.json({
      error:"Não foi possível verificar sua sessão."
    },{status:401});
  }
}
