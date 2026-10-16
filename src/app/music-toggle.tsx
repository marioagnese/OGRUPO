"use client";
import { useEffect, useRef, useState } from "react";
export default function MusicToggle(){
 const video=useRef<HTMLVideoElement>(null);
 const [playing,setPlaying]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{return ()=>{video.current?.pause()}},[]);
 async function toggle(){
   if(!video.current)return;
   if(playing){video.current.pause();setPlaying(false);return}
   try{setError(false);video.current.volume=.65;await video.current.play();setPlaying(true)}
   catch{setPlaying(false);setError(true)}
 }
 return <>
 <button className={"music-toggle"+(playing?" is-playing":"")} type="button" onClick={toggle} aria-label={playing?"Pausar música":"Tocar música"} aria-pressed={playing} title={error?"Verifique o arquivo MP4 na pasta public":"Música ambiente"}>
 <span className="music-bars" aria-hidden="true"><i/><i/><i/></span><span className="music-label">Música <strong>{playing?"ON":"OFF"}</strong></span></button>
 <video ref={video} src="/WhatsApp%20Video%202026-10-16%20at%208.20.01%20AM.mp4" loop playsInline preload="none" aria-hidden="true" style={{display:"none"}} onEnded={()=>setPlaying(false)} onError={()=>{setPlaying(false);setError(true)}}/>
 </>
}
