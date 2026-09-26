import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const navItems = [
  { label: "Dashboard", to: "/admin" },
  { label: "Withdrawals", to: "/admin/withdrawals" },
  { label: "Wallet", to: "/admin/wallet" },
  { label: "Reconciliation", to: "/admin/reconciliation" },
];

const AdminNavbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* BRAND */}
        <Link
          to="/admin"
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 font-bold text-black">
            V
          </div>

          <div className="text-left">
            <p className="text-lg font-bold tracking-tight">VELOop</p>
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 sm:block">
              Admin Panel
            </p>
          </div>
        </Link>

        {/* NAVIGATION */}
        <nav aria-label="Admin navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
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

        {/* ADMIN USER */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-neutral-400">
              Administrator
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Logout
          </button>
        </div>
      </div>
      <nav aria-label="Mobile admin navigation" className="flex gap-1 overflow-x-auto px-5 pb-2 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              [
                "shrink-0 rounded-lg px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
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
    </header>
  );
};

export default AdminNavbar;