# Per-Wallet Verification Matrix — Results

**Issue:** #73 — Execute and record the real-extension per-wallet matrix  
**Issue:** #76 — Verify mobile and WalletConnect flows on real devices  
**Last updated:** 2026-11-23

This file is the persistent record of human-executed wallet integration tests.
Update it whenever a wallet is verified or a regression is found.

## How to run

1. Deploy the frontend against Stellar Testnet (or use `NEXT_PUBLIC_STELLAR_NETWORK=testnet` locally).
2. Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` for the WalletConnect QR tests.
3. Install the browser wallet extension or mobile wallet app under test.
4. Use the authorized testnet issuer wallet address.
5. For each row: attempt Connect → Authorize issuer → Issue → Batch issue → Revoke → Claim (`/claim`).
6. Record ✅ (passed), ❌ (failed with reason), or N/A, plus the wallet version and date.

For Albedo and Rabet, the `/claim` column is inverted: verify the page refuses early with a named explanation, **not** that it allows signing (they do not support message signing).

---

## Desktop wallet extensions

| Wallet | Version tested | Date | Connect | Authorize issuer | Issue | Batch issue | Revoke | Claim (`/claim`) | Notes |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| Freighter | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| xBull | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | isAvailable traps on mobile — see TEST_STRATEGY.md |
| Lobstr | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Hana | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Klever | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| OneKey | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Bitget | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| HOT Wallet | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Hardcodes PUBLIC network; excluded from mobile (testnet mismatch) |
| Albedo | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | **N/A — verify early refusal** | No message signing; `/claim` must refuse with named explanation |
| Rabet | — | — | ☐ | ☐ | ☐ | ☐ | ☐ | **N/A — verify early refusal** | No message signing; `/claim` must refuse with named explanation |

### Albedo / Rabet `/claim` early-refusal check

Expected: the `/claim` page detects that the connected wallet does not support
`stellar_signMessage` and displays a named explanation (e.g. "This wallet does not
support message signing — use Freighter or another compatible wallet to claim
credentials") **before** the user fills out the form.

| Wallet | Refuses early | Explanation shown | Date |
|---|:---:|:---:|---|
| Albedo | ☐ | ☐ | — |
| Rabet | ☐ | ☐ | — |

---

## Mobile flows (#76)

### Real device — wallet apps

Test against a real iOS or Android device. Connect via WalletConnect QR, then
issue and claim credentials using the wallet app.

| Device / OS | Wallet app | Version | Date | QR connect | Authorize | Issue | Claim | Notes |
|---|---|---|---|:---:|:---:|:---:|:---:|---|
| iOS (iPhone) | — | — | — | ☐ | ☐ | ☐ | ☐ | |
| Android | — | — | — | ☐ | ☐ | ☐ | ☐ | |

### WalletConnect session requirements

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` must be set (free from [Reown](https://cloud.reown.com)).
- `allowedChains` is derived from `activeNetwork` — testnet deployments will request a testnet session.
- If the QR code does not appear, confirm the env var is set and the deployment has been rebuilt.

### Emulated Chromium baseline (already verified)

The following was verified in emulated Chromium before this issue was opened and
serves as a baseline; real-device verification is still needed:

| Check | Result |
|---|---|
| Wallets reporting available on mobile | xBull, Albedo, HOT Wallet |
| Wallets that actually work | Albedo only |
| Modal at 360px | 352px wide, no horizontal scroll, 0 axe violations |
| Modal at 320px | 320px wide, no overflow, 0 axe violations |
| Header tap targets | 44px (WCAG 2.5.5) |
| `/claim` on mobile | Shows options notice; offers desktop route |

---

## Known issues and traps

| Issue | Description | Status |
|---|---|---|
| `isAvailable` on mobile | xBull and HOT Wallet return `true` unconditionally on mobile | Known; documented in `TEST_STRATEGY.md` and `walletPlatform.test.ts` |
| HOT Wallet testnet | Hardcodes `Networks.PUBLIC`; will sign against mainnet on testnet deployments | Excluded from mobile testing |
| Escape key on kit modal | Kit does not close its own modal on Escape — upstream issue | Known; not a WCAG failure |

---

## How to record a result

Replace ☐ with ✅ or ❌. For failures add a note:

```
| Freighter | 5.1.0 | 2026-11-23 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | |
| xBull | 1.9.1 | 2026-11-23 | ✅ | ✅ | ❌ | ❌ | — | — | Batch issue hangs on sign; linked follow-up: #NNN |
```

Open a follow-up issue for any ❌ and link it in the Notes column.
