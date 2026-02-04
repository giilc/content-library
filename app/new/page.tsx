import Navbar from '@/components/Navbar'
import ContentForm from '@/components/ContentForm'

export default function NewItemPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Create New Content Item
        </h1>

        <div className="card">
          <ContentForm mode="create" />
        </div>
      </main>
    </div>
  )
}
