const REQUIRED = [
  'LUMEN_API_BASE_URL',
  'LUMEN_API_KEY',
  'LUMEN_API_SECRET',
  'SERVER_PORT',
  'ALLOWED_ORIGIN',
]

export function assertEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k] || process.env[k].startsWith('paste-your'))
  if (missing.length === 0) return

  console.error('\n[ERROR] Your .env file is incomplete.')
  console.error('Missing or unfilled values:')
  for (const key of missing) console.error('  - ' + key)
  console.error('\nFix this:')
  console.error('  1. Open .env in the project root.')
  console.error('  2. Paste real values for the variables above.')
  console.error('  3. Save the file and run "npm start" again.')
  console.error('\nNeed help? See docs/SETUP.md step 5.\n')
  process.exit(1)
}
