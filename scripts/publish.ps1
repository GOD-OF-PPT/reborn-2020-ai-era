# Requires Git, GitHub CLI and Python 3. Does not change PowerShell execution policy.
[CmdletBinding()]
param([switch]$AllowExisting)
$ErrorActionPreference = 'Stop'
$Script = Join-Path $PSScriptRoot 'publish_github.py'
$Extra = @()
if ($AllowExisting) { $Extra += '--allow-existing' }
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 $Script @Extra
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python $Script @Extra
} else {
    throw 'Python 3 not found. Install Python, Git and GitHub CLI first.'
}
exit $LASTEXITCODE
