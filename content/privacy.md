# Privacy

Phosphor has no accounts, no sign-up and no server of its own. Nothing you do in the app reaches the author. This page says what stays on your Mac, which services the app talks to in your name and what they can see, and what this website records. Effective 2026-10-01.

## No accounts, no telemetry

The app asks for no account, no email and no name. It sends no analytics, no crash reports and no usage data, and it never contacts a server run by the author. The author cannot see your balances, your rules or your conversations with your agent, and has no way to reset, recover or freeze anything for you. Two things below are the exceptions. The `phosphor` label lets anyone, the author included, see which public NEAR Intents moves came from Phosphor. An invite code, once claimed, ties the wallet that claimed it to Phosphor's invite treasury in public.

## The phosphor label

Since version 0.10.11, every move Phosphor prices through NEAR Intents' 1Click API carries the label `phosphor` (the quote's `referral` field): swaps, sends, payouts, moves into and out of Hyperliquid, and an invite claim that goes through 1Click. So a send to someone else is also marked as coming from Phosphor. The move itself was already public: NEAR Intents shows every one, with its amounts, its addresses and its status, on its explorer. The label adds one fact to that public record, that the move came from Phosphor. The author uses it to count Phosphor's moves, volume and wallets from NEAR Intents' own data, so those numbers are not something the app reports about you. The app sends nothing new: the label goes only to NEAR Intents, inside the request it already made. Trades on Hyperliquid carry no label.

## Invite codes

An invite code is a small NEAR Intents account that holds money for a new wallet. Each code is funded from Phosphor's invite treasury, and the treasury from the author's own wallet. Claiming a code in the app moves its money into your wallet.

- **What becomes public.** The claim is a transfer on NEAR Intents, and every transfer there is public. Anyone can see that your wallet received money from an account the invite treasury funded and, because the author's wallet funds the treasury, that your wallet is linked to the author's. The author knows who got each code, so the author can tell which wallet is yours and see its public balance and moves, as anyone who knows an address can.
- **Who sees the claim.** The app signs the claim on your Mac, sends it to the NEAR Intents solver relay (chaindefuser.com) and checks it on public NEAR RPC nodes. They see it the way they see every Phosphor read: your IP address, the request and the addresses it concerns. If the relay turns the claim away, the app sends it through NEAR Intents' 1Click API instead, which sees the same.
- **The code itself.** The part of an invite link after # never reaches this site's servers or its analytics, and the invite page sends the code nowhere. Anyone who can read the message the link came in can read the code, so treat it like cash. The app uses the code on your Mac to sign the claim and does not write it to a file or a log, unless you paste it into the chat in a form the chat does not recognize. Paste codes only where Phosphor asks "Have an invite code?".

## What stays on your Mac

- **Keys.** Your key file, `keys.enc.json`, lives under `~/.phosphor`. It is one encrypted envelope. On a Touch ID wallet the key that opens it is sealed to your Mac's Secure Enclave, so the file opens only on this Mac, and a copy of it is not a backup. On a password wallet your password opens it. Your backup is your recovery phrase. Phosphor keeps no copy of either. If you lose the file and the phrase, nobody can restore the wallet.
- **State.** Your rules, your saved addresses, the append-only audit log, the agent's seat secret, the read key, the record of each invite claim (never the code) and the window's preferences live in `~/Library/Application Support/com.karimbabasf.phosphor/`.
- **Your agent's transcript.** When the app starts your assistant, the conversation is held by that agent on your Mac, under your own account.

Before you delete anything, back up your recovery phrase: the Recovery phrase row in the Vault tab, and [Getting started](/docs/getting-started/) says how. To remove Phosphor, delete the app and those two folders, and remove the `phosphor` entry it added to your agents' settings (Claude Code, Codex, Grok or Hermes).

## Who the app talks to, in your name

When you or your agent act, the app sends requests straight from your Mac to the venue that performs the move. Each of these sees your IP address, the request, and the address it concerns.

- **NEAR Intents**, through its 1Click API and bridge (chaindefuser.com): deposit addresses, quotes, swaps, sends, and your intents account.
- **Hyperliquid** (api.hyperliquid.xyz): your account address, orders, positions and the messages you sign.
- **Public RPC nodes and price feeds** (for example publicnode.com, fastnear.com, CoinGecko and Coinbase): balance reads, prices and chain data for your addresses.
- **Block explorers and chain indexers** (for example blockscout.com, mempool.space and nearblocks.io): when your agent looks up an address or a transaction. That can be any address it names, not only yours.
- **Four crypto news sites** (CoinDesk, Cointelegraph, The Block and Decrypt): when your agent asks for the news. They see your IP address and nothing else.
- **A web page your agent reads**: the app fetches it from your Mac, only at an address a web search returned or you typed, so that site sees your IP address and the address asked for.
- **GitHub** (github.com): the release manifest, when the app checks for an update. GitHub sees the request and nothing about your wallet.
- **Block explorer pages**, when you click a link in the window; they open in your browser.

Their privacy policies apply to what they receive. The author does not run, monitor or control any of them.

## Your agent

Phosphor has no AI inside it. The agent you connect (Claude Code, Codex, or any other MCP client) runs under your own account with its own provider, and everything it reads through Phosphor becomes part of that conversation: balances, prices, proposals, your rules and the sentences you type. Start your assistant runs Claude Code under your Claude account, or Grok under yours, locked to Phosphor's tools and, for Claude, its provider's web search, so your searches go to that provider; the same applies. Read your provider's privacy policy, because it, not this page, governs that data.

## This website

The site is static and hosted on Vercel, and it sets no cookies. Its pages count visits with Vercel Web Analytics, which records the page, the site you came from, your country, region and city, and your browser, operating system and device type. It tells visits apart by a hash of the request, not a cookie, and Vercel discards that hash after 24 hours. The invite page and the page for a wrong address load no analytics, because an invite link carries its code in the address. Vercel keeps the ordinary server logs a host keeps (IP address, page requested, browser) to run the service. The live chart on the front page fetches prices from Hyperliquid's public API directly from your browser, so Hyperliquid sees your IP when you open the page. The download is served from Vercel's file storage.

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
