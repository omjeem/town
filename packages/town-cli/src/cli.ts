// town — companion CLI for editing your plot offline and pushing it back.
//
// Commands:
//   town login   Authenticate with CORE (saves a PAT to ~/.town/config.json).
//   town init    Pull your current plot + NPCs into a local folder.
//   town deploy  (next pass) Push local edits back to the server.
//   town dev     (future) Run a local preview of the plot.

import { Command } from "commander";
import { registerLogin } from "./commands/login.js";
import { registerInit } from "./commands/init.js";

const program = new Command();

program
  .name("town")
  .description("Edit your town plot from the command line.")
  .version("0.1.0");

registerLogin(program);
registerInit(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
