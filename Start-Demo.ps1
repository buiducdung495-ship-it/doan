$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Can cai Node.js 22.14+ truoc.' }
$env:HR_DATA_FILE = Join-Path $PSScriptRoot 'work/demo/hr.json'
if (-not (Test-Path -LiteralPath 'node_modules')) {
  npm install
  if ($LASTEXITCODE -ne 0) { throw 'Cai thu vien that bai.' }
}
if (-not (Test-Path -LiteralPath $env:HR_DATA_FILE)) {
  npm run hr:demo
  if ($LASTEXITCODE -ne 0) { throw 'Tao du lieu demo that bai.' }
}
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build that bai.' }
if (Test-Path -LiteralPath 'work/demo/demo-access.txt') { Get-Content -LiteralPath 'work/demo/demo-access.txt' -Encoding UTF8 }
Write-Host 'Mo http://localhost:3000. Bam Ctrl+C de dung.'
npm run start
