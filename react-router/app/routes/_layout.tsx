import { Link, Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="text-white p-4 border-b border-zinc-900 flex justify-between items-center">
        <h1 className="text-2xl font-bold"><img src="/images/logo-dark.svg" alt="DJ Sets" className="h-8" /></h1>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/sets">Sets</Link></li>
          </ul>
        </nav>
      </header>
      <main className="flex-1">
          {/* Content will be injected here */}
          <Outlet />
      </main>
      {/* <footer className="text-white p-4 text-center">
        &copy; {new Date().getFullYear()} VibeFlow
      </footer> */}
    </div>
  );
}