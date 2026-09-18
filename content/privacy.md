# Privacy

Phosphor has no accounts, no sign-up and no server of its own. Nothing you do in the app reaches the author. This page says what stays on your Mac, which services the app talks to in your name and what they can see, and what this website records. Effective 2026-09-18.

## No accounts, no telemetry

The app asks for no account, no email and no name. It sends no analytics, no crash reports and no usage data, and it never contacts a server run by the author. The author cannot see your balances, your addresses, your trades, your rules or your conversations with your agent, and has no way to reset, recover or freeze anything for you.

## What stays on your Mac

- **Keys.** Your key file, `keys.enc.json`, lives under `~/.phosphor`. It is one encrypted envelope, and the key that opens it is sealed to your Mac's Secure Enclave, so the file is useless on any other machine. Phosphor keeps no copy. If you lose the file and its backup, nobody can restore it.
- **State.** Your rules, your saved addresses, the append-only audit log, the agent's seat secret and the window's preferences live in `~/Library/Application Support/com.karimbabasf.phosphor/`.
- **Your agent's transcript.** When the app starts your assistant, the conversation is held by Claude Code on your Mac, under your own account.

To remove everything, delete the app and those two folders. [Getting started](/docs/getting-started/) says how to back the key file up first.

## Who the app talks to, in your name

When you or your agent act, the app sends requests straight from your Mac to the venue that performs the move. Each of these sees your IP address, the request, and the address it concerns.

- **NEAR Intents**, through its 1Click API and bridge (chaindefuser.com): deposit addresses, quotes, swaps, sends, and your intents account.
- **Hyperliquid** (api.hyperliquid.xyz): your account address, orders, positions and the messages you sign.
- **Public RPC nodes and price feeds** (for example publicnode.com and fastnear.com): balance reads and chain data for your addresses.
- **GitHub** (github.com): the release manifest, when the app checks for an update. GitHub sees the request and nothing about your wallet.
- **Block explorers**, only when you click a link in the window; they open in your browser.

Their privacy policies apply to what they receive. The author does not run, monitor or control any of them.

## Your agent

Phosphor has no AI inside it. The agent you connect (Claude Code, Codex, or any other MCP client) runs under your own account with its own provider, and everything it reads through Phosphor becomes part of that conversation: balances, prices, proposals, your rules and the sentences you type. Start your assistant runs Claude Code under your Claude account, locked to Phosphor's tools; the same applies. Read your provider's privacy policy, because it, not this page, governs that data.

## This website

The site is static and hosted on Vercel. It sets no cookies and loads no analytics or tracking scripts. Vercel keeps the ordinary server logs a host keeps (IP address, page requested, browser) to run the service. The live chart on the front page fetches prices from Hyperliquid's public API directly from your browser, so Hyperliquid sees your IP when you open the page. The download is served from Vercel's file storage.

## Email and reports

If you write to [founder@karimbabasf.com](mailto:founder@karimbabasf.com), the author keeps the email to answer it and for nothing else. A vulnerability sent through [GitHub private reporting](https://github.com/karimbabasf/phosphor/security/advisories/new) stays private to the maintainer until an advisory is published, and your name appears in it only if you want it to.

## Your rights

The author holds no data about you to access, correct, export or delete, apart from emails you sent. Ask and those are deleted.

## Age

Phosphor is for people who are at least 18. The author knowingly collects nothing from anyone, at any age.

## Changes

This page describes the current version of the app and the site. When either changes what it sends or keeps, this page changes with it and the effective date at the top moves.

## Contact

[founder@karimbabasf.com](mailto:founder@karimbabasf.com)
