$cache = ".\node_modules\.cache"

if (Test-Path $cache) {
    Remove-Item $cache -Recurse -Force
}

pnpm run ($Args -join " ")
