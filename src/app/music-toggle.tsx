"use client";
import { useState } from "react";
export default function MusicToggle(){
  const [open,setOpen]=useState(false);
  return <>
    <button className={"music-toggle"+(open?" is-playing":"")} type="button" onClick={()=>setOpen(!open)} aria-label={open?"Fechar vídeo musical":"Abrir vídeo musical"} aria-expanded={open}>
      <span className="music-bars" aria-hidden="true"><i/><i/><i/></span>
      <span className="music-label">Música <strong>{open?"ON":"OFF"}</strong></span>
    </button>
    {open&&<aside className="music-player" aria-label="Player de música">
      <div className="music-player-heading"><span>Burning Heart · Survivor</span><button onClick={()=>setOpen(false)} type="button" aria-label="Fechar player">×</button></div>
      <iframe title="Burning Heart — YouTube" src="https://www.youtube-nocookie.com/embed/7WhjoreV3hw?autoplay=1&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
      <p>Reprodução pelo player oficial do YouTube. Se não iniciar, pressione play.</p>
    </aside>}
  </>
}
