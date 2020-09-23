$cache = ".\node_modules\.cache"

if (Test-Path $cache) {
    Remove-Item $cache -Recurse -Force
}

npm run ($Args -join " ")
