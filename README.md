# Telegram Auto-Bounty Worker

This project allows you to deploy a Telegram`X`ChatGPT auto bounty issue creator using Cloudflare Workers and wrangler.

## Getting Started

1. Fork/clone the repository:

2. Install dependencies:

If you are using `npm`:

```bash
cd telegram-auto-bounty-worker
npm install
```

If you are using `yarn`:

```bash
cd telegram-auto-bounty-worker
yarn
```

3. Environment Setup:

- Copy the `environment.example.json` file and rename it to `environment.json`.

- Fill in the required data in the environment.json file.

- After filling in the data, run the setup key command:

If you are using npm:

```bash
npm run setup-key
```

If you are using yarn:

```bash
yarn setup-key
```

This command will set up the necessary secrets for your Cloudflare Workers application and await until the setup is complete.

4. Changing Keys:

If you need to change any key, you can use the following command:

```bash
wrangler secret delete <KEY>
```

Replace `<KEY>` with the name of the secret key you want to change. After deleting the key, you can run the setup key command again to set the new key.

5. Deploying the App:

To deploy the application, simply run:

```bash
yarn deploy
```

This command will deploy your Cloudflare Workers application and make it accessible.
