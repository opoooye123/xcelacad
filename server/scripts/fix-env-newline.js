// One-off repair: an append landed on a .env that had no
// trailing newline, gluing CLIENT_URL onto the previous
// line. This splits it back apart without printing any
// values. Safe to delete once it has run.

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

const original = fs.readFileSync(envPath, "utf8");

const lines = original.split(/\r?\n/);

const fixed = [];

for (const line of lines) {
  const at = line.indexOf("CLIENT_URL=");

  if (at > 0) {
    fixed.push(line.slice(0, at));
    fixed.push(line.slice(at));
  } else {
    fixed.push(line);
  }
}

// Collapse any blank lines the split introduced at the end,
// then finish with exactly one newline.
while (fixed.length && fixed[fixed.length - 1] === "") {
  fixed.pop();
}

fs.writeFileSync(envPath, `${fixed.join("\n")}\n`, "utf8");

console.log(
  `Rewrote .env: ${lines.length} line(s) in, ${fixed.length} out.`
);
