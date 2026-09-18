# Security

Phosphor moves real money on mainnet. This page says how to report a problem privately, what counts, what the app does to fail closed, and what has and has not been done to it. It mirrors [SECURITY.md](https://github.com/karimbabasf/phosphor/blob/main/SECURITY.md) in the repository.

## Report a vulnerability

Do not open a public issue for anything that could move, expose or lose funds. Use [GitHub private vulnerability reporting](https://github.com/karimbabasf/phosphor/security/advisories/new): it is private to the maintainer until an advisory is published. If you cannot use it, open a public issue that asks for a private channel and says nothing technical.

A useful report carries the version or commit, the configuration that was live (network, gate state, policy), the exact steps, what you expected the policy engine to do, and what it did.

## What counts

- Anything that gets a write executed without the human click the policy required.
- Anything that lets the connected agent reach approval, execution or policy directly.
- Key material leaving the machine, landing in a log, or entering the git tree.
- Forged, dropped or reordered entries in the audit log, or a log that records a human decision when no person clicked.
- A rule (budget, allowlist, threshold, composition limit, kill switch) that can be bypassed or silently skipped.
- A proposal whose displayed facts differ from what gets signed, on any window.
- Prompt injection that reaches a real capability rather than only the agent's text.

Out of scope: bugs in third-party protocols, chains, bridges, venues or RPC providers (report those to them); losses caused by your own configuration, your own approval, or a rule that did what it said; anything that needs an attacker who already has your machine, your shell or your key file; and the limits the security model already states as known.

## How the app fails closed

- The agent proposes. It cannot approve, execute or change a rule; those paths take a click in the window, and the click carries a token the agent never sees.
- Every write is simulated and checked against your rules before it can be offered to you, and the card names the exact amount, token and address that will be signed.
- Keys live in one encrypted file sealed to your Mac's Secure Enclave; signing takes Touch ID or your login password.
- The audit log is append-only and hash-chained, so an entry cannot be changed or removed without breaking the chain.
- Updates are signed with a key the author holds, and the app refuses one that does not verify.

The full trust boundary and its known limits are in [Security](/docs/security/) and [security-model.md](https://github.com/karimbabasf/phosphor/blob/main/docs/security-model.md).

## What has been done, and what has not

- The code is public under FSL-1.1-MIT, so anyone can read what signs.
- The test suite (unit, injection and lockdown) runs on every commit, and CodeQL scans every push.
- Only the latest commit on `main` is supported. There are no backports.
- There has been **no third-party audit**. Until one is published here, treat the app as reviewed by its author alone, and size what you put in it accordingly.
- Builds are not yet notarized by Apple, which is why the first open needs Open Anyway. Verify the download instead: the release page lists the SHA-256 of every file.

## Verify a download

    shasum -a 256 ~/Downloads/Phosphor-macOS-arm64.dmg

The line must match the one on the [release page](https://github.com/karimbabasf/phosphor/releases/latest). Only download Phosphor from this site or from that page.

## What to expect

Best effort, from one person, with no promised timeline. There is no bug bounty and no payment. Please allow 90 days for a fix before publishing, or less if the issue is already being exploited. You are credited in the advisory if you want to be.

## Contact

Private reports through GitHub, as above. Anything else: [founder@karimbabasf.com](mailto:founder@karimbabasf.com).
