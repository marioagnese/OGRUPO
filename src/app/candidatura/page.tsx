import Link from "next/link";
import ApplicationForm from "./application-form";

export const metadata = {
  title: "Torne-se um membro | oGrupo",
  description: "Candidate-se para participar do oGrupo.",
};

export default function Candidatura() {
  return (
    <>
      <section className="apply-hero">
        <div className="wrap">
          <span className="og-kicker">UM CONVITE PARA PARTICIPAR</span>
          <h1>Toda boa conversa<br/><em>começa com alguém.</em></h1>
          <p>
            Queremos conhecer sua história, suas ideias e o que você
            gostaria de compartilhar. Não buscamos currículos perfeitos.
            Buscamos curiosidade, autenticidade e vontade de participar.
          </p>
          <div className="apply-hero-steps">
            <span>01 / Quem é você</span>
            <span>02 / Suas ideias</span>
            <span>03 / Nosso compromisso</span>
          </div>
        </div>
      </section>

      <section className="wrap apply-layout">
        <aside className="apply-aside">
          <span className="og-kicker">ANTES DE COMEÇAR</span>
          <h2>Mais que um cadastro.<br/><em>Um primeiro encontro.</em></h2>
          <p>
            Cada candidatura é analisada individualmente.
            A inscrição não garante admissão.
          </p>
          <p>
            O que nos aproxima não são títulos ou profissões,
            mas a disposição de compartilhar experiências e
            aprender uns com os outros.
          </p>
          <Link href="/estatuto">Conheça nosso estatuto ↗</Link>
        </aside>
        <div className="apply-card">
          <ApplicationForm />
        </div>
      </section>
    </>
  );
}
