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

function CopyRow({ label, value, suffix, mono = true }) {
  return (
    <Row label={label}>
      {value == null || value === '' ? (
        <span>-</span>
      ) : (
        <>
          <span className={mono ? 'font-mono' : ''}>{value}</span>
          {suffix}
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

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

function explorerBase(chainId) {
  const id = String(chainId ?? '')
  if (id === '137') return 'https://polygonscan.com'
  if (id === '80002') return 'https://amoy.polygonscan.com'
  if (id === '1') return 'https://etherscan.io'
  if (id === '11155111') return 'https://sepolia.etherscan.io'
  return null
}

function typeStyle(type) {
  const t = String(type ?? '').toLowerCase()
  if (t === 'minted') return 'border-lumen-success text-lumen-success'
  if (t === 'burned') return 'border-lumen-error text-lumen-error'
  return 'border-lumen-border text-lumen-fg'
}

export default function TransactionDetailModal({ tx, viewerAddress, onClose }) {
  useEffect(() => {
    if (!tx) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [tx, onClose])

  if (!tx) return null

  const log = tx.Log ?? {}
  const type = log.Type
  const explorer = explorerBase(tx.ChainID)
  const txUrl = explorer && log.TransactionHash ? `${explorer}/tx/${log.TransactionHash}` : null
  const contractUrl = explorer && tx.ContractAddress ? `${explorer}/address/${tx.ContractAddress}` : null

  const isViewer = (addr) => {
    if (!viewerAddress || !addr) return false
    return addr.toLowerCase() === viewerAddress.toLowerCase()
  }
  const tag = (addr) => {
    if (addr && addr === ZERO_ADDR) return <span className="ml-2 text-xs uppercase tracking-wider text-lumen-muted">(zero)</span>
    if (isViewer(addr)) return <span className="ml-2 text-xs uppercase tracking-wider text-lumen-muted">(this wallet)</span>
    return null
  }

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
            <h2 className="font-semibold tracking-tight text-lumen-fg truncate">Transaction details</h2>
            <div className="text-xs text-lumen-muted mt-0.5 flex items-center gap-2 flex-wrap">
              {type && (
                <span className={`uppercase tracking-wider px-2 border ${typeStyle(type)}`}>
                  {type}
                </span>
              )}
              {tx.TokenID != null && <span>Token #{String(tx.TokenID)}</span>}
              {tx.Network && <span>&middot; {tx.Network}</span>}
              {tx.ChainID && <span>&middot; chain {tx.ChainID}</span>}
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
          <SectionHeading>Activity</SectionHeading>
          {type && <Row label="Type" value={type} />}
          {tx.TokenID != null && <Row label="Token ID" value={String(tx.TokenID)} mono />}

          <SectionHeading>Smart contract</SectionHeading>
          {tx.Network && <Row label="Network" value={tx.Network} />}
          {tx.ChainID && <Row label="Chain ID" value={String(tx.ChainID)} mono />}
          <CopyRow label="Contract" value={tx.ContractAddress} />
          {contractUrl && <ExternalLinkRow label="On explorer" url={contractUrl} linkText="View contract" />}

          <SectionHeading>Parties</SectionHeading>
          <CopyRow label="From" value={log.From} suffix={tag(log.From)} />
          <CopyRow label="To" value={log.To} suffix={tag(log.To)} />
          <CopyRow label="Caller" value={log.Caller} suffix={tag(log.Caller)} />

          <SectionHeading>Transaction</SectionHeading>
          <CopyRow label="Hash" value={log.TransactionHash} />
          {txUrl && <ExternalLinkRow label="On explorer" url={txUrl} linkText="View transaction" />}

          <SectionHeading>Timestamps</SectionHeading>
          <Row label="Logged" value={formatTs(log.LogTS)} />
          <Row label="Recorded" value={formatTs(tx.CreatedTS)} />
        </div>

        <footer className="px-5 py-3 border-t border-lumen-border flex items-center justify-between">
          <div className="text-xs text-lumen-muted">
            Click any value to copy. Hash and contract open the chain explorer.
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
