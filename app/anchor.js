// Aligns the word sequences of two versions of a paper and maps word ranges
// from the old version onto the new one. Mímir uses it to carry comments
// across a revised PDF: a comment covers a range of words in the old PDF, and
// the alignment says where those words went.
//
// The alignment is a patience diff over normalized words: words that occur
// exactly once in both versions anchor the match, the gaps between anchors
// are aligned recursively, and small gaps with no unique words fall back to a
// longest-common-subsequence table. Prose revisions keep most unique words,
// so the anchors are dense and the result follows the edits closely.
(function (root) {
  "use strict";

  const LCS_CELLS = 4e6;

  // Returns the matched pairs [i, j] (a[i] === b[j]), increasing in both i and j.
  function matchWords(a, b) {
    const pairs = [];
    rec(0, a.length, 0, b.length);
    return pairs;

    function rec(a0, a1, b0, b1) {
      while (a0 < a1 && b0 < b1 && a[a0] === b[b0]) pairs.push([a0++, b0++]);
      const tail = [];
      while (a0 < a1 && b0 < b1 && a[a1 - 1] === b[b1 - 1]) tail.push([--a1, --b1]);
      if (a0 < a1 && b0 < b1) {
        const anchors = uniqueAnchors(a0, a1, b0, b1);
        if (anchors.length) {
          let pa = a0, pb = b0;
          for (const [i, j] of anchors) { rec(pa, i, pb, j); pairs.push([i, j]); pa = i + 1; pb = j + 1; }
          rec(pa, a1, pb, b1);
        } else if ((a1 - a0) * (b1 - b0) <= LCS_CELLS) lcs(a0, a1, b0, b1);
      }
      for (let k = tail.length - 1; k >= 0; k--) pairs.push(tail[k]);
    }

    // Words unique on both sides, in a's order, reduced to the longest run
    // that is also increasing in b.
    function uniqueAnchors(a0, a1, b0, b1) {
      const seen = new Map();
      for (let i = a0; i < a1; i++) { const s = seen.get(a[i]); if (s) s.na++; else seen.set(a[i], { na: 1, nb: 0, i, j: -1 }); }
      for (let j = b0; j < b1; j++) { const s = seen.get(b[j]); if (s) { s.nb++; s.j = j; } }
      const cand = [];
      for (const s of seen.values()) if (s.na === 1 && s.nb === 1) cand.push([s.i, s.j]);
      cand.sort((x, y) => x[0] - y[0]);
      return longestIncreasing(cand);
    }

    function lcs(a0, a1, b0, b1) {
      const n = a1 - a0, m = b1 - b0, w = m + 1;
      const t = new Int32Array((n + 1) * w);
      for (let i = n - 1; i >= 0; i--)
        for (let j = m - 1; j >= 0; j--)
          t[i * w + j] = a[a0 + i] === b[b0 + j] ? t[(i + 1) * w + j + 1] + 1 : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
      let i = 0, j = 0;
      while (i < n && j < m) {
        if (a[a0 + i] === b[b0 + j]) { pairs.push([a0 + i, b0 + j]); i++; j++; }
        else if (t[(i + 1) * w + j] >= t[i * w + j + 1]) i++;
        else j++;
      }
    }
  }

  // Longest subsequence of pairs whose second element increases (patience sorting).
  function longestIncreasing(pairs) {
    const tops = [], prev = new Array(pairs.length);
    for (let k = 0; k < pairs.length; k++) {
      let lo = 0, hi = tops.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (pairs[tops[mid]][1] < pairs[k][1]) lo = mid + 1; else hi = mid; }
      prev[k] = lo ? tops[lo - 1] : -1;
      tops[lo] = k;
    }
    const out = [];
    for (let k = tops.length ? tops[tops.length - 1] : -1; k >= 0; k = prev[k]) out.push(pairs[k]);
    return out.reverse();
  }

  // Aligns old words a with new words b. For each old word i the result holds
  // the new words it became, lo[i]..hi[i] (empty when hi < lo, which means the
  // word was deleted and lo is where it used to sit), and whether it survived
  // unchanged (same[i]). Words in a replaced stretch share the replacement
  // proportionally, so a comment on part of a rewritten sentence lands on the
  // corresponding part of the new sentence.
  function align(a, b) {
    const n = a.length, lo = new Int32Array(n), hi = new Int32Array(n), same = new Uint8Array(n);
    const pairs = matchWords(a, b);
    pairs.push([n, b.length]);
    let pa = -1, pb = -1;
    for (const [i, j] of pairs) {
      const dl = i - pa - 1, il = j - pb - 1;
      for (let k = 0; k < dl; k++) {
        const x = pa + 1 + k;
        lo[x] = pb + 1 + Math.floor((k * il) / dl);
        hi[x] = pb + Math.ceil(((k + 1) * il) / dl);
      }
      if (i < n) { lo[i] = hi[i] = j; same[i] = 1; }
      pa = i; pb = j;
    }
    return { lo, hi, same, newLength: b.length };
  }

  // Maps the old word range s..e (inclusive) through an alignment.
  // status: "same" when every word survived and nothing was inserted between
  // them, "changed" when some new text covers the range, "removed" when it
  // all was deleted (start..end is then empty and start is where it was).
  function mapRange(al, s, e) {
    let start = al.lo[s], end = al.hi[e];
    let allSame = true;
    for (let i = s; i <= e; i++) if (!al.same[i]) { allSame = false; break; }
    const status = end < start ? "removed" : allSame && end - start === e - s ? "same" : "changed";
    if (status === "removed") { start = Math.min(start, al.newLength); end = start - 1; }
    return { start, end, status };
  }

  root.MimirAnchor = { align, mapRange, matchWords };
})(typeof globalThis !== "undefined" ? globalThis : this);
