import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

const result = await login(form.email, form.password);

if (!result.success) {
  setError(result.message);
  return;
}

if (result.user?.role === "ADMIN") {
  navigate("/admin");
} else {
  navigate("/dashboard");
}
  };

return (
  <div className="min-h-screen bg-neutral-50 text-neutral-950">

    {/* Header */}
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 font-bold text-black">
            V
          </div>

          <span className="text-xl font-bold tracking-tight">
            VELOop
          </span>
        </Link>

        <Link
          to="/"
          className="text-sm font-medium text-neutral-600 transition hover:text-black"
        >
          Back to home
        </Link>

      </div>
    </header>


    {/* Main */}
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-12 lg:px-8">

      <div className="grid w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/50 lg:grid-cols-2">


        {/* Left panel */}
        <div className="relative hidden overflow-hidden bg-neutral-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-yellow-400/20 blur-3xl" />

          <div className="relative">

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 font-bold text-black">
                V
              </div>

              <span className="text-xl font-bold">
                VELOop Rewards
              </span>
            </div>

            <h1 className="mt-20 max-w-md text-5xl font-bold leading-tight tracking-tight">
              Turn your time into rewards.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-neutral-400">
              Complete tasks, participate in activities and discover different
              ways to earn rewards with VELOop.
            </p>

          </div>


          <div className="relative space-y-4">

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-black">
                ✓
              </div>

              <span className="text-sm text-neutral-300">
                Multiple ways to earn
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-black">
                ✓
              </div>

              <span className="text-sm text-neutral-300">
                Track your rewards
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-black">
                ✓
              </div>

              <span className="text-sm text-neutral-300">
                One account for your earning activities
              </span>
            </div>

          </div>

        </div>


        {/* Login form */}
        <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16">

          <div className="w-full max-w-md">

            <div className="mb-8">

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-600">
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Sign in to VELOop
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Access your dashboard and continue earning rewards.
              </p>

            </div>


            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}


            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-neutral-800"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                />
              </div>


              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-neutral-800"
                  >
                    Password
                  </label>

                </div>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                />
              </div>


              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

            </form>


            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs text-neutral-400">
                OR
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>


            <p className="text-center text-sm text-neutral-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-black underline decoration-yellow-400 decoration-2 underline-offset-4 hover:text-yellow-600"
              >
                Create an account
              </Link>
            </p>

          </div>

        </div>

      </div>

    </main>

  </div>
);
};

export default Login;