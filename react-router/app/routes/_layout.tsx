import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">DJ Sets</h1>
      </header>
      <main className="flex-1 p-4">
        <div className="mx-auto">
          {/* Content will be injected here */}
          <Outlet />
        </div>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        &copy; {new Date().getFullYear()} DJ Sets
      </footer>
    </div>
  );
}