import "./Home.css";
import BrandMark from "../components/BrandMark";

const earningMethods = [
  {
    icon: "play",
    title: "Watch Ads",
    description: "Ad rewards are recognized by VELOop; availability can vary.",
  },
  {
    icon: "survey",
    title: "Surveys",
    description: "An informational overview of survey opportunities when offered.",
  },
  {
    icon: "receipt",
    title: "Pay & Earn",
    description: "Explore paid activities when they are made available.",
  },
  {
    icon: "users",
    title: "UPI Refer & Earn",
    description: "Referral activity can be reflected in your account rewards.",
  },
  {
    icon: "game",
    title: "Play & Earn",
    description: "Game rewards are a supported reward type; activities may vary.",
  },
  {
    icon: "sparkle",
    title: "More activities",
    description: "Check your account for currently available reward options.",
  },
];

const steps = [
  {
    number: "01",
    icon: "sparkle",
    title: "Earn",
    description: "Explore activities that are currently available to you.",
  },
  {
    number: "02",
    icon: "wallet",
    title: "Build your balance",
    description: "Review your wallet balance and transaction activity.",
  },
  {
    number: "03",
    icon: "receipt",
    title: "Choose a reward",
    description: "Browse the payout options available in your account.",
  },
  {
    number: "04",
    icon: "arrow",
    title: "Redeem",
    description: "Submit a withdrawal request when you meet its requirements.",
  },
];

const iconArtwork = {
  play: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3z" /></>,
  survey: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /><path d="m7 8 .5.5L8.5 7.5" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  game: <><path d="M6 11h4m-2-2v4m7-1h.01M18 10h.01" /><path d="M6.5 7h11a4 4 0 0 1 3.9 4.9l-1.1 4.4a2 2 0 0 1-3.3 1l-2.1-1.8H9.1L7 17.3a2 2 0 0 1-3.3-1l-1.1-4.4A4 4 0 0 1 6.5 7Z" /></>,
  sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
  wallet: <><rect x="3" y="6" width="18" height="15" rx="3" /><path d="M3 10h18M16 15h2" /><path d="M6 6V4a1 1 0 0 1 1-1h11" /></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
};

function Icon({ name, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconArtwork[name]}
    </svg>
  );
}

function Home() {
  return (
    <div className="home-page min-h-screen bg-white text-neutral-950">

      {/* Navbar */}
      <header className="home-header sticky top-0 z-50 border-b border-neutral-200 bg-white/95">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">

          <a href="/" className="flex items-center gap-2">
            <BrandMark className="home-brand-mark h-10 w-10" />

            <span className="text-xl font-bold tracking-tight">
              VELOop
            </span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-neutral-600 transition hover:text-black"
            >
              How It Works
            </a>

            <a
              href="#ways-to-earn"
              className="text-sm font-medium text-neutral-600 transition hover:text-black"
            >
              Ways to Earn
            </a>

            <a
              href="#why-veloop"
              className="text-sm font-medium text-neutral-600 transition hover:text-black"
            >
              Why VELOop
            </a>
          </nav>

          <details className="home-mobile-menu md:hidden">
            <summary aria-label="Open navigation menu">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation">
              <a href="#how-it-works">How It Works</a>
              <a href="#ways-to-earn">Ways to Earn</a>
              <a href="#why-veloop">Why VELOop</a>
              <a href="/login">Log in</a>
            </nav>
          </details>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:text-black sm:block"
            >
              Log in
            </a>

            <a
              href="/register"
              className="home-button home-button-primary rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              Start Earning
            </a>
          </div>

        </div>
      </header>


      {/* Hero */}
      <main>

        <section className="home-hero overflow-hidden border-b border-neutral-200">
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8">

            {/* Hero copy */}
            <div className="home-hero-copy max-w-2xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                The rewards platform
              </div>

              <h1 className="home-title text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-neutral-950 sm:text-6xl lg:text-7xl">
                Make your time count with{" "}
                <span className="text-yellow-600">VELOop.</span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-600">
                Explore reward activities, follow your wallet, and see the
                payout options available to you.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                <a
                  href="/register"
                  className="home-button home-button-primary rounded-xl bg-yellow-400 px-7 py-3.5 text-center text-sm font-semibold text-black transition hover:bg-yellow-300"
                >
                  Start Earning
                </a>

                <a
                  href="#how-it-works"
                  className="rounded-xl border border-neutral-300 px-7 py-3.5 text-center text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
                >
                  How It Works
                </a>

              </div>

              <p className="home-availability mt-6 text-sm text-neutral-500">
                Activity availability can vary. No earnings are guaranteed.
              </p>

            </div>


            {/* Hero visual */}
            <div className="home-hero-visual" aria-label="Illustration of the VELOop wallet and reward activity">
              <div className="home-visual-label"><span /> Your rewards, in one place</div>
              <div className="home-wallet-preview">
                <div className="home-preview-topline">
                  <div className="home-preview-brand"><BrandMark /><div><strong>VELOop</strong><small>Rewards wallet</small></div></div>
                  <span className="home-preview-menu" aria-hidden="true">•••</span>
                </div>
                <div className="home-preview-balance">
                  <span>Wallet balance</span>
                  <strong>•••••• <small>VE</small></strong>
                  <p>Your balance, shown in your account</p>
                </div>
                <div className="home-preview-section-title"><strong>Wallet activity</strong><span>Recent</span></div>
                <div className="home-preview-activity"><span className="home-activity-icon"><Icon name="play" /></span><span><strong>Ad reward</strong><small>Reward activity</small></span><span className="home-activity-mark">+</span></div>
                <div className="home-preview-activity"><span className="home-activity-icon home-activity-icon-neutral"><Icon name="users" /></span><span><strong>Referral</strong><small>Account activity</small></span><span className="home-activity-mark">+</span></div>
                <div className="home-preview-footer"><Icon name="wallet" /><span>Balance and transactions</span><Icon name="arrow" /></div>
              </div>
              <div className="home-preview-caption"><span className="home-caption-dot" /> A product illustration, not a live account</div>
            </div>

          </div>
        </section>


        {/* Ways to earn */}
        <section
          id="ways-to-earn"
          className="border-b border-neutral-200 bg-neutral-50"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-600">
                Ways to earn
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Choose how you want to earn.
              </h2>

              <p className="mt-5 text-lg leading-8 text-neutral-600">
                Get a quick overview of reward activity types and check your
                account for what is currently available.
              </p>
            </div>


            <div className="home-method-grid mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {earningMethods.map((method) => (
                <div
                  key={method.title}
                  className="home-method-card group rounded-2xl border border-neutral-200 bg-white p-6 transition duration-200"
                >

                  <div className="home-icon-box flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-700">
                    <Icon name={method.icon} className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {method.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {method.description}
                  </p>

                  <span className="home-card-note">Activity overview</span>

                </div>
              ))}

            </div>

            <p className="home-method-disclaimer">Activity types are informational. Availability varies, and this page does not start activities or promise rewards.</p>

          </div>
        </section>


        {/* How it works */}
        <section
          id="how-it-works"
          className="border-b border-neutral-200 bg-white"
        >
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

            <div className="text-center">

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-600">
                How it works
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Simple from start to finish.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-neutral-600">
                Get started, complete activities, earn rewards and redeem when
                eligible.
              </p>

            </div>


            <div className="home-steps mt-16 grid gap-8 md:grid-cols-4">

              {steps.map((step, index) => (
                <div key={step.number} className="home-step relative">

                  <div className="home-step-icon">
                    <Icon name={step.icon} className="h-5 w-5" />
                    <span>{step.number}</span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {step.description}
                  </p>

                  {index < steps.length - 1 && (
                    <Icon name="arrow" className="home-step-arrow" />
                  )}

                </div>
              ))}

            </div>

          </div>
        </section>


        {/* Why VELOop */}
        <section
          id="why-veloop"
          className="home-value-section border-b border-neutral-200 bg-neutral-50"
        >
          <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:px-8">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-400">
                Why VELOop
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                The essentials, all in one account.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600">
                Keep track of wallet activity and explore the payout choices
                configured for your account.
              </p>

            </div>


            <div className="home-value-grid grid gap-3 sm:grid-cols-2">

              <div className="home-value-item rounded-2xl border border-neutral-200 bg-white p-6">
                <Icon name="wallet" className="home-value-icon" />

                <h3 className="mt-4 font-semibold">
                  Wallet overview
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Review your balance and transaction history from one place.
                </p>
              </div>


              <div className="home-value-item rounded-2xl border border-neutral-200 bg-white p-6">
                <Icon name="sparkle" className="home-value-icon" />

                <h3 className="mt-4 font-semibold">
                  Reward activity
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  See supported reward activity recorded in your wallet.
                </p>
              </div>


              <div className="home-value-item rounded-2xl border border-neutral-200 bg-white p-6">
                <Icon name="receipt" className="home-value-icon" />

                <h3 className="mt-4 font-semibold">
                  Payout options
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Browse configured options before starting a withdrawal.
                </p>
              </div>


              <div className="home-value-item rounded-2xl border border-neutral-200 bg-white p-6">
                <Icon name="arrow" className="home-value-icon" />

                <h3 className="mt-4 font-semibold">
                  Request tracking
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  Follow withdrawal requests through their account statuses.
                </p>
              </div>

            </div>

          </div>
        </section>


        {/* Final CTA */}
        <section className="home-final-cta bg-neutral-950">
          <div className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-8">

            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to start earning?
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-neutral-300">
              Create your VELOop account and explore the available ways to
              earn rewards.
            </p>

            <a
              href="/register"
              className="home-button home-button-primary mt-8 inline-flex rounded-xl bg-yellow-400 px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              Create an Account
            </a>

          </div>
        </section>

      </main>


      {/* Footer */}
      <footer className="bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-black">
                V
              </div>

              <span className="font-bold">
                VELOop
              </span>
            </div>

            <p className="mt-2 text-sm text-neutral-500">
              A rewards platform built around earning opportunities.
            </p>
          </div>


          <div className="flex flex-wrap gap-6 text-sm text-neutral-500">
            <a href="#how-it-works" className="hover:text-black">
              How It Works
            </a>

            <a href="#ways-to-earn" className="hover:text-black">
              Ways to Earn
            </a>

            <a href="/login" className="hover:text-black">
              Login
            </a>

            <a href="/register" className="hover:text-black">
              Register
            </a>
          </div>

        </div>

        <div className="border-t border-neutral-200">
          <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-neutral-400 lg:px-8">
            © {new Date().getFullYear()} VELOop. All rights reserved.
          </div>
        </div>

      </footer>

    </div>
  );
}

export default Home;