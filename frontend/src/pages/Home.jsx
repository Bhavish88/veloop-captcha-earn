const earningMethods = [
  {
    icon: "✓",
    title: "Complete Tasks",
    description: "Complete simple online tasks and earn VE rewards.",
  },
  {
    icon: "▶",
    title: "Watch & Earn",
    description: "Watch available content and receive rewards for your time.",
  },
  {
    icon: "◉",
    title: "Surveys",
    description: "Share your opinions through available surveys and earn.",
  },
  {
    icon: "◆",
    title: "Play & Earn",
    description: "Discover games and activities that let you earn rewards.",
  },
  {
    icon: "▣",
    title: "App Tasks",
    description: "Complete app-based activities and collect rewards.",
  },
  {
    icon: "↗",
    title: "Refer & Earn",
    description: "Invite others and earn through the VELOop referral system.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign up for VELOop and get started in a few simple steps.",
  },
  {
    number: "02",
    title: "Complete activities",
    description: "Choose from available tasks, games, surveys and other earning opportunities.",
  },
  {
    number: "03",
    title: "Earn rewards",
    description: "Your completed activities contribute rewards to your VELOop account.",
  },
  {
    number: "04",
    title: "Redeem",
    description: "Use the available withdrawal and reward options when eligible.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-950">

      {/* Navbar */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 font-bold text-black">
              V
            </div>

            <span className="text-xl font-bold tracking-tight">
              VELOop
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
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

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:text-black sm:block"
            >
              Log in
            </a>

            <a
              href="/register"
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Start Earning
            </a>
          </div>

        </div>
      </header>


      {/* Hero */}
      <main>

        <section className="overflow-hidden border-b border-neutral-200">
          <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:px-8">

            {/* Hero copy */}
            <div className="max-w-2xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                The rewards platform
              </div>

              <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-neutral-950 sm:text-6xl lg:text-7xl">
                Turn your free time into{" "}
                <span className="text-yellow-500">
                  rewards.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-600">
                Complete tasks, watch content, play, participate and discover
                new ways to earn rewards with VELOop.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                <a
                  href="/register"
                  className="rounded-xl bg-black px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
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

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
                <span>Multiple earning methods</span>
                <span>•</span>
                <span>Reward-focused platform</span>
                <span>•</span>
                <span>Flexible participation</span>
              </div>

            </div>


            {/* Hero visual */}
            <div className="relative">

              <div className="relative mx-auto max-w-lg">

                <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-yellow-200/60 blur-3xl" />
                <div className="absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-neutral-200 blur-3xl" />

                <div className="relative rounded-[2rem] border border-neutral-200 bg-neutral-50 p-5 shadow-2xl shadow-neutral-200/60">

                  {/* Fake dashboard preview */}
                  <div className="rounded-2xl bg-white p-5 shadow-sm">

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-neutral-500">
                          Available rewards
                        </p>

                        <p className="mt-1 text-3xl font-bold tracking-tight">
                          2,450
                          <span className="ml-2 text-sm font-semibold text-yellow-500">
                            VE
                          </span>
                        </p>
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-700">
                        V
                      </div>
                    </div>


                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full w-[68%] rounded-full bg-yellow-400" />
                    </div>


                    <div className="mt-6 grid grid-cols-2 gap-3">

                      <div className="rounded-xl border border-neutral-200 p-4">
                        <p className="text-xs text-neutral-500">
                          Daily Bonus
                        </p>

                        <p className="mt-2 font-bold">
                          +100 VE
                        </p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 p-4">
                        <p className="text-xs text-neutral-500">
                          Tasks
                        </p>

                        <p className="mt-2 font-bold">
                          Available
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* Reward notification */}
                  <div className="absolute -right-7 top-16 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 font-bold text-yellow-700">
                        +
                      </div>

                      <div>
                        <p className="text-xs text-neutral-500">
                          Reward earned
                        </p>

                        <p className="font-bold">
                          +250 VE
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* Task card */}
                  <div className="absolute -bottom-7 -left-7 rounded-2xl border border-neutral-200 bg-black p-4 text-white shadow-xl">

                    <p className="text-xs text-neutral-400">
                      Today's activity
                    </p>

                    <p className="mt-1 font-semibold">
                      Keep earning
                    </p>

                    <div className="mt-3 h-1.5 w-32 overflow-hidden rounded-full bg-neutral-700">
                      <div className="h-full w-2/3 rounded-full bg-yellow-400" />
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>


        {/* Ways to earn */}
        <section
          id="ways-to-earn"
          className="border-b border-neutral-200 bg-neutral-50"
        >
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-600">
                Ways to earn
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Choose how you want to earn.
              </h2>

              <p className="mt-5 text-lg leading-8 text-neutral-600">
                VELOop brings different earning activities together in one
                platform.
              </p>
            </div>


            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {earningMethods.map((method) => (
                <div
                  key={method.title}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-700">
                    {method.icon}
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {method.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {method.description}
                  </p>

                </div>
              ))}

            </div>

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


            <div className="mt-16 grid gap-8 md:grid-cols-4">

              {steps.map((step) => (
                <div key={step.number} className="relative">

                  <p className="text-sm font-bold text-yellow-500">
                    {step.number}
                  </p>

                  <h3 className="mt-4 text-xl font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    {step.description}
                  </p>

                </div>
              ))}

            </div>

          </div>
        </section>


        {/* Why VELOop */}
        <section
          id="why-veloop"
          className="border-b border-neutral-200 bg-neutral-950 text-white"
        >
          <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:px-8">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-400">
                Why VELOop
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                One platform for different ways to earn.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">
                Instead of relying on a single activity, VELOop brings
                different earning opportunities into one rewards ecosystem.
              </p>

            </div>


            <div className="grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
                <p className="text-2xl font-bold text-yellow-400">
                  01
                </p>

                <h3 className="mt-5 font-semibold">
                  Multiple activities
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Explore different ways to participate instead of depending
                  on one earning method.
                </p>
              </div>


              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
                <p className="text-2xl font-bold text-yellow-400">
                  02
                </p>

                <h3 className="mt-5 font-semibold">
                  Reward ecosystem
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Keep your earning activities and rewards connected within
                  one platform.
                </p>
              </div>


              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
                <p className="text-2xl font-bold text-yellow-400">
                  03
                </p>

                <h3 className="mt-5 font-semibold">
                  Flexible participation
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Choose activities based on what is available and what you
                  want to do.
                </p>
              </div>


              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
                <p className="text-2xl font-bold text-yellow-400">
                  04
                </p>

                <h3 className="mt-5 font-semibold">
                  Built around rewards
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Track your progress and rewards from one central account.
                </p>
              </div>

            </div>

          </div>
        </section>


        {/* Final CTA */}
        <section className="bg-yellow-400">
          <div className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-8">

            <h2 className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
              Ready to start earning?
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-black/70">
              Create your VELOop account and explore the available ways to
              earn rewards.
            </p>

            <a
              href="/register"
              className="mt-8 inline-flex rounded-xl bg-black px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
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