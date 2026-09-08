# AutoConnect

AutoConnect is a TanStack Start and Supabase marketplace for vehicles, parts, and aftercare.

## Server configuration

Set secrets in the deployment environment, never in client code:

- `OPENAI_API_KEY` powers search assistance, listing copy, and review guidance.
- `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.
- Configure Stripe and PesaPal secrets only when those payment rails are enabled.

## Development

You need Node.js and pnpm.

```sh
git clone <this-repository-url>
cd <repository-name>
pnpm install
pnpm dev
```

