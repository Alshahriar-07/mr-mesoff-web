#!/usr/bin/env bash
# =============================================================================
#  MR MESOFF — installer (Linux / POSIX)
# =============================================================================
#
#  READ THIS FIRST
#  ---------------
#  MR MESOFF v1.0.0 ships for **64-bit Windows only**. There is no native Linux
#  build in this release, and this script therefore does NOT download anything.
#
#  It exists so that a Linux user gets an accurate answer instead of a broken
#  one. Specifically it will NOT:
#    * download `MR-MESOFF-x64.exe` and call it a Linux build,
#    * run the Windows binary under a compatibility layer and report success,
#    * invent a Linux release URL, package name or binary that does not exist,
#    * print a fake progress bar for a download it is not performing.
#
#  What it DOES do: detect the platform, state the situation plainly, and print
#  the exact, factual work required to produce a native Linux release (see the
#  summary at the end). Everything below the "requirements" heading is derived
#  from this project's actual source and packaging, not aspiration.
#
#  Exit codes
#    0  informational run completed on Linux (nothing was installed)
#    1  this script was run on an unsupported platform
#    2  a required command is missing
#
#  Usage:
#    ./install.sh [--check] [--json]
#
#    --check   run the checks and exit; identical to the default behaviour
#    --json    machine-readable summary (for CI or a download page)
# =============================================================================

set -u

# ---------------------------------------------------------------------------
# Output helpers — restrained, monochrome, and safe when piped.
# ---------------------------------------------------------------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ] && [ "${TERM:-dumb}" != "dumb" ]; then
    BOLD="$(printf '\033[1m')"
    DIM="$(printf '\033[2m')"
    RED="$(printf '\033[91m')"
    GREEN="$(printf '\033[92m')"
    YELLOW="$(printf '\033[93m')"
    RESET="$(printf '\033[0m')"
else
    BOLD=""; DIM=""; RED=""; GREEN=""; YELLOW=""; RESET=""
fi

say()  { printf '%s\n' "$*"; }
info() { printf '  %s%s%s\n' "$DIM" "$*" "$RESET"; }
ok()   { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$*"; }
bad()  { printf '  %s✗%s %s\n' "$RED" "$RESET" "$*"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$*"; }

banner() {
    cat <<'BANNER'

  ███╗   ███╗██████╗     ███╗   ███╗███████╗███████╗ ██████╗ ███████╗███████╗
  ████╗ ████║██╔══██╗    ████╗ ████║██╔════╝██╔════╝██╔═══██╗██╔════╝██╔════╝
  ██╔████╔██║██████╔╝    ██╔████╔██║█████╗  ███████╗██║   ██║█████╗  █████╗
  ██║╚██╔╝██║██╔══██╗    ██║╚██╔╝██║██╔══╝  ╚════██║██║   ██║██╔══╝  ██╔══╝
  ██║ ╚═╝ ██║██║  ██║    ██║ ╚═╝ ██║███████╗███████║╚██████╔╝██║     ██║
  ╚═╝     ╚═╝╚═╝  ╚═╝    ╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝

  AI-assisted business messaging for WhatsApp, Instagram and Messenger
  Version 1.0.0  ·  Desktop  ·  Windows x64 only
BANNER
}

PLATFORM_JSON=0
for arg in "$@"; do
    case "$arg" in
        --json)  PLATFORM_JSON=1 ;;
        --check) : ;;
        -h|--help)
            sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            printf 'Unknown option: %s (try --help)\n' "$arg" >&2
            exit 2
            ;;
    esac
done

[ "$PLATFORM_JSON" -eq 1 ] || banner

# ---------------------------------------------------------------------------
# 1. Platform detection
# ---------------------------------------------------------------------------
uname_s="$(uname -s 2>/dev/null || echo unknown)"
uname_m="$(uname -m 2>/dev/null || echo unknown)"
os_id="unknown"
if [ -r /etc/os-release ]; then
    os_id="$(. /etc/os-release 2>/dev/null; printf '%s' "${PRETTY_NAME:-${ID:-unknown}}")"
fi

emit_json() {
    cat <<JSON
{
  "product": "MR MESOFF",
  "version": "1.0.0",
  "platform": "${uname_s}",
  "architecture": "${uname_m}",
  "distribution": "${os_id}",
  "native_linux_build": false,
  "windows_build_available": true,
  "download_url": "https://github.com/Alshahriar-07/mr-mesoff-web/releases/download/v1/MR-MESOFF-x64.exe",
  "installed": false
}
JSON
}

if [ "$PLATFORM_JSON" -eq 1 ]; then
    emit_json
    # A JSON consumer wants the facts, not the prose; still report status in
    # the exit code so a script can branch on it.
    [ "$uname_s" = "Linux" ] && exit 0 || exit 1
fi

say ""
say "  ${BOLD}Checking this system${RESET}"
say "  ────────────────────────────────────────────────────────────────────"

if [ "$uname_s" != "Linux" ]; then
    bad "Unsupported platform: ${uname_s} (${uname_m})"
    say ""
    say "  MR MESOFF v1.0.0 is built and tested for 64-bit Windows only."
    say "  Nothing was downloaded and nothing was changed on this system."
    say ""
    say "  ${BOLD}Windows or macOS?${RESET}"
    info "Windows: run install.ps1 (or MR-MESOFF-Setup.exe) in this folder."
    info "macOS:   not built for this release — see the requirements below."
    say ""
    exit 1
fi

ok "Platform: Linux (${uname_m})"
ok "Distribution: ${os_id}"

if [ "$uname_m" != "x86_64" ] && [ "$uname_m" != "amd64" ]; then
    warn "This is a ${uname_m} host. The Linux build, when it exists, is targeted at x86_64."
fi

# Nothing to verify against, because there is no Linux artifact in this release.
say ""
say "  ${BOLD}Release availability${RESET}"
say "  ────────────────────────────────────────────────────────────────────"
warn "No native Linux artifact is published for MR MESOFF v1.0.0."
say ""
say "  The only published desktop artifact for v1 is the Windows runtime:"
info "MR-MESOFF-x64.exe  (a Windows PE executable — it will not run natively"
info "here, and this script will not pretend otherwise or wrap it in a"
info "compatibility layer and report success)."
say ""
say "  ${BOLD}Nothing was installed, and nothing on this system was modified.${RESET}"

# ---------------------------------------------------------------------------
# 2. What a native Linux release actually requires
# ---------------------------------------------------------------------------
say ""
say "  ${BOLD}What a native Linux release requires${RESET}"
say "  ────────────────────────────────────────────────────────────────────"
say "  These are the real, source-level requirements for this project — not"
say "  guesses about another codebase:"
say ""
say "  ${BOLD}1. A Linux desktop shell.${RESET}"
info "src-tauri/tauri.conf.json declares bundle.targets = [\"nsis\"], a Windows"
info "installer, and this release has no Rust/MSVC toolchain in its build"
info "environment (that is why the shipped installer is a self-contained"
info "PyInstaller executable instead). A Linux release needs the Rust"
info "toolchain plus:"
info "    • libwebkit2gtk-4.1-dev, libgtk-3-dev, libayatana-appindicator3-dev,"
info "      librsvg2-dev  (Tauri v2 prerequisites)"
info "    • bundle.targets = [\"deb\", \"appimage\"] and a Linux icon set"
info ""
say "  ${BOLD}2. A Linux runtime entry point.${RESET}"
info "packaging/portable_main.py hosts the UI in a native window via pywebview."
info "On Linux that needs pywebview's GTK/Qt backend plus a WebKitGTK runtime"
info "instead of the Windows WebView2 engine, and packaging/"
info "mr-mesoff.spec targets a Windows PE build."
info ""
say "  ${BOLD}3. A Linux-native AI runtime.${RESET}"
info "The bundled inference library (llama-cpp-python) is shipped as a"
info "Windows wheel with its native DLLs. Linux needs its own wheel built for"
info "the target glibc, and the model file"
info "(Qwen3.5-2B-Q4_K_M.gguf, ~1.27 GB) must be revalidated on that runtime."
info ""
say "  ${BOLD}4. Credential storage parity.${RESET}"
info "Local access tokens are protected with Windows DPAPI. A Linux release"
info "must substitute an equivalent OS keyring (libsecret / Secret Service)"
info "before it can claim the same \"encrypted at rest\" property."
info ""
say "  ${BOLD}5. Reproducible CI.${RESET}"
info "A Linux job that runs backend/tests, builds the frontend, produces the"
info "AppImage/deb, and publishes SHA-256 checksums alongside them."
say ""
say "  Until those exist, redistributing a Windows executable as a Linux"
say "  download would be misleading, so this script deliberately installs"
say "  nothing."
say ""

# ---------------------------------------------------------------------------
# 3. What a Linux user can do today
# ---------------------------------------------------------------------------
say "  ${BOLD}Options that are honest today${RESET}"
say "  ────────────────────────────────────────────────────────────────────"
info "• Run the Windows build on a Windows 10/11 x64 machine."
info "• Run the backend alone, from source, on Linux — it is pure Python and"
info "  does not need the desktop shell:"
info "      cd backend && pip install -e . && mr-mesoff-backend"
info "  This serves the loopback API (and the built UI at http://127.0.0.1:<port>"
info "  if dist/ is present). It is a development path, not a supported"
info "  end-user install."
info "• Track the release page for a future Linux artifact:"
info "      https://github.com/Alshahriar-07/mr-mesoff-web/releases"
say ""
say "  ${BOLD}Not installed. Nothing was modified.${RESET}"
say ""
exit 0
