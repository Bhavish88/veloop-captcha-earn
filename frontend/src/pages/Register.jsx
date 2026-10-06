import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import BrandMark from "../components/BrandMark";

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [form, setForm] = useState({
    name: "",
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

    const result = await register(
      form.name,
      form.email,
      form.password
    );

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">

      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link to="/" className="flex items-center gap-2">
            <BrandMark />

            <span className="text-xl font-bold tracking-tight">
              VELOop
            </span>
          </Link>

          <Link
            to="/"
            className="text-xs sm:text-sm font-medium text-neutral-600 transition hover:text-black"
          >
            Back to home
          </Link>

        </div>
      </header>


      {/* Main */}
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-6 sm:px-6 sm:py-12 lg:px-8">

        <div className="grid w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/50 lg:grid-cols-2">


          {/* Left panel */}
          <div className="relative hidden overflow-hidden bg-neutral-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">

            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-yellow-400/20 blur-3xl" />

            <div className="relative">

              <div className="flex items-center gap-2">
                <BrandMark className="h-10 w-10" />

                <span className="text-xl font-bold">
                  VELOop Rewards
                </span>
              </div>

              <h1 className="mt-20 max-w-md text-5xl font-bold leading-tight tracking-tight">
                Start turning your time into rewards.
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-neutral-400">
                Create your VELOop account and explore different ways to earn
                through tasks, activities and rewards.
              </p>

            </div>


            <div className="relative space-y-4">

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-black">
                  ✓
                </div>

                <span className="text-sm text-neutral-300">
                  Create your account
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-black">
                  ✓
                </div>

                <span className="text-sm text-neutral-300">
                  Explore earning activities
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-black">
                  ✓
                </div>

                <span className="text-sm text-neutral-300">
                  Earn and manage your rewards
                </span>
              </div>

            </div>

          </div>


          {/* Registration form */}
          <div className="flex items-center justify-center p-5 sm:p-10 md:p-12 lg:p-16">

            <div className="w-full max-w-md">

              <div className="mb-8">

                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-yellow-600">
                  Get started
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Create your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  Join VELOop and start exploring available earning
                  opportunities.
                </p>

              </div>


              {/* Error */}
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}


              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-neutral-800"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                  />
                </div>


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
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-neutral-800"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
                  />

                  <p className="mt-2 text-xs text-neutral-400">
                    Minimum 8 characters.
                  </p>
                </div>


                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>

              </form>


              {/* Login */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-neutral-200" />

                <span className="text-xs text-neutral-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-neutral-200" />
              </div>


              <p className="text-center text-sm text-neutral-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-black underline decoration-yellow-400 decoration-2 underline-offset-4 hover:text-yellow-600"
                >
                  Login
                </Link>
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

export default Register;