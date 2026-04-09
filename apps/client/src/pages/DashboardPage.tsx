import Navbar from '@/components/Navbar'

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Track your daily consistency</p>
        </div>

        <div className="rounded-lg border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Overall</h2>
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Coding</h2>
            <div className="h-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage