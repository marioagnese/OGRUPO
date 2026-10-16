import Link from "next/link";
function ConversationIcon(){
  return <svg viewBox="0 0 48 48" width="42" height="42"
    fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 12h23a6 6 0 0 1 6 6v11a6 6 0 0 1-6 6H19L10 41v-6a6 6 0 0 1-6-6V18a6 6 0 0 1 4-6z"/>
    <path d="M18 7h18a7 7 0 0 1 7 7v13"/>
    <path d="M13 22h16M13 28h11"/>
  </svg>
}
function TrustIcon(){
  return <svg viewBox="0 0 48 48" width="42" height="42"
    fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 4 41 11v12c0 11-7 17-17 21C14 40 7 34 7 23V11z"/>
    <path d="m15 24 6 6 12-13"/>
  </svg>
}
function TimeIcon(){
  return <svg viewBox="0 0 48 48" width="42" height="42"
    fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <circle cx="24" cy="24" r="19"/>
    <path d="M24 12v13l9 6"/>
    <path d="M20 4h8"/>
  </svg>
}
const features=[
{icon:ConversationIcon,title:"Conversas com propósito",body:"Cada encontro começa com uma ideia e cresce com a contribuição de todos."},
{icon:TrustIcon,title:"Confiança de verdade",body:"O que acontece no oGrupo permanece no oGrupo. Discussões não são gravadas."},
{icon:TimeIcon,title:"Presença é compromisso",body:"Encontros quinzenais, frequência mínima de 75% e respeito pelo tempo de todos."}
];
export default function Home(){return <>
<section className="og-hero" id="inicio"><div className="og-hero-photo" aria-hidden="true"/><div className="og-hero-shade" aria-hidden="true"/><div className="wrap og-hero-content"><span className="og-kicker">MORE THAN A CONVERSATION</span><h1>Grandes ideias raramente nascem no isolamento.<br/><em>Elas nascem na conversa.</em></h1><p className="og-hero-description">A liberdade de pensar em voz alta — e a oportunidade de sair de cada encontro com uma nova perspectiva.</p><div className="og-hero-actions"><Link className="og-button og-button-teal" href="/candidatura">Torne-se um membro <span aria-hidden="true">↗</span></Link></div><div className="og-hero-facts"><span>◎ &nbsp; Um círculo de ideias</span><span>◇ &nbsp; Vagas limitadas</span><span>♧ &nbsp; Convites individuais</span></div></div><a href="#filosofia" className="og-explore" aria-label="Explorar a página"><span>↓</span><small>EXPLORE</small></a></section>
<section className="og-philosophy" id="filosofia"><div className="wrap"><div className="og-philosophy-intro"><div><span className="og-kicker">NOSSA FILOSOFIA</span><h2>Todos têm algo<br/>a acrescentar.<br/><em>Todos têm algo<br/>a aprender.</em></h2></div><div className="og-philosophy-copy"><p>Não buscamos títulos, respostas prontas ou pessoas que pensam igual. Buscamos curiosidade, escuta e a coragem de compartilhar o que realmente importa.</p><Link href="/estatuto">Conheça os princípios do oGrupo ↗</Link></div></div><div className="og-principles">{features.map((f)=><article key={f.title} className="og-principle"><span className="og-principle-icon" aria-hidden="true"><f.icon/></span><h3>{f.title}</h3><p>{f.body}</p></article>)}</div></div></section>
<section className="og-experience" id="encontros"><div className="og-experience-image" role="img" aria-label="Homens conversando ao redor de uma fogueira"/><div className="og-experience-text"><span className="og-kicker">OS ENCONTROS</span><h2>Ideias melhores<br/><em>em boa companhia.</em></h2><p>Encontros quinzenais, em um ambiente reservado, com um tema apresentado por um integrante. Conversas profundas, diferentes perspectivas e conexões que vão além do esperado.</p><div className="og-meeting-stats"><span><strong>30 min</strong> para apresentar</span><span><strong>45 min</strong> para conversar</span></div><Link className="og-text-link" href="/estatuto">Como funcionam os encontros ↗</Link></div></section>
</>}