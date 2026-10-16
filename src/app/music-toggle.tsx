"use client";
import { useEffect, useRef, useState } from "react";

/** A short, original ambient soundscape generated locally in the browser.
 * No third-party song or audio file is copied or distributed. */
export default function MusicToggle(){
  const [playing,setPlaying]=useState(false);
  const ctx=useRef<AudioContext|null>(null);
  const nodes=useRef<{osc:OscillatorNode;gain:GainNode}[]>([]);
  const stop=()=>{
    for(const {osc,gain} of nodes.current){
      try{gain.gain.setTargetAtTime(0,ctx.current?.currentTime||0,.3);osc.stop((ctx.current?.currentTime||0)+1)}catch{}
    }
    nodes.current=[];setPlaying(false);
  };
  useEffect(()=>()=>{for(const {osc} of nodes.current){try{osc.stop()}catch{}};void ctx.current?.close()},[]);
  const toggle=async()=>{
    if(playing){stop();return}
    try{
      const audio=ctx.current??new AudioContext();ctx.current=audio;await audio.resume();
      const notes=[110,164.81,220,261.63,329.63];
      const created:{osc:OscillatorNode;gain:GainNode}[]=[];
      notes.forEach((freq,i)=>{
        const osc=audio.createOscillator();const gain=audio.createGain();
        osc.type=i===0?"sine":"triangle";osc.frequency.value=freq;
        gain.gain.setValueAtTime(0,audio.currentTime);
        gain.gain.linearRampToValueAtTime(i===0?.035:.009,audio.currentTime+2.5);
        osc.connect(gain).connect(audio.destination);osc.start();created.push({osc,gain});
      });
      nodes.current=created;setPlaying(true);
    }catch{setPlaying(false)}
  };
  return <button className={"music-toggle"+(playing?" is-playing":"")} type="button" onClick={toggle} aria-label={playing?"Desligar música":"Ligar música ambiente"} aria-pressed={playing} title={playing?"Desligar som":"Ligar som ambiente"}>
    <span className="music-bars" aria-hidden="true"><i/><i/><i/></span>
    <span className="music-label">Som <strong>{playing?"ON":"OFF"}</strong></span>
  </button>
}
