// LCS (longest common subsequence) based line diff.
//
// This is a classic O(n*m) dynamic-programming LCS over the two line arrays,
// followed by a backtrack through the DP table to emit an ordered list of
// diff rows (added / removed / unchanged). This is NOT a naive index-by-index
// comparison — lines that shifted position (insertions/deletions in the
// middle of the text) are still correctly matched as "unchanged" wherever
// they appear in the longest common subsequence.

export type DiffRowType = "added" | "removed" | "unchanged";

export interface DiffRow {
  type: DiffRowType;
  text: string;
  leftNo: number | null;
  rightNo: number | null;
}

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

export interface DiffSummary {
  additions: number;
  deletions: number;
}

export interface DiffResult {
  rows: DiffRow[];
  summary: DiffSummary;
}

function normalizeLine(line: string, options: DiffOptions): string {
  let out = line;
  if (options.ignoreWhitespace) out = out.trim();
  if (options.ignoreCase) out = out.toLowerCase();
  return out;
}

/**
 * Builds the DP table for the longest common subsequence between two
 * sequences of (already normalized) lines, then backtracks it into an
 * ordered list of diff rows against the ORIGINAL (un-normalized) lines.
 */
function lcsDiff(
  leftLines: string[],
  rightLines: string[],
  leftKeys: string[],
  rightKeys: string[]
): DiffRow[] {
  const n = leftLines.length;
  const m = rightLines.length;

  // dp[i][j] = length of LCS of leftKeys[i..] and rightKeys[j..]
  const dp: Uint32Array[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Uint32Array(m + 1);

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (leftKeys[i] === rightKeys[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  let leftNo = 1;
  let rightNo = 1;

  while (i < n && j < m) {
    if (leftKeys[i] === rightKeys[j]) {
      rows.push({
        type: "unchanged",
        text: leftLines[i],
        leftNo: leftNo++,
        rightNo: rightNo++,
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({
        type: "removed",
        text: leftLines[i],
        leftNo: leftNo++,
        rightNo: null,
      });
      i++;
    } else {
      rows.push({
        type: "added",
        text: rightLines[j],
        leftNo: null,
        rightNo: rightNo++,
      });
      j++;
    }
  }

  while (i < n) {
    rows.push({ type: "removed", text: leftLines[i], leftNo: leftNo++, rightNo: null });
    i++;
  }
  while (j < m) {
    rows.push({ type: "added", text: rightLines[j], leftNo: null, rightNo: rightNo++ });
    j++;
  }

  return rows;
}

export function computeDiff(
  original: string,
  changed: string,
  options: DiffOptions
): DiffResult {
  // Split on newlines. A trailing newline produces one extra empty element
  // in split(); trimming that keeps line numbers matching what's visible.
  const leftLines = original.length === 0 ? [] : original.split("\n");
  const rightLines = changed.length === 0 ? [] : changed.split("\n");

  const leftKeys = leftLines.map((l) => normalizeLine(l, options));
  const rightKeys = rightLines.map((l) => normalizeLine(l, options));

  const rows = lcsDiff(leftLines, rightLines, leftKeys, rightKeys);

  const summary = rows.reduce(
    (acc, row) => {
      if (row.type === "added") acc.additions++;
      if (row.type === "removed") acc.deletions++;
      return acc;
    },
    { additions: 0, deletions: 0 } as DiffSummary
  );

  return { rows, summary };
}
