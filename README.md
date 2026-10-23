# DSH Workmate

A DeepSeek Harness plugin that puts WorkBuddy's model catalog into DSH — both the
international (`www.workbuddy.ai`) and the domestic (`copilot.tencent.com`)
deployment, free and paid models alike. The WorkBuddy desktop app is **not**
required: sign in from the browser, and the plugin keeps its own per-region
credentials under `$DSH_HOME`.

- **Sign-in** — browser OAuth against the official CLI endpoints, one flow per
  region. If a desktop app is already installed and signed in, its credential
  can be imported read-only instead.
- **Accounts** — a separate account list per region, explicit switching,
  remaining credits on the card, and an optional note per account. The plugin's
  credential copies never write to the desktop app's files.
- **Daily check-in** — one action collects the daily check-in, the growth trip,
  and every growth-center task. Automatic check-in is available and off by
  default.
- **Region isolation** — credentials, model catalogs, and credit balances are
  kept apart. Switching accounts only affects subsequent requests; anything
  already in flight keeps its original account.
- **No configuration required** — install it, enable it, pick a model.

Supported host: DSH `0.2.0-rc.2` through `0.2.1`.

## Requirements

- Node.js 22.19+ or 24+
- DeepSeek Harness with the `web` profile
- A WorkBuddy account in either region

## Install

```sh
dsh plugin --profile web add @bushizhanghan/dsh-workmate
dsh web
```

Then open **Settings → Plugins → DSH Workmate**, click **Connect**, and sign in
on the WorkBuddy page that opens.

Signing in from a terminal works too:

```sh
dsh plugin --profile web exec dsh-workmate login
```

**Restart `dsh web`** after installing, upgrading, or signing in. Reloading the
browser is not enough — the host keeps the plugin's modules in memory.

## Choosing a model

With the default **free models only** scope, the picker lists exactly the models
that region's live catalog currently prices at `x0.00`. Switch the scope to
**all models** on the settings card to see the paid ones — those burn credits.

A default model can be pinned in `~/.dsh/settings.yaml`:

```yaml
agent-default-model:
  provider: workbuddy-ai
  model: hy3
  reasoningEffort: high
```

Use an id the region actually lists. The model list is whatever the live catalog
returns, so a hard-coded default can go stale; `hy3` is free in both regions at
the time of writing.

## How sign-in works

Each region talks to its own auth endpoints, independently:

1. `POST /v2/plugin/auth/state?platform=CLI&nonce=`
2. Open the returned `authUrl` in a browser
3. Poll `GET /v2/plugin/auth/token?state=` — pending requests answer `11217`
4. Store the token in that region's plugin copy:
   `$DSH_HOME/.workbuddy-ai-auth.json` (international) or
   `$DSH_HOME/.workbuddy-cn-auth.json` (domestic)

The desktop app's `workbuddy-desktop-ai.info` (international) and
`workbuddy-desktop.info` (domestic) are opened read-only. The plugin only ever
writes its own copies, obtained through OAuth.

**Disconnect** and `logout` delete that region's plugin credentials only. The
desktop app is left alone.

## Settings

Settings → Plugins → **DSH Workmate** exposes:

- **Connect / Disconnect** per region
- The account list for each region, with explicit switching, remaining credits,
  a per-account note, and a connectivity test
- Domestic account selection and the automatic check-in toggle (off by default)
- Refresh intervals — the active account every 15 minutes and the others every
  60 minutes by default
- Model scope: **free models only** (default) or **all models**

The same settings can be written into the profile's `cordis.patch.yml`:

```yaml
- id: llm-workbuddy
  config:
    modelScope: free          # international: free | all
    cnModelScope: free        # domestic: free | all
    probeConsent: false       # real model probing, off by default
    autoCheckin: false        # domestic auto check-in, off by default
    refreshActiveMinutes: 15
    refreshInactiveMinutes: 60
    # Hosts used to reach DSH Web over the LAN (never add these to the loopback list)
    # allowedHosts: ["192.168.1.10"]
    # authFile / cnAuthFile: only for a non-default desktop credential path
```

Environment variables:

| Variable | Effect |
|---|---|
| `DSH_WORKBUDDY_AUTH_FILE` | Overrides the international desktop credential path. OAuth credentials still go to the plugin's own file. |
| `DSH_WORKBUDDY_CN_AUTH_FILE` | Overrides the domestic desktop credential path. |

## CLI

```sh
dsh plugin --profile web exec dsh-workmate login
dsh plugin --profile web exec dsh-workmate status
dsh plugin --profile web exec dsh-workmate doctor
dsh plugin --profile web exec dsh-workmate logout
```

`status` and `doctor` accept `--json`. `logout` removes only
`$DSH_HOME/.workbuddy-ai-auth.json`.

## Compatibility

The seven `@deepseek-ai/dsh-*` peer dependencies are declared as
`>=0.2.0-rc.2 <0.2.1 || >=0.2.1-0 <0.3.0-0` rather than pinned to a single
release. DSH validates every `@deepseek-ai/dsh*` peer against the running host
before it loads a plugin, so an exact pin rejects the plugin wholesale on any
other host build. The second segment is what makes `0.2.1-rc.2` resolve —
prerelease tags do not fall inside a plain `>=0.2.0-rc.2 <0.3.0-0` range.

The `<0.3.0-0` upper bound is deliberate: a 0.3 host may change the plugin API,
and this package will not claim otherwise.

## Troubleshooting

| Symptom | Fix |
|---|---|
| No card in settings, no WorkBuddy models | Restart `dsh web`. Reloading the browser does not reload the host. |
| `dsh web` exits right after clicking Connect | On headless Linux without `xdg-open`, upgrade to a build that handles spawn `error`; use the sign-in link shown on the card. |
| 403 `request-not-trusted` when opening the card over a LAN address | Add that address to `allowedHosts`. Do not add it to the loopback list. |
| Signed in but the model list is empty | The region's catalog request failed or returned nothing. Check connectivity and whether the token is still valid — the list stays empty rather than borrowing the other region's models. |
| `doctor` reports signed-out | Run `login` first, or check that the international desktop app is signed in. |
| Paid models are missing | Set the scope to "all models" on the settings card. Credits will be spent. |

## Relationship to upstream

This package started as a compatibility fork of
[`Faide-cyber/dsh-workbuddy`](https://github.com/Faide-cyber/dsh-workbuddy)
(v1.0.12, commit `9951d25`) and is maintained by
[@bushizhanghan](https://github.com/bushizhanghan). Upstream is still the main
line for the same feature; the fork exists because the published package would
not load on DSH 0.2.1, and because the host's default client name was rejected
by the upstream service.

Since then the codebase has been reorganised — module layout, naming, comments,
and the build/CI wiring — while behaviour stays the same. The original MIT
license and copyright notice are kept unchanged in `LICENSE` and `NOTICE`; the
diff against upstream 1.0.12 is in `patches/`.

If upstream ships equivalent fixes, prefer the official package over this one.

## Disclaimer

For personal learning and research, driving your own WorkBuddy account on your
own machine. Follow the WorkBuddy terms of service. This project is not
affiliated with Tencent, WorkBuddy, or DeepSeek.

## License

[MIT](./LICENSE)
