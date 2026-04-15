import Navbar from '@/components/Navbar'
import HeatmapGrid from '@/components/HeatmapGrid'

const DashboardPage = () => {
  const currentYear = new Date().getFullYear()

  // Dummy logs for testing
  const testLogs = [
    { date: '2026-04-01', effortLevel: 3 },
    { date: '2026-04-02', effortLevel: 1 },
    { date: '2026-04-03', effortLevel: 4 },
    { date: '2026-04-04', effortLevel: 2 },
    { date: '2026-03-30', effortLevel: 3 },
    { date: '2026-03-29', effortLevel: 4 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Track your daily consistency</p>
        </div>

        <div className="rounded-lg border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Coding</h2>
          <HeatmapGrid
            year={currentYear}
            logs={testLogs}
            categoryColor="#22c55e"
            onDayClick={(date) => console.log('Clicked:', date)}
          />
        </div>
      </main>
    </div>
  )
}

export default DashboardPage