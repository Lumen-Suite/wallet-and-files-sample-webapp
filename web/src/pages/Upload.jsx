import { Link, useNavigate } from 'react-router-dom'
import UploadDropzone from '../components/UploadDropzone.jsx'

export default function Upload() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Upload a file</h1>
          <p className="text-sm text-lumen-muted mt-1">
            Files go straight to Azure storage. The local server only sees the file's name, size, and a short fingerprint.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/files" className="border border-lumen-border px-4 py-2 text-sm hover:bg-lumen-row-hover">
            My files
          </Link>
          <Link to="/" className="border border-lumen-border px-4 py-2 text-sm hover:bg-lumen-row-hover">
            Dashboard
          </Link>
        </div>
      </header>

      <UploadDropzone onUploaded={() => setTimeout(() => navigate('/files'), 1200)} />
    </div>
  )
}
