// Tests for app/anchor.js. Run with `node test/anchor.test.js` from the repo root
// (or with any JavaScript shell that has `load`, such as macOS's jsc).
if (typeof require === "function") require("../app/anchor.js"); else load("app/anchor.js");
const { align, mapRange } = globalThis.MimirAnchor;
const log = typeof console !== "undefined" ? (s) => console.log(s) : print;

let failed = 0;
function check(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) log("ok   " + name); else { failed++; log("FAIL " + name + "\n     got  " + g + "\n     want " + w); }
}
const words = (s) => s.split(/\s+/).filter(Boolean);
// Maps the old words from..to (as text) and returns the new text and status.
function carry(oldText, newText, phrase) {
  const a = words(oldText), b = words(newText), p = words(phrase);
  let s = -1;
  for (let i = 0; i + p.length <= a.length && s < 0; i++) if (p.every((w, k) => a[i + k] === w)) s = i;
  const r = mapRange(align(a, b), s, s + p.length - 1);
  return [b.slice(r.start, r.end + 1).join(" "), r.status];
}

const v1 = "we present cilkworm a race detector for task parallel programs it finds every race in one run and costs a constant factor";
check("unchanged text maps to itself", carry(v1, v1, "finds every race"), ["finds every race", "same"]);
check("text shifted by an insertion earlier",
  carry(v1, "abstract " + v1, "a constant factor"), ["a constant factor", "same"]);
check("reworded phrase lands on its replacement",
  carry(v1, v1.replace("finds every race", "reports all races"), "finds every race"), ["reports all races", "changed"]);
check("insertion inside the range is flagged",
  carry(v1, v1.replace("every race", "every determinacy race"), "every race"), ["every determinacy race", "changed"]);
check("deleted sentence collapses to where it was",
  carry(v1, v1.replace(" it finds every race in one run", ""), "it finds every race in one run"), ["", "removed"]);
check("repeated phrase keeps its own occurrence",
  carry("the race is a race we fix the race", "the race is a big race we fix the race", "fix the race"), ["fix the race", "same"]);
check("partly deleted range keeps the surviving words",
  carry(v1, v1.replace("in one run and", "and"), "race in one run and costs"), ["race and costs", "changed"]);
const big = Array.from({ length: 20000 }, (_, i) => "w" + (i % 5000)).join(" ");
check("large repetitive documents finish", carry(big, "start " + big, "w10 w11 w12")[1], "same");

log(failed ? failed + " failed" : "all passed");
if (failed && typeof process !== "undefined") process.exit(1);
