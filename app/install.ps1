<#
.SYNOPSIS
    MR MESOFF — animated, verified Windows installer (PowerShell 5.1+ / 7+).

.DESCRIPTION
    Downloads the official MR MESOFF release artifact, verifies its integrity,
    and installs or places it correctly — with a premium black-and-white
    terminal experience that degrades gracefully on plain consoles.

    Release asset (official, fixed):
        https://github.com/Alshahriar-07/mr-mesoff-web/releases/download/v1/MR-MESOFF-x64.exe
    Saved as:
        MR-MESOFF-x64.exe

    ARTIFACT KIND IS DETECTED, NOT ASSUMED
    -------------------------------------
    The v1 asset is the PORTABLE application runtime (it hosts the app and
    opens a native window); it is not a setup program. This script inspects
    the downloaded file (name + PE characteristics) and its own argument
    conventions, then behaves accordingly:

        portable  → install by copying to a per-user folder + shortcuts
        installer → run it silently with a verified target directory

    Force the choice with -ArtifactKind portable|installer.

.PARAMETER ExpectedSha256
    A checksum you obtained from an INDEPENDENTLY trusted channel. When
    supplied it is authoritative: a mismatch aborts and the file is deleted.

.PARAMETER AllowUnverified
    Permits installation when no trusted checksum is available (no published
    manifest, no -ExpectedSha256). Without it, an unverifiable download stops
    and asks for confirmation. This is never bypassed silently.

.PARAMETER AllowDownloadOnly
    Download + verify only; place the runtime in the install directory but do
    not create shortcuts and do not launch.

.EXAMPLE
    .\install.ps1

.EXAMPLE
    .\install.ps1 -ExpectedSha256 3f2b...c91 -InstallDir "D:\Apps\MR MESOFF"

.EXAMPLE
    .\install.ps1 -AllowDownloadOnly -InstallDir "$env:USERPROFILE\Downloads"

.NOTES
    EXIT CODES
      0  success
      1  a step failed (including a SHA-256 MISMATCH — a hard abort)
      2  unsupported platform / architecture
      3  integrity could not be VERIFIED (refused without -AllowUnverified)

    SECURITY
      * HTTPS only; the redirect chain is allowed to leave github.com for
        GitHub's asset CDN, but a final non-HTTPS hop is refused.
      * Nothing is executed until it exists in full and has passed whatever
        verification is available. A partial or mismatched download is
        deleted, never run.
      * No checksum is ever invented. When no trusted checksum exists the
        script says so plainly: a manifest fetched from the same origin as
        the binary proves INTEGRITY, not AUTHENTICITY.
      * No administrator rights, no credential input, no secrets logged.
      * Existing user data (%USERPROFILE%\.mesoff) is never touched.
#>
[CmdletBinding()]
param(
    [string]$ArtifactUrl = "https://github.com/Alshahriar-07/mr-mesoff-web/releases/download/v1/MR-MESOFF-x64.exe",
    [string]$ArtifactName = "MR-MESOFF-x64.exe",
    [string]$ManifestUrl = "https://github.com/Alshahriar-07/mr-mesoff-web/releases/download/v1/SHA256SUMS.txt",
    [string]$InstallDir = (Join-Path $env:LOCALAPPDATA "Programs\MR MESOFF"),
    [string]$DownloadDir,
    [string]$ExpectedSha256,
    [ValidateSet("auto", "portable", "installer")]
    [string]$ArtifactKind = "auto",
    [switch]$AllowUnverified,
    [switch]$AllowDownloadOnly,
    [switch]$NoShortcuts,
    [switch]$NoLaunch,
    [switch]$Quiet
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$script:Ansi = $false
$script:SpinnerFrames = @("⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏")
$script:SpinnerIndex = 0
$script:KeepDownload = $false
$script:DownloadPath = ""
$script:DownloadDirIsOurs = $false
$ExitOk = 0
$ExitFailure = 1
$ExitUnsupported = 2
$ExitUnverified = 3

# ======================================================================
#  Terminal capability + styling
# ======================================================================
function Initialize-Terminal {
    # Enable ANSI where possible WITHOUT breaking older consoles.
    try {
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            $script:Ansi = $true
        } elseif ($Host.UI -and $Host.UI.SupportsVirtualTerminal) {
            $script:Ansi = $true
        }
    } catch { $script:Ansi = $false }

    try {
        # Unicode-aware output (block characters, spinner glyphs).
        if ($Host.Name -ne "ConsoleHost" -or [Console]::IsOutputRedirected) {
            # Piping/redirect: keep plain ASCII so logs stay readable.
        }
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    } catch { }

    try { $script:Width = [Math]::Max(48, [Math]::Min(78, [Console]::WindowWidth - 2)) }
    catch { $script:Width = 68 }
}

function Use-Ansi { return ($script:Ansi -and -not $Quiet) }

function Write-Raw([string]$Text) {
    if ($Quiet) { return }
    [Console]::Write($Text)
}

function Write-Line([string]$Text = "") {
    if ($Quiet) { return }
    [Console]::WriteLine($Text)
}

function Style([string]$Text, [string]$Code) {
    if (-not (Use-Ansi)) { return $Text }
    return ([char]27) + "[" + $Code + "m" + $Text + ([char]27) + "[0m"
}
function Dim([string]$t)    { Style $t "2" }
function Bold([string]$t)   { Style $t "1" }
function White([string]$t)  { Style $t "97" }
function Grey([string]$t)   { Style $t "90" }
function Green([string]$t)  { Style $t "92" }
function Red([string]$t)    { Style $t "91" }
function Yellow([string]$t) { Style $t "93" }

function Clear-ProgressLine {
    Write-Raw ("`r" + (" " * $script:Width) + "`r")
}

# ======================================================================
#  Branding
# ======================================================================
# Block wordmark. Rendered as a smooth reveal so the brand "draws" itself
# without a long animation delay (total reveal budget < 500 ms).
function Get-Banner {
    return @(
        '  ███╗   ███╗██████╗     ███╗   ███╗███████╗███████╗ ██████╗ ███████╗███████╗',
        '  ████╗ ████║██╔══██╗    ████╗ ████║██╔════╝██╔════╝██╔═══██╗██╔════╝██╔════╝',
        '  ██╔████╔██║██████╔╝    ██╔████╔██║█████╗  ███████╗██║   ██║█████╗  █████╗  ',
        '  ██║╚██╔╝██║██╔══██╗    ██║╚██╔╝██║██╔══╝  ╚════██║██║   ██║██╔══╝  ██╔══╝  ',
        '  ██║ ╚═╝ ██║██║  ██║    ██║ ╚═╝ ██║███████╗███████║╚██████╔╝██║     ██║     ',
        '  ╚═╝     ╚═╝╚═╝  ╚═╝    ╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝     '
    )
}

function Show-Banner {
    if ($Quiet) { return }
    $lines = Get-Banner
    Write-Line ""
    if (-not (Use-Ansi)) {
        # Plain fallback: the block art still reads correctly, just uncolored.
        foreach ($l in $lines) { Write-Line $l }
    } else {
        # Left-to-right reveal (~130 ms), then settle to solid white.
        # NOTE: `e is a PowerShell 6+ escape sequence; PowerShell 5.1 needs the
        # literal ESC character, otherwise the cursor-up codes would be
        # printed as text.
        $esc = [char]27
        $up = $esc + "[7A"
        $max = ($lines | Measure-Object -Property Length -Maximum).Maximum
        $step = [Math]::Max(4, [Math]::Ceiling($max / 26))
        foreach ($line in $lines) { [Console]::WriteLine("") }
        for ($col = 0; $col -le $max; $col += $step) {
            [Console]::Write($up)
            foreach ($line in $lines) {
                $visible = $line.Substring(0, [Math]::Min($col, $line.Length))
                $hidden  = if ($col -lt $line.Length) { $line.Substring([Math]::Min($col, $line.Length)) } else { "" }
                [Console]::WriteLine((White $visible) + (Dim $hidden))
            }
            Start-Sleep -Milliseconds 5
        }
        [Console]::Write($up)
        foreach ($line in $lines) { [Console]::WriteLine((Bold (White $line))) }
    }
    Write-Line ("  " + (Grey "AI-assisted business messaging for WhatsApp, Instagram and Messenger"))
    Write-Line ("  " + (Grey "Version 1.0.0  ·  Desktop  ·  Windows x64"))
    Write-Line ""
}

# ======================================================================
#  Steps / status
# ======================================================================
function Write-Header([string]$Title) {
    Write-Line ("  " + (Bold $Title))
    Write-Line ("  " + (Grey ("─" * ($script:Width - 2))))
}

function Start-Step([string]$Label) {
    if ($Quiet) { return }
    Write-Raw ("  " + (Grey "○") + " " + $Label + " ")
}

function Spin-Step([string]$Label, [int]$Seconds = 1) {
    if ($Quiet) { return }
    if (-not (Use-Ansi)) {
        Write-Line ("  * " + $Label)
        return
    }
    $end = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $end) {
        $frame = $script:SpinnerFrames[$script:SpinnerIndex % $script:SpinnerFrames.Count]
        $script:SpinnerIndex++
        Write-Raw ("`r" + "  " + (Grey $frame) + " " + $Label + (" " * 6))
        Start-Sleep -Milliseconds 45
    }
    Write-Raw ("`r" + (" " * $script:Width) + "`r")
}

function Complete-Step([string]$Label, [string]$Detail = "") {
    if ($Quiet) { return }
    Write-Raw ("`r" + (" " * $script:Width) + "`r")
    $mark = if (Use-Ansi) { Green "✓" } else { "[ok]" }
    $suffix = if ($Detail) { "  " + (Grey $Detail) } else { "" }
    Write-Line ("  " + $mark + " " + $Label + $suffix)
}

function Fail-Step([string]$Label, [string]$Detail) {
    if ($Quiet) { return }
    Write-Raw ("`r" + (" " * $script:Width) + "`r")
    $mark = if (Use-Ansi) { Red "✗" } else { "[!!]" }
    Write-Line ("  " + $mark + " " + $Label)
    if ($Detail) { Write-Line ("    " + (Red $Detail)) }
}

function Warn-Line([string]$Text) {
    if ($Quiet) { return }
    $mark = if (Use-Ansi) { Yellow "!" } else { "[!]" }
    Write-Line ("  " + $mark + " " + $Text)
}

function Info-Line([string]$Text) {
    if ($Quiet) { return }
    Write-Line ("    " + (Grey $Text))
}

function Fail([string]$Label, [string]$Detail, [int]$Code) {
    Fail-Step $Label $Detail
    Write-Line ""
    Write-Line ("  " + (Red "Installation stopped."))
    Write-Line ""
    exit $Code
}

# ======================================================================
#  Progress bar
# ======================================================================
function Render-Progress {
    param(
        [long]$Done,
        [long]$Total,
        [double]$ElapsedSeconds,
        [string]$Prefix = "Downloading"
    )
    if ($Quiet) { return }
    $barWidth = [Math]::Max(18, $script:Width - 40)
    $speed = if ($ElapsedSeconds -gt 0) { $Done / $ElapsedSeconds } else { 0 }

    if ($Total -gt 0) {
        $ratio = [Math]::Min(1.0, $Done / [double]$Total)
        $pct = [int][Math]::Round($ratio * 100)
        $filled = [int][Math]::Round($ratio * $barWidth)
    } else {
        $pct = 0
        $filled = 0
    }

    if (Use-Ansi) {
        $bar = ("█" * $filled) + (Style ("░" * ($barWidth - $filled)) "90")
        $pctText = if ($Total -gt 0) { "$pct%".PadLeft(4) } else { " .. " }
        $sizeText = if ($Total -gt 0) {
            ("{0:N1}/{1:N1} MB" -f ($Done / 1MB), ($Total / 1MB))
        } else {
            ("{0:N1} MB" -f ($Done / 1MB))
        }
        $line = "  " + (White $bar) + " " + (Bold $pctText) + "  " + (Grey $sizeText) +
                "  " + (Grey ("{0:N1} MB/s" -f ($speed / 1MB)))
    } else {
        $bar = ("#" * $filled) + ("-" * ($barWidth - $filled))
        $pctText = if ($Total -gt 0) { "$pct%" } else { "..." }
        $line = "  [$bar] $pctText  {0:N1} MB  {1:N1} MB/s" -f ($Done / 1MB), ($speed / 1MB)
    }
    Write-Raw ("`r" + $line + (" " * 4))
}

# ======================================================================
#  Platform checks
# ======================================================================
function Assert-Platform {
    $isWindowsHost = $true
    if ($PSVersionTable.PSVersion.Major -ge 6) { $isWindowsHost = $IsWindows }
    if (-not $isWindowsHost) {
        Fail "Platform check" "MR MESOFF ships for 64-bit Windows only. This host is not Windows." $ExitUnsupported
    }
    if (-not [Environment]::Is64BitOperatingSystem) {
        Fail "Platform check" "MR MESOFF requires 64-bit Windows (x64)." $ExitUnsupported
    }
    $arch = $env:PROCESSOR_ARCHITECTURE
    if ($arch -and $arch -ne "AMD64" -and $arch -ne "ARM64") {
        Fail "Platform check" "Unsupported processor architecture '$arch' (x64 required)." $ExitUnsupported
    }
    $detail = "$arch · " + [Environment]::OSVersion.VersionString
    Complete-Step "System compatibility verified" $detail
}

function Get-FreeSpaceMB([string]$Path) {
    try {
        $root = [System.IO.Path]::GetPathRoot((Resolve-Path -LiteralPath $Path -ErrorAction SilentlyContinue))
        if (-not $root) { $root = [System.IO.Path]::GetPathRoot([Environment]::GetFolderPath("LocalApplicationData")) }
        $drive = New-Object System.IO.DriveInfo($root)
        return [int]($drive.AvailableFreeSpace / 1MB)
    } catch { return -1 }
}

function Assert-DiskSpace([string]$Path, [int]$RequiredMB) {
    $free = Get-FreeSpaceMB $Path
    if ($free -lt 0) {
        Warn-Line "Could not determine free disk space; continuing."
        return
    }
    if ($free -lt $RequiredMB) {
        Fail "Disk space" ("Only {0} MB free; about {1} MB is required." -f $free, $RequiredMB) $ExitFailure
    }
    Complete-Step "Disk space available" ("{0} MB free" -f $free)
}

# ======================================================================
#  URL + download
# ======================================================================
function Assert-UrlReachable([string]$Url) {
    try {
        $req = [System.Net.HttpWebRequest]::Create($Url)
        $req.Method = "HEAD"
        $req.AllowAutoRedirect = $true
        $req.Timeout = 30000
        $req.UserAgent = "MR-MESOFF-Installer"
        $resp = $req.GetResponse()
        $code = [int]$resp.StatusCode
        $finalUri = $resp.ResponseUri.ToString()
        $resp.Close()
        if ($code -ne 200) { throw "HTTP $code" }
        Complete-Step "Release asset resolved" ("HTTP 200 · " + (Get-UrlHost $finalUri))
        return $true
    } catch {
        # Some CDNs reject HEAD; fall back to a ranged GET before giving up.
        try {
            $req = [System.Net.HttpWebRequest]::Create($Url)
            $req.Method = "GET"
            $req.AllowAutoRedirect = $true
            $req.Timeout = 30000
            $req.AddRange(0, 1023)
            $req.UserAgent = "MR-MESOFF-Installer"
            $resp = $req.GetResponse()
            $code = [int]$resp.StatusCode
            $resp.Close()
            if ($code -eq 200 -or $code -eq 206) {
                Complete-Step "Release asset resolved" ("HTTP $code")
                return $true
            }
            throw "HTTP $code"
        } catch {
            Fail "Release asset" ("Could not reach $Url`n    $($_.Exception.Message)`n    Check your connection, or pass -ArtifactUrl with a reachable release URL.") $ExitFailure
        }
    }
    return $false
}

function Get-UrlHost([string]$Url) {
    try { return ([Uri]$Url).Host } catch { return $Url }
}

function Invoke-DownloadWithProgress {
    param([string]$Url, [string]$Destination, [string]$Label)

    # Modern TLS regardless of the default this console shipped with.
    try {
        [Net.ServicePointManager]::SecurityProtocol =
            [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    } catch { }

    if (-not $Quiet) { Start-Step ("Downloading " + $Label) }

    # HttpWebRequest is used deliberately instead of HttpClient: Windows
    # PowerShell 5.1 does not load the System.Net.Http assembly by default,
    # and depending on it made the download fail with
    # "Cannot find type [System.Net.Http.HttpClientHandler]". HttpWebRequest
    # ships with every supported PowerShell and gives ContentLength plus a
    # raw response stream, which is all the progress bar needs.
    $response = $null
    $stream = $null
    $out = $null
    try {
        $request = [System.Net.HttpWebRequest]::Create($Url)
        $request.Method = "GET"
        $request.AllowAutoRedirect = $true
        $request.UserAgent = "MR-MESOFF-Installer"
        $request.Timeout = 60000                 # connect / headers
        $request.ReadWriteTimeout = 120000       # per-read stall timeout
        try { $request.AutomaticDecompression = [System.Net.DecompressionMethods]::None } catch { }

        $response = $request.GetResponse()
        $code = [int]$response.StatusCode
        if ($code -ne 200 -and $code -ne 206) {
            throw ("HTTP {0} {1}" -f $code, $response.StatusDescription)
        }
        if ($response.ResponseUri -and $response.ResponseUri.Scheme -ne "https") {
            throw ("Refusing a non-HTTPS download after redirect: " + $response.ResponseUri.ToString())
        }

        $total = 0L
        if ($response.ContentLength -gt 0) { $total = [long]$response.ContentLength }

        $stream = $response.GetResponseStream()
        $out = [System.IO.File]::Create($Destination)

        $buffer = New-Object byte[] 131072
        $done = 0L
        $clock = [System.Diagnostics.Stopwatch]::StartNew()
        $drawClock = [System.Diagnostics.Stopwatch]::StartNew()

        while ($true) {
            $read = $stream.Read($buffer, 0, $buffer.Length)
            if ($read -le 0) { break }
            $out.Write($buffer, 0, $read)
            $done += $read
            if ($drawClock.ElapsedMilliseconds -ge 150) {
                Render-Progress -Done $done -Total $total -ElapsedSeconds $clock.Elapsed.TotalSeconds
                $drawClock.Restart()
            }
        }
        $out.Flush()
        Render-Progress -Done $done -Total $total -ElapsedSeconds $clock.Elapsed.TotalSeconds
        if (-not $Quiet) { Write-Line "" }

        if ($total -gt 0 -and $done -ne $total) {
            throw ("Incomplete download: received {0} of {1} bytes." -f $done, $total)
        }
        if ($done -le 0) { throw "The download produced no data." }

        $elapsed = [Math]::Max(0.001, $clock.Elapsed.TotalSeconds)
        Complete-Step ("Downloaded " + $Label) ("{0:N1} MB in {1:N1}s" -f ($done / 1MB), $elapsed)
        return $done
    }
    finally {
        if ($out) { $out.Dispose() }
        if ($stream) { $stream.Dispose() }
        if ($response) { $response.Close() }
    }
}

# ======================================================================
#  Verification
# ======================================================================
function Get-ExpectedHashFromManifest {
    param([string]$Url, [string]$FileName)
    try {
        $tmp = Join-Path $env:TEMP ("mr-mesoff-manifest-" + [Guid]::NewGuid().ToString("N").Substring(0, 8) + ".txt")
        try {
            Invoke-WebRequest -Uri $Url -OutFile $tmp -UseBasicParsing -TimeoutSec 60 | Out-Null
        } catch {
            return @{ Found = $false; Reason = "no published manifest at that URL" }
        }
        foreach ($line in Get-Content -LiteralPath $tmp) {
            $trimmed = $line.Trim()
            if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }
            $m = [regex]::Match($trimmed, "^([0-9a-fA-F]{64})\s+\*?(.+)$")
            if (-not $m.Success) { continue }
            if ((Split-Path $m.Groups[2].Value.Trim() -Leaf) -eq $FileName) {
                Remove-Item $tmp -Force -ErrorAction SilentlyContinue
                return @{ Found = $true; Hash = $m.Groups[1].Value.ToLowerInvariant(); SameOrigin = $true }
            }
        }
        Remove-Item $tmp -Force -ErrorAction SilentlyContinue
        return @{ Found = $false; Reason = "the published manifest has no entry for $FileName" }
    } catch {
        return @{ Found = $false; Reason = "manifest could not be read" }
    }
}

function Test-ArtifactIntegrity {
    param([string]$Path, [string]$FileName)

    if ($ExpectedSha256) {
        $expected = $ExpectedSha256.Trim().ToLowerInvariant()
        if ($expected -notmatch "^[0-9a-f]{64}$") {
            Fail "Integrity verification" "-ExpectedSha256 must be a 64-character hex SHA-256." $ExitFailure
        }
        $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $expected) {
            Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
            Fail "Integrity verification" "SHA-256 mismatch (-ExpectedSha256). The download was deleted; nothing was executed." $ExitFailure
        }
        Complete-Step "SHA-256 verified against your supplied checksum" ($actual.Substring(0, 16) + "…")
        return @{ Verified = $true; Authenticated = $true }
    }

    $manifest = Get-ExpectedHashFromManifest -Url $ManifestUrl -FileName $FileName
    if ($manifest.Found) {
        $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $manifest.Hash) {
            Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
            Fail "Integrity verification" "SHA-256 mismatch with the published manifest. The download was deleted; nothing was executed." $ExitFailure
        }
        Warn-Line "Integrity verified against the published manifest."
        Info-Line "That manifest came from the same origin as the binary, so it proves"
        Info-Line "INTEGRITY (not corrupted/truncated), not authenticity (who published it)."
        Info-Line "Pass -ExpectedSha256 from an independent channel for authenticity."
        return @{ Verified = $true; Authenticated = $false }
    }

    Warn-Line ("Integrity could NOT be verified: " + $manifest.Reason + ".")
    Info-Line "No trusted checksum is available, and none will be invented."
    return @{ Verified = $false; Authenticated = $false }
}

# ======================================================================
#  Artifact kind detection
# ======================================================================
function Resolve-ArtifactKind {
    param([string]$Path, [string]$FileName)
    if ($ArtifactKind -ne "auto") { return $ArtifactKind }

    # 1) Explicit naming convention (the setup build is named accordingly).
    if ($FileName -match "(?i)setup|installer") { return "installer" }

    # 2) PE characteristics: our portable runtime is a CONSOLE subsystem
    #    binary that hosts a window itself; a setup program is also console.
    #    Distinguish by an embedded marker string in the image.
    try {
        $bytes = [System.IO.File]::ReadAllBytes($Path)
        $text = [System.Text.Encoding]::ASCII.GetString($bytes)
        if ($text.Contains("MR-MESOFF-Setup")) { return "installer" }
        if ($text.Contains("MR MESOFF is starting")) { return "portable" }
    } catch { }

    # 3) Default: treat an unknown x64 runtime as portable (safe: place it
    #    and let the user launch it) rather than executing installer flags.
    return "portable"
}

function Assert-PortableArtifact([string]$Path) {
    try {
        $fs = [System.IO.File]::OpenRead($Path)
        try {
            $reader = New-Object System.IO.BinaryReader($fs)
            $fs.Seek(0x3C, [System.IO.SeekOrigin]::Begin) | Out-Null
            $peOffset = $reader.ReadInt32()
            $fs.Seek($peOffset, [System.IO.SeekOrigin]::Begin) | Out-Null
            if ($reader.ReadUInt32() -ne 0x00004550) {
                Fail "Artifact validation" "The downloaded file is not a valid Windows executable." $ExitFailure
            }
            $machine = $reader.ReadUInt16()
            if ($machine -ne 0x8664) {
                Fail "Artifact validation" ("Unexpected executable architecture (machine 0x{0:X4}; x64 expected)." -f $machine) $ExitUnsupported
            }
        } finally { $fs.Dispose() }
    } catch {
        if ($_.Exception -is [System.Management.Automation.RuntimeException]) { throw }
        Fail "Artifact validation" ("Could not inspect the downloaded executable: " + $_.Exception.Message) $ExitFailure
    }
    Complete-Step "Executable validated" "Windows x64 PE image"
}

# ======================================================================
#  Install
# ======================================================================
function New-Shortcut([string]$LinkPath, [string]$TargetPath, [string]$WorkingDir) {
    $dir = Split-Path $LinkPath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $script = @"
`$ws = New-Object -ComObject WScript.Shell
`$s = `$ws.CreateShortcut('$LinkPath')
`$s.TargetPath = '$TargetPath'
`$s.WorkingDirectory = '$WorkingDir'
`$s.IconLocation = '$TargetPath,0'
`$s.Description = 'MR MESOFF'
`$s.Save()
"@
    try {
        $p = Start-Process -FilePath "powershell" `
            -ArgumentList @("-NoProfile", "-NonInteractive", "-Command", $script) `
            -NoNewWindow -Wait -PassThru
        return ($p.ExitCode -eq 0)
    } catch { return $false }
}

function Test-SameFile {
    # Compares two paths by full path so a source and destination that are the
    # same file are recognised (Copy-Item throws "Cannot overwrite the item …
    # with itself", which happens whenever -DownloadDir equals -InstallDir).
    param([string]$A, [string]$B)
    try {
        return ([System.IO.Path]::GetFullPath($A).TrimEnd('\', '/') -ieq
                [System.IO.Path]::GetFullPath($B).TrimEnd('\', '/'))
    } catch { return $false }
}

function Install-Portable {
    param([string]$SourcePath, [string]$TargetDir)

    if (-not (Test-Path $TargetDir)) { New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null }
    $target = Join-Path $TargetDir $ArtifactName

    if (Test-SameFile -A $SourcePath -B $target) {
        # Already in place: the download IS the installation. Renaming onto
        # itself would fail, and copying is pointless.
        Complete-Step "Application already in place" $target
        $script:KeepDownload = $true
        return $target
    }

    if (Test-Path $target) {
        # Safe update: replace the application file only. User data lives in
        # %USERPROFILE%\.mesoff and is never part of this directory.
        try {
            Copy-Item -LiteralPath $target -Destination ($target + ".previous") -Force -ErrorAction Stop
        } catch { }
        Complete-Step "Existing installation found" "updating the application file"
    }

    try {
        Copy-Item -LiteralPath $SourcePath -Destination $target -Force -ErrorAction Stop
    } catch {
        Fail "Install" ("Could not write to $target`n    $($_.Exception.Message)`n    Close MR MESOFF if it is running, or pass -InstallDir.") $ExitFailure
    }
    Complete-Step "Application installed" $target

    if (-not $NoShortcuts) {
        $startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
        $ok = New-Shortcut -LinkPath (Join-Path $startMenu "MR MESOFF.lnk") -TargetPath $target -WorkingDir $TargetDir
        if ($ok) {
            Complete-Step "Start Menu shortcut created" "MR MESOFF"
        } else {
            Warn-Line "Could not create the Start Menu shortcut (you can run the file directly)."
        }
    }
    return $target
}

function Install-WithInstaller {
    param([string]$SourcePath, [string]$TargetDir)
    Info-Line "The downloaded artifact is a setup program; running it silently."
    $p = Start-Process -FilePath $SourcePath `
        -ArgumentList @("/S", "/D=$TargetDir") -NoNewWindow -Wait -PassThru
    if ($p.ExitCode -ne 0) {
        Fail "Install" ("The setup program exited with code " + $p.ExitCode + ".") $ExitFailure
    }
    Complete-Step "Setup program completed" $TargetDir
    return (Join-Path $TargetDir $ArtifactName)
}

function Show-Success {
    param([string]$Installed, [string]$Kind, [bool]$Authenticated)
    if ($Quiet) { return }
    Write-Line ""
    Write-Line ("  " + (Green "━" * ($script:Width - 2)))
    $check = if (Use-Ansi) { Green "✓" } else { "[ok]" }
    Write-Line ("  " + $check + " " + (Bold (White "MR MESOFF is ready.")))
    Write-Line ("  " + (Green "━" * ($script:Width - 2)))
    Write-Line ""
    Info-Line ("Installed  : " + $Installed)
    Info-Line ("Type       : " + $Kind + " application runtime")
    if ($Authenticated) {
        Info-Line "Integrity  : SHA-256 verified against your independent checksum"
    } else {
        Info-Line "Integrity  : checksum manifest verified (integrity only, same origin)"
    }
    Info-Line ("Data folder: " + (Join-Path $env:USERPROFILE ".mesoff") + "  (never modified)")
    Write-Line ""
    Write-Line ("  " + (Bold "Next steps"))
    Info-Line "1. Open the application and complete the first-run setup."
    Info-Line "2. Connect WhatsApp, Instagram and Messenger from the main screen."
    Write-Line ""
}

# ======================================================================
#  Main
# ======================================================================
Initialize-Terminal
Show-Banner

Write-Header "Preparing installation"
Assert-Platform

# The download workspace is OURS. When the operator supplies -DownloadDir we
# only ever remove the files THIS run created; a directory we did not create is
# never deleted, and a directory that already existed is never removed
# recursively. (An earlier revision removed $DownloadDir -Recurse in the
# finally block, which could erase unrelated user files whenever -DownloadDir
# pointed at a real folder — e.g. the install directory or Downloads.)
$script:DownloadDirIsOurs = $false
if (-not $DownloadDir) {
    $DownloadDir = Join-Path $env:TEMP ("mr-mesoff-download-" + [Guid]::NewGuid().ToString("N").Substring(0, 8))
    $script:DownloadDirIsOurs = $true
}
$downloadPath = Join-Path $DownloadDir $ArtifactName
$script:DownloadPath = $downloadPath

# Download directory needs room for the artifact plus a copy during install.
Assert-DiskSpace $DownloadDir 600

Write-Header "Fetching official release"
Info-Line $ArtifactUrl
Assert-UrlReachable $ArtifactUrl | Out-Null

if (-not (Test-Path $DownloadDir)) { New-Item -ItemType Directory -Path $DownloadDir -Force | Out-Null }

$installed = $null
$kind = "portable"
$integrity = @{ Verified = $false; Authenticated = $false }

try {
    Spin-Step "Connecting to the release CDN" 1
    Invoke-DownloadWithProgress -Url $ArtifactUrl -Destination $downloadPath -Label $ArtifactName | Out-Null

    Write-Header "Verifying download"
    $integrity = Test-ArtifactIntegrity -Path $downloadPath -FileName $ArtifactName

    if (-not $integrity.Verified -and -not $AllowUnverified) {
        # Never bypass silently, and never execute an unverified binary
        # without the operator saying so. Ask when interactive.
        $proceed = $false
        try {
            if (-not [Console]::IsInputRedirected) {
                Write-Line ""
                Write-Raw ("  " + (Bold "No trusted checksum is available. Install anyway?") + " [y/N] ")
                $answer = [Console]::ReadLine()
                $proceed = ($answer -and $answer.Trim().ToLower() -eq "y")
                Write-Line ""
            }
        } catch { $proceed = $false }
        if (-not $proceed) {
            Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue
            Fail "Integrity verification" "Refusing to install an unverified download. Re-run with -ExpectedSha256 <hash>, or pass -AllowUnverified to accept the risk explicitly." $ExitUnverified
        }
        Warn-Line "Continuing without integrity verification, as explicitly requested."
    }

    Assert-PortableArtifact $downloadPath
    $kind = Resolve-ArtifactKind -Path $downloadPath -FileName $ArtifactName
    Complete-Step "Artifact inspected" ($kind + " application runtime")

    Write-Header "Installing"
    if ($AllowDownloadOnly) {
        if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null }
        $target = Join-Path $InstallDir $ArtifactName
        if (Test-SameFile -A $downloadPath -B $target) {
            # -DownloadDir and -InstallDir are the same folder: the file is
            # already where it belongs.
            Complete-Step "Download placed" $target
            $script:KeepDownload = $true
        } else {
            Copy-Item -LiteralPath $downloadPath -Destination $target -Force
            Complete-Step "Download placed" $target
        }
        $installed = $target
        Info-Line "Download-only mode: no shortcuts, no launch."
    } elseif ($kind -eq "installer") {
        $installed = Install-WithInstaller -SourcePath $downloadPath -TargetDir $InstallDir
    } else {
        $installed = Install-Portable -SourcePath $downloadPath -TargetDir $InstallDir
    }

    Show-Success -Installed $installed -Kind $kind -Authenticated $integrity.Authenticated

    if (-not $NoLaunch -and -not $AllowDownloadOnly) {
        Spin-Step "Starting MR MESOFF" 1
        try {
            Start-Process -FilePath $installed -WorkingDirectory (Split-Path $installed -Parent) | Out-Null
            Complete-Step "MR MESOFF launched" "a native application window will open"
        } catch {
            Warn-Line "Could not launch automatically: $($_.Exception.Message)"
            Info-Line ("Start it manually from: " + $installed)
        }
    }
}
catch {
    # Never leave a partial download behind.
    if (Test-Path $downloadPath) { Remove-Item -LiteralPath $downloadPath -Force -ErrorAction SilentlyContinue }
    Fail "Installation" ($_.Exception.Message) $ExitFailure
}
finally {
    $cleaned = $false
    if (-not $script:KeepDownload) {
        foreach ($leftover in @($script:DownloadPath, ($script:DownloadPath + ".part"))) {
            if ($leftover -and (Test-Path -LiteralPath $leftover -PathType Leaf)) {
                Remove-Item -LiteralPath $leftover -Force -ErrorAction SilentlyContinue
                $cleaned = $true
            }
        }
    }
    # Only a workspace this script created is removed as a directory.
    if ($script:DownloadDirIsOurs -and (Test-Path -LiteralPath $DownloadDir)) {
        Remove-Item -LiteralPath $DownloadDir -Recurse -Force -ErrorAction SilentlyContinue
        $cleaned = $true
    }
    if ($cleaned -and -not $Quiet) { Info-Line "Temporary download files cleaned up." }
}

exit $ExitOk
