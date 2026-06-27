import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ponytail: no script scanning here — OpenCode plugin just injects behavioral rules.
// Actual scanning happens at the Claude Code hook layer.

export default async ({ client } = {}) => {
  return {
    'experimental.chat.system.transform': async (_input, output) => {
      const rules = [
        "DRAFT plugin is active.",
        "Rules:",
        "1. When a user's task matches a cached script by name or description, RUN that script directly.",
        "2. When a task matches a cached note, READ that note before proceeding.",
        "3. After completing a repeatable file-changing task with no cached script, offer to save it.",
        "4. Do NOT re-derive work that a cached script already handles.",
      ].join('\n');
      output.system.push(rules);
    },
  };
};
