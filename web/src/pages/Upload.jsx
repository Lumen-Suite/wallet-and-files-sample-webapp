import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROOT } from '../lib/path.js'
import UploadDropzone from '../components/UploadDropzone.jsx'
import FolderPicker from '../components/FolderPicker.jsx'

export default function Upload() {
  const navigate = useNavigate()
  const [path, setPath] = useState(ROOT)

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">Upload a file</h1>
        <div className="flex items-center gap-2">
          <Link to="/files" className="border border-lumen-border px-4 py-2 text-sm hover:bg-lumen-row-hover">
            My files
          </Link>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wider text-lumen-muted mb-2">Folder</h2>
        <FolderPicker value={path} onChange={setPath} />
      </section>

      <UploadDropzone path={path} onUploaded={() => setTimeout(() => navigate('/files'), 1200)} />
    </div>
  )
}
