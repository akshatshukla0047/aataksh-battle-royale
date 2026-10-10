$port = 8080
$path = 'C:\Users\udayi\.gemini\antigravity\scratch\aataksh-game'

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:' + $port + '/')

try {
    $listener.Start()
    Write-Host ('AATAKSH Game Server running at: http://localhost:' + $port + '/') -ForegroundColor Green

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) { $urlPath = 'index.html' }
        $filePath = Join-Path $path $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = 'application/octet-stream'
            if ($ext -eq '.html') { $mime = 'text/html; charset=utf-8' }
            elseif ($ext -eq '.css') { $mime = 'text/css; charset=utf-8' }
            elseif ($ext -eq '.js') { $mime = 'application/javascript; charset=utf-8' }
            elseif ($ext -eq '.png') { $mime = 'image/png' }
            elseif ($ext -eq '.jpg') { $mime = 'image/jpeg' }

            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $err = [System.Text.Encoding]::UTF8.GetBytes('File Not Found')
            $response.OutputStream.Write($err, 0, $err.Length)
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Host 'Server stopped or error occurred'
} finally {
    if ($listener.IsListening) { $listener.Stop() }
}
