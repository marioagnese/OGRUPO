"use client";
import { useState } from "react";
export default function MusicToggle(){
 const [open,setOpen]=useState(false);
 return <>
 <button className={"music-toggle"+(open?" is-playing":"")} type="button" onClick={()=>setOpen(v=>!v)} aria-label={open?"Fechar player musical":"Abrir player musical"} aria-expanded={open}>
 <span className="music-bars" aria-hidden="true"><i/><i/><i/></span><span className="music-label">Música <strong>{open?"ON":"OFF"}</strong></span></button>
 {open&&<aside className="music-mini-player" aria-label="Reprodução musical">
 <button className="music-mini-close" type="button" onClick={()=>setOpen(false)} aria-label="Fechar música">×</button>
 <iframe title="Survivor — Burning Heart" src="https://www.youtube-nocookie.com/embed/7WhjoreV3hw?autoplay=1&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
 </aside>}
 </>;
}
