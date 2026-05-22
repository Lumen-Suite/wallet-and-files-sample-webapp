import { useRef, useState } from 'react'
import axios from 'axios'
import { api, extractError } from '../api/client.js'
import { computeMd5Base64, stripExt, extOf } from '../lib/md5.js'

export default function UploadDropzone({ onUploaded }) {
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const pick = (chosen) => {
    if (!chosen) return
    setFile(chosen)
    setError(null)
    setSuccess(null)
    setStage('idle')
    setProgress(0)
  }

  const upload = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      setStage('hashing')
      const Checksum = await computeMd5Base64(file)

      setStage('requesting-sas')
      const { data } = await api.post(
        '/user/files?path=/',
        {
          Name: stripExt(file.name),
          FileExtension: extOf(file.name) || 'bin',
          Checksum,
          Description: description,
        },
      )

      setStage('uploading')
      setProgress(0)
      await axios.put(data.SASURL, file, {
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'x-ms-blob-content-md5': Checksum,
          'Content-Type': file.type || 'application/octet-stream',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })

      setStage('done')
      setProgress(100)
      setSuccess({ name: file.name, workflowId: data.WorkflowID })
      setFile(null)
      setDescription('')
      onUploaded?.()
    } catch (e) {
      setStage('error')
      setError(extractError(e))
    } finally {
      setBusy(false)
    }
  }

  const labelForStage = {
    idle: 'Ready',
    hashing: 'Calculating fingerprint...',
    'requesting-sas': 'Getting an upload slot...',
    uploading: 'Uploading...',
    done: 'Uploaded',
    error: 'Failed',
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (busy) return
          pick(e.dataTransfer.files?.[0])
        }}
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-lumen-fg bg-lumen-subtle' : 'border-lumen-border'
        }`}
      >
        <div className="text-sm font-medium text-lumen-fg mb-2">
          Drop a file here to upload
        </div>
        <div className="text-xs text-lumen-muted mb-4">or</div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="border border-lumen-fg px-4 py-2 text-sm hover:bg-lumen-fg hover:text-lumen-bg disabled:opacity-40"
        >
          Choose a file
        </button>
        <input
          ref={inputRef}
          type="file"
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
          className="hidden"
          aria-hidden
        />
        <div className="text-xs text-lumen-muted mt-3">
          One file at a time. Uploads go straight to Azure storage; the Express server never sees the file bytes.
        </div>
      </div>

      {file && (
        <div className="mt-4 border border-lumen-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{file.name}</div>
              <div className="text-xs text-lumen-muted">
                {(file.size / 1024).toFixed(1)} KB &middot; {labelForStage[stage]}
              </div>
            </div>
            {!busy && stage !== 'done' && (
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setDescription('')
                  setStage('idle')
                  setProgress(0)
                  setError(null)
                }}
                className="text-xs text-lumen-muted hover:text-lumen-fg"
              >
                Remove
              </button>
            )}
          </div>

          {stage !== 'done' && (
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-lumen-muted">Description (optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={busy}
                className="mt-1 w-full border border-lumen-border focus:border-lumen-fg outline-none px-3 py-2 text-sm"
              />
            </label>
          )}

          {(stage === 'uploading' || stage === 'done') && (
            <div className="h-1.5 bg-lumen-subtle overflow-hidden border border-lumen-border">
              <div
                className="h-full bg-lumen-fg"
                style={{ width: `${progress}%`, transition: 'width 120ms linear' }}
              />
            </div>
          )}

          {stage !== 'done' && (
            <button
              type="button"
              onClick={upload}
              disabled={busy}
              className="w-full bg-lumen-fg text-lumen-bg px-4 py-2 text-sm hover:opacity-90 disabled:opacity-40"
            >
              {busy ? labelForStage[stage] : 'Upload'}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 border border-lumen-error p-3 text-sm">
          <div className="font-medium text-lumen-error mb-1">Upload failed</div>
          <div className="break-words">{error}</div>
        </div>
      )}

      {success && (
        <div className="mt-4 border border-lumen-success p-3 text-sm">
          <div className="font-medium text-lumen-success mb-1">Uploaded</div>
          <div className="text-lumen-fg">{success.name}</div>
          {success.workflowId && (
            <div className="text-xs text-lumen-muted mt-1">
              Workflow: <code className="font-mono">{success.workflowId}</code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
