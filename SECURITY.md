# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| `0.x`   | Yes       |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security reports.

Email the maintainers with:

- a short description of the issue
- steps to reproduce
- impact assessment (auth bypass, data exposure, RCE, etc.)
- any proof-of-concept (non-destructive)

We aim to acknowledge reports within a few business days and will coordinate a fix and disclosure timeline with you.

## Hardening checklist for self-hosters

- Rotate `JWT_SECRET` before any production deploy
- Never commit `.env` files
- Restrict CORS and `API_PUBLIC_URL` to known hosts
- Keep Postgres unreachable from the public internet
- Treat `LLM_API_KEY` / `AVALAI_API_KEY` (or any LLM provider key) like a password
