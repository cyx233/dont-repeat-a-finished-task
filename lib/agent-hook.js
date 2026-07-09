"use strict";

const fs = require('fs');

function getSessionCwd(opts) {
  if (opts.cwd) return opts.cwd;
  if (opts.transcriptPath) {
    try {
      const fd = fs.openSync(opts.transcriptPath, 'r');
      const buf = Buffer.alloc(16384);
      const n = fs.readSync(fd, buf, 0, 16384, 0);
      fs.closeSync(fd);
      const m = buf.toString('utf8', 0, n).match(/"cwd":"([^"]+)"/);
      if (m) return m[1];
    } catch {}
  }
  return undefined;
}

module.exports = { getSessionCwd };
