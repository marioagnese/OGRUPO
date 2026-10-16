import {NextRequest,NextResponse} from "next/server";
import {adminAuth,db} from "@/lib/firebase-admin";
import {getStorage} from "firebase-admin/storage";

export async function POST(req:NextRequest){
  const origin=req.headers.get("origin");
  const allowed=new Set([new URL(req.url).origin,...[req.headers.get("x-forwarded-host"),req.headers.get("host")].filter(Boolean).map(h=>`https://${h!.split(",")[0].trim()}`)]);
  if(!origin||!allowed.has(origin))return NextResponse.json({error:"Origem não autorizada."},{status:403});
  try{
    const token=req.headers.get("authorization")?.replace(/^Bearer /,"");
    if(!token)return NextResponse.json({error:"Autenticação necessária."},{status:401});
    const decoded=await adminAuth().verifyIdToken(token,true);
    if(!decoded.email_verified||!decoded.email)return NextResponse.json({error:"E-mail não verificado."},{status:403});
    const matches=await db().collection("members").where("email","==",decoded.email.trim().toLowerCase()).limit(10).get();
    const member=matches.docs.find(d=>d.data().authUid===decoded.uid&&d.data().status==="active"&&d.data().directoryConsent===true);
    if(!member)return NextResponse.json({error:"Acesso restrito."},{status:403});
    const form=await req.formData();
    const photo=form.get("photo");
    if(!(photo instanceof File))return NextResponse.json({error:"Selecione uma foto."},{status:400});
    if(!["image/jpeg","image/png","image/webp"].includes(photo.type)||photo.size>2*1024*1024||photo.size===0)
      return NextResponse.json({error:"Envie JPG, PNG ou WebP de até 2 MB."},{status:400});
    const buffer=Buffer.from(await photo.arrayBuffer());
    const signature=buffer.subarray(0,12);
    const valid=photo.type==="image/jpeg"?signature[0]===255&&signature[1]===216&&signature[2]===255:
      photo.type==="image/png"?signature.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
      signature.subarray(0,4).toString()==="RIFF"&&signature.subarray(8,12).toString()==="WEBP";
    if(!valid)return NextResponse.json({error:"Formato de imagem inválido."},{status:400});
    const ext=photo.type==="image/jpeg"?"jpg":photo.type==="image/png"?"png":"webp";
    const path=`member-photos/${decoded.uid}/avatar.${ext}`;
    const bucket=getStorage().bucket("ogrupo-a29d4.firebasestorage.app");
    await bucket.file(path).save(buffer,{resumable:false,contentType:photo.type,metadata:{cacheControl:"private, max-age=3600"}});
    await member.ref.update({photoPath:path,photoUrl:"",updatedAt:new Date().toISOString()});
    const [photoUrl]=await bucket.file(path).getSignedUrl({action:"read",expires:Date.now()+60*60*1000});
    return NextResponse.json({ok:true,photoUrl},{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Não foi possível enviar a foto. Verifique a configuração do Firebase Storage."},{status:500});
  }
}
