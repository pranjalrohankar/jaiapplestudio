export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Apple Store Admin</h1>
        <nav className="flex gap-4 text-sm font-medium">
          <a href="/admin" className="text-gray-600 hover:text-gray-900">Dashboard</a>
          <a href="/admin/products" className="text-gray-600 hover:text-gray-900">Products</a>
          <a href="/" className="text-blue-600 hover:text-blue-800">View Site &rarr;</a>
        </nav>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
