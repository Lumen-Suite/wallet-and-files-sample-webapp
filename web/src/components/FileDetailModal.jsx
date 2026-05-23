import { useEffect, useState } from 'react'

function Row({ label, value, mono, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-lumen-border last:border-b-0">
      <div className="text-xs uppercase tracking-wider text-lumen-muted">{label}</div>
      <div className={`col-span-2 text-sm break-all ${mono ? 'font-mono' : ''}`}>
        {children ?? value ?? '-'}
      </div>
    </div>
  )
}

function CopyButton({ value, label = 'copy' }) {
  const [copied, setCopied] = useState(false)
  if (value == null || value === '') return null
  const onClick = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(String(value))
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ml-2 text-xs ${copied ? 'text-lumen-success' : 'text-lumen-muted hover:text-lumen-fg'}`}
    >
      {copied ? '(copied)' : `(${label})`}
    </button>
  )
}

function CopyRow({ label, value, mono = true }) {
  return (
    <Row label={label}>
      {value == null || value === '' ? (
        <span>-</span>
      ) : (
        <>
          <span className={mono ? 'font-mono' : ''}>{value}</span>
          <CopyButton value={value} />
        </>
      )}
    </Row>
  )
}

function ExternalLinkRow({ label, url, linkText = 'Open' }) {
  if (!url) return null
  return (
    <Row label={label}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-lumen-fg underline-offset-2 hover:underline break-all font-mono"
      >
        {linkText}
      </a>
      <CopyButton value={url} label="copy URL" />
    </Row>
  )
}

function SectionHeading({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-lumen-muted mt-5 mb-2">
      {children}
    </h3>
  )
}

function formatTs(ts) {
  if (ts == null) return null
  const ms = typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts
  try {
    return new Date(ms).toLocaleString()
  } catch {
    return String(ts)
  }
}

function formatBytes(b) {
  if (typeof b !== 'number') return null
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function FileDetailModal({ file, onClose }) {
  useEffect(() => {
    if (!file) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [file, onClose])

  if (!file) return null

  const ext = file.File?.Extension || file.FileExtension
  const mime = file.File?.OriginalFile?.MimeType
  const size = formatBytes(file.File?.OriginalFile?.Size)
  const fileUrl = file.FileURL || file.File?.OriginalFile?.URL
  const created = formatTs(file.CreatedTS ?? file.CreatedAt)
  const updated = formatTs(file._ts ?? file.UpdatedAt)
  const contract = file.SmartContract
  const nft = file.NFT

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white border border-lumen-fg w-full max-w-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between gap-3 px-5 py-3 border-b border-lumen-border">
          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight text-lumen-fg truncate">{file.Name ?? 'File details'}</h2>
            <div className="text-xs text-lumen-muted mt-0.5 flex items-center gap-2 flex-wrap">
              {ext && <span className="uppercase tracking-wider">.{ext}</span>}
              {mime && <span>&middot; {mime}</span>}
              {size && <span>&middot; {size}</span>}
              {nft && (
                <span className="uppercase tracking-wider px-2 border border-lumen-border">
                  NFT
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-lumen-muted hover:text-lumen-fg text-xl leading-none w-7 h-7 shrink-0"
            aria-label="Close"
          >
            x
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 flex-1">
          <SectionHeading>File</SectionHeading>
          <Row label="Name" value={file.Name} />
          {file.Description && <Row label="Description" value={file.Description} />}
          <Row label="Type" value={file.File?.Type ?? file.Type} />
          {ext && <Row label="Extension" value={'.' + String(ext).toUpperCase()} />}
          {mime && <Row label="MIME type" value={mime} mono />}
          {size && <Row label="Size" value={size} />}
          <ExternalLinkRow label="File URL" url={fileUrl} linkText="Open file" />

          <SectionHeading>Identity</SectionHeading>
          <CopyRow label="File ID" value={file.id ?? file.Id} />
          <CopyRow label="Path" value={file.Path} />
          <CopyRow label="Owner address" value={file.OwnerAddress} />
          {file.AdminID && <CopyRow label="Admin ID" value={file.AdminID} />}
          {file.OrganizationID && <CopyRow label="Organization" value={file.OrganizationID} />}

          <SectionHeading>Integrity</SectionHeading>
          <CopyRow label="Checksum (MD5)" value={file.Checksum ?? file.File?.Checksum} />
          {file.WorkflowID && <CopyRow label="Workflow ID" value={file.WorkflowID} />}

          {contract && (
            <>
              <SectionHeading>Smart contract</SectionHeading>
              <Row label="Network" value={contract.Network} />
              {contract.ChainID && <Row label="Chain ID" value={contract.ChainID} mono />}
              {contract.ContractAddress && <CopyRow label="Contract address" value={contract.ContractAddress} />}
              {contract.ProxyAddress && <CopyRow label="Proxy address" value={contract.ProxyAddress} />}
              {contract.ContractID && <CopyRow label="Contract ID" value={contract.ContractID} />}
            </>
          )}

          {nft && (
            <>
              <SectionHeading>NFT</SectionHeading>
              {nft.TokenID != null && <Row label="Token ID" value={String(nft.TokenID)} mono />}
              {nft.ContractAddress && <CopyRow label="NFT contract" value={nft.ContractAddress} />}
              {nft.Network && <Row label="Network" value={nft.Network} />}
              {nft.ChainID && <Row label="Chain ID" value={nft.ChainID} mono />}
              {nft.TransactionHash && <CopyRow label="Tx hash" value={nft.TransactionHash} />}
              <ExternalLinkRow label="Token URI" url={nft.TokenURI} linkText="Open metadata" />
              {nft.Inscription?.Name && <Row label="Inscription name" value={nft.Inscription.Name} />}
              {nft.Inscription?.Description && <Row label="Inscription description" value={nft.Inscription.Description} />}
            </>
          )}

          {(created || updated) && (
            <>
              <SectionHeading>Timestamps</SectionHeading>
              {created && <Row label="Created" value={created} />}
              {updated && <Row label="Last changed" value={updated} />}
            </>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-lumen-border flex items-center justify-between">
          <div className="text-xs text-lumen-muted">
            Click any underlined value to copy or open it.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-lumen-border px-4 py-2 text-sm hover:bg-lumen-row-hover"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
