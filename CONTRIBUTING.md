# Contributing

The maintainer is [@smoothvr](https://github.com/smoothvr).

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

```bash
npm test
npm start
```

Without npm:

```bash
node web/test_paritaet.mjs && node web/test_ha.mjs && node web/test_i18n.mjs
cd web && python3 -m http.server 8000
```

Open <http://localhost:8000/>.

## Pull requests

- Branch from `main` and open a pull request.
- `npm test` must pass. It checks the eye formulas, the Home Assistant mapping, and the string catalog.
- Leave the eye motion in `web/augen.js`, `web/zustaende.js`, and `web/engine.js` unchanged unless the proposal includes the matching test update.
- Put interface copy in `web/strings.js`. A new language is a copy of the `en` entries in `CAPTIONS` and `UI`, plus a code in `LOCALES` and `localeCode`.
- Do not commit tokens, local addresses, or installation-specific entity names.
- Use a Conventional Commit message (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `ci:`).

## Security

Report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md). Do not include an email address or a phone number.
