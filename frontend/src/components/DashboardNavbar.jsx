import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import BrandMark from "./BrandMark";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    label: "Captcha Earn",
    to: "/captcha",
  },
  {
    label: "Wallet",
    to: "/wallet",
  },
  {
    label: "Withdraw",
    to: "/withdraw",
  },
];

const DashboardNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNavClick = (to) => {
    setIsMobileMenuOpen(false);
    navigate(to);
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 sm:gap-3"
        >
          <BrandMark />

          <div className="text-left">
            <p className="text-lg font-bold tracking-tight text-neutral-950">
              VELOop
            </p>

            <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400 sm:block">
              Rewards
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-lg px-3.5 py-2 text-sm transition",
                  isActive
                    ? "bg-neutral-100 font-semibold text-neutral-950"
                    : "font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-900">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-neutral-400">
              VELOop Member
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-black"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {isMobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 py-4 shadow-lg md:hidden animate-in slide-in-from-top duration-200">
          <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <p className="text-sm font-bold text-neutral-900">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-neutral-400">
                VELOop Member
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => handleMobileNavClick(item.to)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 active:bg-neutral-200"
              >
                <span>{item.label}</span>
                <span className="text-xs text-neutral-400">→</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default DashboardNavbar;