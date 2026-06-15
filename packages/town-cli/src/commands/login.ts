// `town login` — authenticate with CORE and save the resulting PAT to
// ~/.town/config.json so every subsequent command can present it as a
// Bearer to the town server.
//
// Flow (mirrors @redplanethq/corebrain):
//   1. Prompt for the CORE host (default https://app.getcore.me) and the
//      town server host (default http://localhost:3000 for dev).
//   2. If a PAT for the same coreUrl already exists, ping CORE /api/v1/me
//      to verify it's still good. If so, short-circuit.
//   3. POST /api/v1/authorization-code (unauthenticated) → { authorizationCode }
//   4. Open the user's browser to
//        `${coreUrl}/agent/verify/${base64(code)}?source=town-cli`
//   5. Poll POST /api/v1/token { authorizationCode } until it returns
//      `{ token: { token } }` (the PAT) or we time out.
//   6. Save { coreUrl, townUrl, pat } via updateConfig().

import { Command } from "commander";
import { exec } from "node:child_process";
import * as p from "@clack/prompts";
import chalk from "chalk";

import { getConfig, updateConfig } from "../config.js";

const DEFAULT_CORE_URL = "https://app.getcore.me";
const DEFAULT_TOWN_URL = "http://localhost:3000";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.error("[town login] failed to open browser:", err.message);
  });
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`POST ${url} → ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function checkAuth(coreUrl: string, pat: string): Promise<boolean> {
  try {
    const res = await fetch(`${coreUrl}/api/v1/me`, {
      headers: { authorization: `Bearer ${pat}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface AuthorizationCodeResponse {
  authorizationCode?: string;
}

interface TokenExchangeResponse {
  token?: { token?: string } | null;
}

async function runLogin(): Promise<void> {
  p.intro(chalk.bgCyan(chalk.black(" town login ")));

  const cfg = getConfig();

  const coreUrl = (await p.text({
    message: "CORE host URL",
    placeholder: DEFAULT_CORE_URL,
    initialValue: cfg.auth?.coreUrl ?? DEFAULT_CORE_URL,
  })) as string;
  if (p.isCancel(coreUrl)) {
    p.cancel("Login cancelled");
    return;
  }

  const townUrl = (await p.text({
    message: "Town server URL",
    placeholder: DEFAULT_TOWN_URL,
    initialValue: cfg.auth?.townUrl ?? DEFAULT_TOWN_URL,
  })) as string;
  if (p.isCancel(townUrl)) {
    p.cancel("Login cancelled");
    return;
  }

  const spinner = p.spinner();

  // 1. Short-circuit if already authenticated for this coreUrl.
  spinner.start("Checking existing authentication...");
  if (cfg.auth?.pat && cfg.auth.coreUrl === coreUrl) {
    if (await checkAuth(coreUrl, cfg.auth.pat)) {
      // Refresh townUrl in case the user pointed it at a new host.
      updateConfig({ auth: { ...cfg.auth, townUrl } });
      spinner.stop(chalk.green("Already authenticated"));
      p.outro(chalk.green(`Logged in to ${coreUrl}; town server set to ${townUrl}.`));
      return;
    }
  }

  // 2. Mint an authorization code.
  spinner.message("Requesting authorization code...");
  let authCode = "";
  try {
    const res = await postJson<AuthorizationCodeResponse>(
      `${coreUrl}/api/v1/authorization-code`,
    );
    if (!res.authorizationCode) throw new Error("missing authorizationCode in response");
    authCode = res.authorizationCode;
  } catch (err) {
    spinner.stop(chalk.red("Failed to get authorization code"));
    p.outro(chalk.red(err instanceof Error ? err.message : "unknown error"));
    process.exit(1);
  }
  spinner.stop(chalk.green("Authorization code received"));

  // 3. Build verify URL + open the browser.
  const verifyToken = Buffer.from(
    JSON.stringify({ authorizationCode: authCode, source: "town-cli", clientName: "town-cli" }),
  ).toString("base64");
  const verifyUrl = `${coreUrl}/agent/verify/${verifyToken}?source=town-cli`;
  p.log.info("Opening browser to authorize...");
  p.log.message(chalk.cyan(verifyUrl));
  openBrowser(verifyUrl);

  // 4. Poll for the PAT.
  spinner.start("Waiting for authorization...");
  const startedAt = Date.now();
  while (true) {
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      spinner.stop(chalk.red("Login timed out"));
      p.outro(chalk.red("Authorization did not complete within 5 minutes. Run `town login` again."));
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const res = await postJson<TokenExchangeResponse>(
        `${coreUrl}/api/v1/token`,
        { authorizationCode: authCode },
      );
      const pat = res.token?.token;
      if (pat) {
        updateConfig({ auth: { coreUrl, townUrl, pat } });
        spinner.stop(chalk.green("Authorization successful"));
        p.outro(chalk.green(`Saved PAT to ~/.town/config.json. Town server set to ${townUrl}.`));
        return;
      }
    } catch {
      // 4xx/5xx while user hasn't authorized yet — keep polling.
    }
  }
}

export function registerLogin(program: Command): void {
  program
    .command("login")
    .description("Authenticate with CORE and save a PAT to ~/.town/config.json")
    .action(async () => {
      await runLogin();
    });
}
