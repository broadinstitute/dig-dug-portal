$cache = ".\node_modules\.cache"

if (Test-Path $cache) {
    Remove-Item $cache -Recurse -WhatIf -Force -Confirm
}

npm run ($Args -join " ")
