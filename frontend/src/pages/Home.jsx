import BrandMark from "../components/BrandMark";

const navLinks = [
  { href: "#ways-to-earn", label: "Ways to earn" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#rewards", label: "Rewards" },
  { href: "#payouts", label: "Payouts" },
  { href: "#faq", label: "FAQ" },
];

const earnCategories = [
  { icon: "game", title: "Play games", description: "Reach in-game milestones and get rewarded for your progress.", tag: "Games" },
  { icon: "survey", title: "Take surveys", description: "Share your opinion in short surveys from research partners.", tag: "Surveys" },
  { icon: "play", title: "Watch videos", description: "Pick videos from the activity list and earn when they complete.", tag: "Videos" },
  { icon: "tasks", title: "Complete offers", description: "Try apps, sign up for services and finish quick tasks.", tag: "Offers" },
  { icon: "spin", title: "Spin to win", description: "Use SPIN to try the wheel for a chance at bonus rewards.", tag: "Spin" },
  { icon: "users", title: "Invite friends", description: "Earn a referral credit when someone you invite qualifies.", tag: "Referrals" },
];

const steps = [
  { title: "Sign up", description: "Create a free VELOop account in a minute." },
  { title: "Pick activities", description: "Browse games, surveys, videos and offers open to you." },
  { title: "Collect rewards", description: "Credits land in your wallet and ledger once an activity is confirmed." },
  { title: "Cash out", description: "Request a withdrawal when you reach a payout's required VE balance." },
];

const currencies = [
  { code: "VE", note: "Main balance. Used for payout requirements." },
  { code: "SVE", note: "Secondary reward balance." },
  { code: "GEM", note: "Collectible reward currency." },
  { code: "TOKEN", note: "Special activity reward." },
  { code: "SPIN", note: "Spend on the reward wheel." },
];

const faqs = [
  { question: "Is VELOop free to join?", answer: "Creating an account is free. Activities and rewards available to you are shown after you sign in." },
  { question: "How much can I earn?", answer: "It depends on the activities available to your account and what you complete. No earnings are guaranteed." },
  { question: "How do I get paid?", answer: "Request a withdrawal from an active payout option once you meet its required VE balance. Methods and requirements are shown in the withdrawal flow." },
  { question: "Can I track my withdrawal?", answer: "Yes. Each request shows its status in your withdrawal history, from pending and processing to final." },
  { question: "Are activities always available?", answer: "No. Availability varies by account and changes over time. The categories on this page are informational." },
];

const iconArtwork = {
  play: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3z" /></>,
  survey: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  game: <><path d="M6 11h4m-2-2v4m7-1h.01M18 10h.01" /><path d="M6.5 7h11a4 4 0 0 1 3.9 4.9l-1.1 4.4a2 2 0 0 1-3.3 1l-2.1-1.8H9.1L7 17.3a2 2 0 0 1-3.3 1l-1.1-4.4A4 4 0 0 1 6.5 7Z" /></>,
  sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
  wallet: <><rect x="3" y="6" width="18" height="15" rx="3" /><path d="M3 10h18M16 15h2" /><path d="M6 6V4a1 1 0 0 1 1-1h11" /></>,
  tasks: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8 12 3 3 5-6" /></>,
  spin: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M12 3v7M12 14v7M3 12h7M14 12h7" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
};

function Icon({ name, className = "" }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconArtwork[name]}
    </svg>
  );
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500";
const display = { fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif' };
const ctaPrimary = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 text-sm font-bold text-neutral-950 shadow-[0_4px_0_0_#d9a900] transition hover:-translate-y-0.5 hover:bg-yellow-300 active:translate-y-0.5 active:shadow-none ${focus}`;

function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#fffdf8] text-neutral-950 antialiased">
      <style>{`
        html { scroll-behavior: smooth; }
        section[id] { scroll-margin-top: 80px; }
        @keyframes veloop-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes veloop-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .veloop-hero > * { animation: veloop-rise .6s ease-out both; }
        .veloop-hero > *:nth-child(2) { animation-delay: .08s; }
        .veloop-hero > *:nth-child(3) { animation-delay: .16s; }
        .veloop-hero > *:nth-child(4) { animation-delay: .24s; }
        .veloop-float { animation: veloop-float 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .veloop-hero > *, .veloop-float { animation: none; } html { scroll-behavior: auto; } }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-[#fffdf8]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 lg:px-8">
          <a href="/" className={`flex items-center gap-2 rounded-lg ${focus}`}>
            <BrandMark className="h-9 w-9 rounded-[10px]" />
            <span className="text-xl font-bold tracking-tight">VELOop<span className="text-yellow-500">.</span></span>
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className={`rounded text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950 ${focus}`}>{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="/login" className={`hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:text-black sm:block ${focus}`}>Log in</a>
            <a href="/register" className={`rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 active:scale-[0.98] ${focus}`}>Start earning</a>

            <details className="relative lg:hidden">
              <summary aria-label="Open menu" className={`flex h-10 w-10 cursor-pointer list-none flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white ${focus}`}>
                <span className="block h-0.5 w-4 rounded-sm bg-neutral-950" />
                <span className="block h-0.5 w-4 rounded-sm bg-neutral-950" />
                <span className="block h-0.5 w-4 rounded-sm bg-neutral-950" />
              </summary>
              <nav aria-label="Mobile" className="absolute right-0 top-12 grid w-[min(240px,calc(100vw-32px))] gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} className="rounded-md px-3 py-2.5 text-sm text-neutral-900 hover:bg-neutral-100">{l.label}</a>
                ))}
                <a href="/login" className="rounded-md px-3 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100">Log in</a>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-neutral-200">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="veloop-hero max-w-xl">
              <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[4.5rem]" style={display}>
                Get paid to play, survey and explore.
              </h1>
              <p className="mt-6 max-w-md text-[17px] leading-8 text-neutral-600">
                Complete games, surveys, videos and offers. Collect rewards in your wallet and cash out when you reach a payout requirement.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="/register" className={ctaPrimary}>Start earning free <Icon name="arrow" className="h-4 w-4" /></a>
                <a href="#how-it-works" className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 hover:border-neutral-500 ${focus}`}>See how it works</a>
              </div>
              <p className="mt-8 border-l-2 border-yellow-400 pl-4 text-xs leading-5 text-neutral-500">Activity availability varies by account. No earnings are guaranteed.</p>
            </div>

            <div role="img" aria-label="Illustration of the VELOop activity feed and wallet" className="relative mx-auto w-full max-w-[460px]">
              <div className="absolute -inset-3 -z-10 rotate-2 rounded-[32px] bg-yellow-300/40" />
              <div className="rounded-3xl bg-neutral-950 p-5 text-white shadow-[0_30px_70px_rgba(20,18,8,0.22)] sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrandMark className="h-8 w-8 rounded-[9px]" />
                    <span className="text-sm font-semibold">Earn</span>
                  </div>
                  <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold text-neutral-950">•••• VE</span>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2">
                  {["game", "survey", "play", "tasks"].map((k, i) => (
                    <div key={k} className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-[11px] font-semibold ${i === 0 ? "bg-yellow-300 text-neutral-950" : "bg-white/10 text-neutral-200"}`}>
                      <Icon name={k} className="h-5 w-5" />
                      {["Games", "Surveys", "Videos", "Offers"][i]}
                    </div>
                  ))}
                </div>

                <ul className="mt-4 space-y-2">
                  {[
                    { icon: "game", name: "Game milestone", meta: "Sample activity" },
                    { icon: "survey", name: "Quick survey", meta: "Sample activity" },
                    { icon: "tasks", name: "App offer", meta: "Sample activity" },
                  ].map((a) => (
                    <li key={a.name} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-yellow-300"><Icon name={a.icon} className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-neutral-400">{a.meta}</p>
                      </div>
                      <span className="rounded-lg bg-yellow-300 px-2.5 py-1 text-xs font-bold text-neutral-950">+•• VE</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="veloop-float absolute -bottom-5 -left-3 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg sm:-left-8">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-800"><Icon name="check" className="h-4 w-4" /></span>
                <div>
                  <p className="text-xs font-bold">Reward credited</p>
                  <p className="text-[11px] text-neutral-500">Illustration</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ways to earn */}
        <section id="ways-to-earn" className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl" style={display}>Six ways to earn, one account.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">Pick what fits your time. Mix and match whenever you like.</p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {earnCategories.map((c) => (
                <a key={c.title} href="/register" className={`group rounded-2xl border border-neutral-200 bg-[#fffdf8] p-6 transition hover:-translate-y-1 hover:border-yellow-400 hover:shadow-[0_16px_35px_rgba(35,33,20,0.08)] ${focus}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800 transition-colors group-hover:bg-yellow-300"><Icon name={c.icon} className="h-6 w-6" /></span>
                    <span className="text-xs font-semibold text-neutral-400">{c.tag}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-bold tracking-tight">{c.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{c.description}</p>
                </a>
              ))}
            </div>
            <p className="mt-5 text-sm text-neutral-500">Which categories are open depends on your account.</p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b border-neutral-200">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl" style={display}>From sign-up to cash-out in four steps.</h2>
            <ol className="mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
              {steps.map((s, i) => (
                <li key={s.title} className="relative">
                  {i < steps.length - 1 && <span aria-hidden="true" className="absolute left-12 top-5 hidden h-px w-[calc(100%-2rem)] border-t border-dashed border-yellow-500/60 md:block" />}
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold">{i + 1}</span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{s.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Rewards / currencies */}
        <section id="rewards" className="border-b border-neutral-200 bg-neutral-950 text-white">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8 lg:py-24">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl" style={display}>Five reward currencies, all in your wallet.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-neutral-300">Each activity can reward a different balance. Every credit is recorded in your ledger.</p>
            <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {currencies.map((c, i) => (
                <li key={c.code} className={`rounded-2xl p-5 ${i === 0 ? "bg-yellow-300 text-neutral-950" : "bg-white/8 ring-1 ring-white/10"}`}>
                  <p className="text-2xl font-bold tracking-tight">{c.code}</p>
                  <p className={`mt-2 text-sm leading-5 ${i === 0 ? "text-neutral-800" : "text-neutral-300"}`}>{c.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-neutral-400">Currency roles shown are a summary. Live balances appear after you sign in.</p>
          </div>
        </section>

        {/* Payouts */}
        <section id="payouts" className="border-b border-neutral-200 bg-yellow-50/70">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl" style={display}>Cash out when you're ready.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-neutral-600">Payout methods, values and required VE balances are set by VELOop. Sign in to see what applies to you, then submit a request and follow it to completion.</p>
              <a href="/register" className={`${ctaPrimary} mt-7`}>Create free account <Icon name="arrow" className="h-4 w-4" /></a>
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-white p-6 shadow-[0_16px_40px_rgba(48,39,10,0.07)]">
              <p className="text-sm font-bold">Your withdrawal, step by step</p>
              <ul className="mt-4 space-y-3">
                {[
                  { title: "Choose a payout option", detail: "Active methods are listed with their requirements" },
                  { title: "Meet the VE requirement", detail: "Shown next to each option" },
                  { title: "Submit and track", detail: "Pending, processing, then final status" },
                ].map((item) => (
                  <li key={item.title} className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400"><Icon name="check" className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-neutral-500">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-neutral-500">No payout amounts or live availability are shown on this page.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
            <h2 className="text-center text-4xl font-semibold tracking-tight" style={display}>Questions, answered.</h2>
            <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
              {faqs.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded text-left text-[15px] font-semibold marker:content-none ${focus}`}>
                    {item.question}
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 pr-10 text-sm leading-6 text-neutral-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-yellow-400">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-20 text-center lg:px-8">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl" style={display}>Your next reward is a few taps away.</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-neutral-800">Join VELOop, browse the activities open to you and start collecting.</p>
            <a href="/register" className={`mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-neutral-800 active:translate-y-0 ${focus}`}>
              Start earning free <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <BrandMark className="h-7 w-7 rounded-lg" />
              <span className="font-bold">VELOop</span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">Get paid to play, survey and explore.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-black">{l.label}</a>
            ))}
            <a href="/login" className="hover:text-black">Log in</a>
            <a href="/register" className="hover:text-black">Register</a>
          </nav>
        </div>
        <div className="border-t border-neutral-200">
          <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-neutral-400 lg:px-8">© {new Date().getFullYear()} VELOop. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export default Home;