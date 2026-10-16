"use client";
import {useState} from "react";
import Link from "next/link";
import MusicToggle from "./music-toggle";

export default function SiteNavigation(){
  const [open,setOpen]=useState(false);
  const close=()=>setOpen(false);
  return <>
    <div className="nav-links nav-desktop">
      <Link href="/">Início</Link>
      <Link href="/sobre">Sobre</Link>
      <Link href="/estatuto">Estatuto</Link>
      <Link href="/#encontros">Encontros</Link>
      <Link href="/login">Entrar</Link>
      <MusicToggle/>
      <Link className="nav-cta" href="/candidatura">Torne-se um membro ↗</Link>
    </div>
    <div className="nav-mobile-actions">
      <Link className="nav-mobile-login" href="/login" onClick={close}>Entrar</Link>
      <button type="button" className="nav-menu-button" aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} aria-controls="mobile-site-menu" onClick={()=>setOpen(v=>!v)}>
        <span aria-hidden="true">{open?"✕":"☰"}</span><span>Menu</span>
      </button>
    </div>
    {open&&<div id="mobile-site-menu" className="nav-mobile-menu">
      <Link href="/" onClick={close}>Início</Link>
      <Link href="/sobre" onClick={close}>Sobre</Link>
      <Link href="/estatuto" onClick={close}>Estatuto</Link>
      <Link href="/#encontros" onClick={close}>Encontros</Link>
      <Link href="/candidatura" onClick={close}>Torne-se um membro ↗</Link>
      <div className="nav-mobile-music"><MusicToggle/></div>
    </div>}
  </>;
}
