import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import BrandMark from "./BrandMark";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
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

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">

        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3"
        >
          <BrandMark />

          <div>
            <p className="text-lg font-bold tracking-tight">
              VELOop
            </p>

            <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400 sm:block">
              Rewards
            </p>
          </div>
        </button>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-lg px-4 py-2 text-sm transition",
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

        {/* User */}
        <div className="flex items-center gap-3">

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">
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

      </div>
    </header>
  );
};

export default DashboardNavbar;