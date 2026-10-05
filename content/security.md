# Security

Phosphor moves real money on mainnet. This page says what it defends against, the test behind each defence, what stays open, and how to check a release yourself. To report a problem privately, go to [Report a vulnerability](#report-a-vulnerability).

[Check it yourself](/docs/verify/) puts each of the wallet's security claims beside the code that enforces it, the test that proves it and the command that runs it, and shows how to check your download and your vault on NEAR.

<!-- include: security-model.md#threat-model -->

## What has been done, and what has not

- The code is public under FSL-1.1-MIT, so anyone can read what signs.
- The test suite (unit, injection and lockdown) runs on every push to main and every pull request, beside a secret sweep and a check of every package's registry signature. `npm run attack` plays a hostile program on your Mac against a built copy of the app, 32 cases, and anyone can run it.
- Since version 0.10.12 every release is signed with an Apple Developer ID and notarized by Apple.
- Only the latest commit on `main` is supported. There are no backports.
- There has been **no third-party audit**. Until one is published here, treat the app as reviewed by its author alone, and size what you put in it accordingly.

## Report a vulnerability

Do not open a public issue for anything that could move, expose or lose funds. Use [GitHub private vulnerability reporting](https://github.com/karimbabasf/phosphor/security/advisories/new): it is private to the maintainer until an advisory is published. If you cannot use it, open a public issue that asks for a private channel and says nothing technical.

A useful report carries the version or commit, the configuration that was live (network, policy), the exact steps, what you expected the policy engine to do, and what it did.

## What counts

- Anything that gets a write executed without the human click the policy required.
- Anything that lets the connected agent reach approval, execution or policy directly.
- Key material leaving the machine, landing in a log, or entering the git tree.
- Forged, dropped or reordered entries in the audit log, or a log that records a human decision when no person clicked.
- A rule (budget, allowlist, threshold, composition limit, kill switch) that can be bypassed or silently skipped.
- A proposal whose displayed facts differ from what gets signed, on any screen.
- Prompt injection that reaches a real capability rather than only the agent's text.
- A program running as you that breaks a boundary the threat model says holds against one: the click, the window token, the read gate, the update check, or the Secure Enclave service's caller check.

Out of scope: bugs in third-party protocols, chains, bridges, venues or RPC providers (report those to them); losses caused by your own configuration, your own approval, or a rule that did what it said; anything that needs an attacker who already has your key file, root, or code running as you that the security model says it does not defend against; and the limits the threat model already states as open.

## What to expect

Best effort, from one person, with no promised timeline. There is no bug bounty and no payment. Please allow 90 days for a fix before publishing, or less if the issue is already being exploited. You are credited in the advisory if you want to be.

## Contact

Private reports through GitHub, as above. Anything else: [founder@karimbabasf.com](mailto:founder@karimbabasf.com).
