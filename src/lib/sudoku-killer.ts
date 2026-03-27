export function minSum(n: number) {
  return (n * (n + 1)) / 2
}

export function maxSum(n: number) {
  let t = 0
  for (let i = 9; i > 9 - n; i--) t += i
  return t
}

export function pairKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function computeCombinations(
  target: number,
  cells: number,
  excluded: Set<number>,
  required: Set<number>,
): number[][] {
  const out: number[][] = []
  const cur: number[] = []

  function walk(start: number, remaining: number) {
    if (cur.length === cells) {
      if (remaining === 0) out.push([...cur])
      return
    }
    for (let d = start; d <= 9; d++) {
      if (excluded.has(d)) continue
      if (d > remaining) break
      cur.push(d)
      walk(d + 1, remaining - d)
      cur.pop()
    }
  }

  walk(1, target)
  return out.filter(combo => [...required].every(d => combo.includes(d)))
}
