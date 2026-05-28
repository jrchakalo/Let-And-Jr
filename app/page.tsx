import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center w-full overflow-x-hidden">
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="w-full min-h-screen flex flex-col items-center justify-center bg-cream relative px-6 py-20">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 py-5 text-[9px] md:text-[16px] tracking-[0.25em] uppercase text-navy/60">
          <div className="hidden md:grid md:grid-cols-3 items-center px-12">
            <span className="justify-self-start">Bem-vindos ao nosso casamento</span>
            <span className="font-serif text-lg md:text-2xl text-navy tracking-[0.15em] justify-self-center whitespace-nowrap">
              L <em className="not-italic font-ampersand">&</em> J
            </span>
            <span className="justify-self-end">O dia que Deus preparou para nós!</span>
          </div>

          <div className="md:hidden flex justify-center px-5">
            <span className="font-serif text-lg text-navy tracking-[0.15em] whitespace-nowrap">
              L <em className="not-italic font-ampersand">&</em> J
            </span>
          </div>
        </div>

        {/* Mobile subtitle */}
        <p className="md:hidden absolute top-16 text-center text-[9px] tracking-[0.2em] uppercase text-navy/50 px-4">
          Bem-vindos • O dia que Deus preparou para nós!
        </p>

        {/* Botanical illustration + title stacked */}
        <div className="relative flex flex-col items-center mt-8 mb-2">
          {/* Botanical image behind the title */}
          <div className="relative w-65 md:w-85 h-85 md:h-96 opacity-70">
            <Image
              src="/img/flor1.png"
              alt="Ilustração floral"
              fill
              className="object-contain mix-blend-multiply"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
          {/* Names overlaid in the center of the botanical */}
          <h1 className="absolute inset-0 flex items-center justify-center text-center text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-[0.12em] text-navy leading-none px-2">
            LETÍCIA{" "}
            <span className="text-2xl sm:text-3xl md:text-4xl mx-2 font-ampersand">
              &amp;
            </span>{" "}
            JÚNIOR
          </h1>
        </div>

        {/* Verse inside hero */}
        <div className="mt-8 flex flex-col items-center text-center max-w-xl">
          <p className="font-display text-base md:text-xl text-navy leading-relaxed italic">
            &ldquo;E lhes darei um mesmo coração, e um só caminho, para que me temam
            todos os dias, para seu bem e dos seus filhos depois deles.&rdquo;
          </p>
          <span className="mt-3 text-[10px] md:text-xs tracking-[0.25em] uppercase text-navy/50">
            Jeremias 32:39
          </span>
        </div>
      </section>

      {/* ─── COUNTDOWN ────────────────────────────────────────────────────── */}
      <section className="w-full bg-navy py-20 px-6 flex flex-col items-center text-center gap-4 border-t border-cream/20">
        <Countdown targetDate="2026-06-04T15:00:00-03:00" className="text-cream" />
        <p className="text-xs uppercase tracking-[0.3em] text-cream/80 mt-2">
          PARA O GRANDE DIA!
        </p>
      </section>

      {/* ─── QUANDO E ONDE ───────────────────────────────────────────────── */}
      <section className="w-full bg-cream py-24 px-6 flex flex-col items-center border-t border-navy/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 w-full max-w-4xl items-start text-center">
          {/* QUANDO */}
          <div className="flex flex-col items-center">
            <h3 className="text-xl md:text-2xl tracking-[0.25em] mb-8 text-navy">
              QUANDO?
            </h3>
            <div className="flex items-center justify-center gap-5 font-display text-navy">
              <div className="text-right leading-snug">
                <span className="block text-4xl md:text-5xl">04</span>
                <span className="block text-sm opacity-60">de</span>
                <span className="block text-2xl md:text-3xl">Junho</span>
              </div>
              <div className="h-20 w-px bg-navy/30 transform rotate-12 shrink-0" />
              <div className="text-left leading-snug">
                <span className="block text-4xl md:text-5xl">15:00</span>
                <span className="block text-sm opacity-60">da</span>
                <span className="block text-2xl md:text-3xl">Tarde</span>
              </div>
            </div>
            <div className="mt-6">
              <AddToCalendarButton />
            </div>
          </div>

          {/* Botanical center illustration */}
          <div className="relative h-56 md:h-64 w-full flex justify-center opacity-70">
            <Image
              src="/img/flor2.png"
              alt="Lírios"
              fill
              className="object-contain mix-blend-multiply"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* ONDE */}
          <div className="flex flex-col items-center">
            <h3 className="text-xl md:text-2xl tracking-[0.25em] mb-8 text-navy">
              ONDE?
            </h3>
            <p className="font-display text-xl md:text-2xl text-navy leading-relaxed">
              Chácara Nossa
              <br />
              Senhora Desatadora
              <br />
              dos Nós.
            </p>
            <a
              href="https://maps.app.goo.gl/svMZqRdS9tzEdzyx5"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block border border-navy/40 px-5 py-2 text-[10px] uppercase tracking-widest text-navy hover:bg-navy hover:text-cream transition-colors duration-200"
            >
              Acesse a localização!
            </a>
          </div>
        </div>
      </section>

      {/* ─── MAPA ─────────────────────────────────────────────────────────── */}
      <section className="w-full bg-cream pb-24 px-6 flex flex-col items-center">
        <div className="w-full max-w-3xl h-72 md:h-80 overflow-hidden border border-navy/10">
          <iframe
            src="https://www.google.com/maps?q=-8.190432,-35.749945&z=17&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="Localização — Chácara Nossa Senhora Desatadora dos nós"
          />
        </div>
      </section>

      {/* ─── NOSSA HISTÓRIA ───────────────────────────────────────────────── */}
      <section className="w-full bg-navy text-cream py-24 px-6 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/nos2.jpg"
            alt="Nossa história"
            fill  
            className="object-cover object-[10%_70%] opacity-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[#283b63]/85" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <h2 className="text-2xl md:text-4xl tracking-[0.2em] mb-10">
            NOSSA HISTÓRIA
          </h2>
          <p className="max-w-2xl font-display text-base md:text-lg leading-relaxed text-cream/90">
            Duas histórias que Deus teceu com cuidado para se tornarem uma só.
            Foi na simplicidade do cotidiano que percebemos: o amor que
            construímos não é acidente — é propósito. Cada conversa, cada
            descoberta, cada oração compartilhada nos trouxe até aqui. E hoje,
            de coração cheio e olhos voltados para Ele, escolhemos caminhar
            juntos. Para sempre.
          </p>
        </div>
      </section>

      {/* ─── DETALHES E INFOS ─────────────────────────────────────────────── */}
      <section className="w-full bg-cream py-24 px-6 flex flex-col items-center border-t border-navy/10">
        <h2 className="text-2xl md:text-4xl tracking-[0.2em] mb-16 text-center text-navy">
          ALGUNS DETALHES E INFOS...
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto text-center">
          {/* Trajes */}
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 flex items-center justify-center border border-navy/20 rounded-full text-navy/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>
            </div>
            <p className="text-sm md:text-base tracking-wider leading-relaxed text-navy/70">
              Pedimos gentilmente que os convidados evitem trajes na{" "}
              <strong className="text-navy">cor azul em qualquer tom.</strong>
            </p>
          </div>

          {/* Convite individual */}
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 flex items-center justify-center border border-navy/20 rounded-full text-navy/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 14.5 5-5"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 9.5 5 5"/>
              </svg>
            </div>
            <p className="text-sm md:text-base tracking-wider leading-relaxed text-navy/70">
              O convite de cada um é{" "}
              <strong className="text-navy">individual</strong> e apenas para
              aqueles que o receberam.
            </p>
          </div>

          {/* Bebidas */}
          <div className="flex flex-col items-center gap-5">
            <div className="w-16 h-16 flex items-center justify-center border border-navy/20 rounded-full text-navy/40">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 13v5"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 11.47V8"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 11h1a3 3 0 0 1 2.745 4.211"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2 2 20 20"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.536 7.535C6.766 7.649 6.154 8 5.5 8a2.5 2.5 0 0 1-1.768-4.268"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.727 3.204C9.306 2.767 9.885 2 11 2c1.56 0 2 1.5 3 1.5s1.72-.5 2.5-.5a1 1 0 1 1 0 5c-.78 0-1.5-.5-2.5-.5a3.149 3.149 0 0 0-.842.12"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.6V18"/>
              </svg>
            </div>
            <p className="text-sm md:text-base tracking-wider leading-relaxed text-navy/70">
              Agradecemos a compreensão de todos para a{" "}
              <strong className="text-navy">
                não entrada de bebidas alcoólicas
              </strong>{" "}
              no local.
            </p>
          </div>
        </div>
      </section>

      {/* ─── LISTA DE PRESENTES ───────────────────────────────────────────── */}
      <section className="w-full bg-navy text-cream py-32 px-6 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-5xl tracking-[0.2em] mb-3">
          SE DESEJAR
        </h2>
        <h2 className="text-3xl md:text-5xl tracking-[0.2em] mb-8">
          NOS PRESENTEAR
        </h2>
        <p className="font-display text-base md:text-lg leading-relaxed mb-14 text-cream/80 max-w-md">
          Cada presente é um pedacinho do seu coração chegando até nós. Se
          desejar nos agraciar, fizemos uma listinha com muito carinho — mas
          acima de tudo, sua presença já é o presente mais precioso que
          poderíamos receber.
        </p>
        <Link
          href="/presentes"
          className="border border-cream/70 px-10 py-4 text-xs tracking-[0.25em] uppercase text-cream hover:bg-cream hover:text-navy transition-colors duration-300"
        >
          Acesse a lista de presentes!
        </Link>
      </section>

      {/* ─── ENCERRAMENTO ─────────────────────────────────────────────────── */}
      <section className="w-full bg-cream py-28 px-6 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-5xl tracking-[0.2em] mb-4 text-navy">
          NOS VEMOS NO GRANDE DIA!
        </h2>
        <p className="text-sm md:text-lg tracking-[0.15em] text-navy/60">
          Preparem as orações, as lágrimas e os corações...
        </p>
      </section>

      {/* ─── FOOTER BAR ───────────────────────────────────────────────────── */}
      <footer className="w-full bg-navy text-cream py-6 flex justify-center">
        <span className="font-display text-base md:text-xl tracking-[0.3em] uppercase">
          Letícia <em className="not-italic italic font-ampersand">&amp;</em> Júnior
        </span>
      </footer>
    </main>
  );
}
