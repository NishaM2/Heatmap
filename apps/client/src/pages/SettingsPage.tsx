import Navbar from '@/components/Navbar'

const SettingsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Settings</h1>
      </main>
    </div>
  )
}

export default SettingsPage