// =====================================================
// Construccion de Thompson (AFN) y construccion de
// subconjuntos (AFD) con minimizacion de Moore.
//
// El alfabeto es ASCII de 7 bits (0..127).
// =====================================================

import type { Expr } from "./parser"
import { RegexError } from "./scanner"

export const ALPHABET_SIZE = 128

export type CharSet = boolean[]

function emptySet(): CharSet {
  return new Array<boolean>(ALPHABET_SIZE).fill(false)
}

function singleton(c: string): CharSet {
  const code = c.charCodeAt(0)
  if (code >= ALPHABET_SIZE) {
    throw new RegexError(`Caracter fuera del alfabeto ASCII: '${c}'`, 0)
  }
  const set = emptySet()
  set[code] = true
  return set
}

// -----------------------------------------------------
// AFN
// -----------------------------------------------------

interface NfaState {
  eps: number[]
  moves: { set: CharSet; to: number }[]
}

export interface Nfa {
  states: NfaState[]
  start: number
  /** estado de aceptacion -> indice de la regla */
  accepts: Map<number, number>
}

interface Fragment {
  start: number
  out: number
}

class NfaBuilder {
  states: NfaState[] = []

  newState(): number {
    this.states.push({ eps: [], moves: [] })
    return this.states.length - 1
  }

  addEps(from: number, to: number): void {
    this.states[from].eps.push(to)
  }

  addMove(from: number, set: CharSet, to: number): void {
    this.states[from].moves.push({ set, to })
  }

  build(expr: Expr): Fragment {
    switch (expr.kind) {
      case "char":
        return this.symbol(singleton(expr.value))

      case "dot": {
        // Igual que en Flex: '.' acepta cualquier caracter menos '\n'
        const set = emptySet()
        for (let c = 0; c < ALPHABET_SIZE; c++) set[c] = c !== 10
        return this.symbol(set)
      }

      case "class": {
        const set = emptySet()
        for (const el of expr.elements) {
          const a = el.first.charCodeAt(0)
          const b = el.last.charCodeAt(0)
          for (let c = a; c <= b && c < ALPHABET_SIZE; c++) set[c] = true
        }
        if (expr.negated) {
          for (let c = 0; c < ALPHABET_SIZE; c++) set[c] = !set[c]
        }
        return this.symbol(set)
      }

      case "string": {
        // Cadena vacia -> epsilon
        if (expr.value.length === 0) {
          const s = this.newState()
          const t = this.newState()
          this.addEps(s, t)
          return { start: s, out: t }
        }
        let frag = this.symbol(singleton(expr.value[0]))
        for (let i = 1; i < expr.value.length; i++) {
          frag = this.concat(frag, this.symbol(singleton(expr.value[i])))
        }
        return frag
      }

      case "binary": {
        const left = this.build(expr.left)
        const right = this.build(expr.right)
        return expr.op === "CONCAT" ? this.concat(left, right) : this.union(left, right)
      }

      case "unary": {
        const frag = this.build(expr.expr)
        if (expr.op === "STAR") return this.star(frag)
        if (expr.op === "PLUS") return this.plus(frag)
        return this.question(frag)
      }
    }
  }

  private symbol(set: CharSet): Fragment {
    const s = this.newState()
    const t = this.newState()
    this.addMove(s, set, t)
    return { start: s, out: t }
  }

  private concat(a: Fragment, b: Fragment): Fragment {
    this.addEps(a.out, b.start)
    return { start: a.start, out: b.out }
  }

  private union(a: Fragment, b: Fragment): Fragment {
    const s = this.newState()
    const t = this.newState()
    this.addEps(s, a.start)
    this.addEps(s, b.start)
    this.addEps(a.out, t)
    this.addEps(b.out, t)
    return { start: s, out: t }
  }

  private star(f: Fragment): Fragment {
    const s = this.newState()
    const t = this.newState()
    this.addEps(s, f.start)
    this.addEps(s, t)
    this.addEps(f.out, f.start)
    this.addEps(f.out, t)
    return { start: s, out: t }
  }

  private plus(f: Fragment): Fragment {
    const s = this.newState()
    const t = this.newState()
    this.addEps(s, f.start)
    this.addEps(f.out, f.start)
    this.addEps(f.out, t)
    return { start: s, out: t }
  }

  private question(f: Fragment): Fragment {
    const s = this.newState()
    const t = this.newState()
    this.addEps(s, f.start)
    this.addEps(s, t)
    this.addEps(f.out, t)
    return { start: s, out: t }
  }
}

/**
 * Combina todas las reglas en un solo AFN con un estado
 * inicial nuevo que va por epsilon a cada regla.
 */
export function buildNfa(asts: Expr[]): Nfa {
  const builder = new NfaBuilder()
  const start = builder.newState()
  const accepts = new Map<number, number>()

  asts.forEach((ast, ruleIndex) => {
    const frag = builder.build(ast)
    builder.addEps(start, frag.start)
    accepts.set(frag.out, ruleIndex)
  })

  return { states: builder.states, start, accepts }
}

// -----------------------------------------------------
// AFD
// -----------------------------------------------------

export interface Dfa {
  numStates: number
  numClasses: number
  start: number
  /** caracter -> clase de equivalencia */
  classOf: number[]
  /** clase -> caracteres que la componen */
  classChars: number[][]
  /** [estado][clase] -> estado destino, o -1 */
  trans: number[][]
  /** [estado] -> indice de regla aceptada, o -1 */
  accept: number[]
  /** [estado] -> conjunto de estados del AFN (antes de minimizar) */
  nfaSets: number[][]
}

function epsilonClosure(nfa: Nfa, states: number[]): number[] {
  const seen = new Set<number>(states)
  const stack = [...states]

  while (stack.length > 0) {
    const s = stack.pop() as number
    for (const next of nfa.states[s].eps) {
      if (!seen.has(next)) {
        seen.add(next)
        stack.push(next)
      }
    }
  }

  return [...seen].sort((a, b) => a - b)
}

function move(nfa: Nfa, states: number[], char: number): number[] {
  const result = new Set<number>()
  for (const s of states) {
    for (const m of nfa.states[s].moves) {
      if (m.set[char]) result.add(m.to)
    }
  }
  return [...result]
}

/**
 * Agrupa los 128 caracteres en clases de equivalencia:
 * dos caracteres pertenecen a la misma clase si aparecen
 * exactamente en los mismos conjuntos del AFN. Asi la tabla
 * de transiciones tiene pocas columnas en lugar de 128.
 */
function computeCharClasses(nfa: Nfa): { classOf: number[]; classChars: number[][] } {
  const sets: CharSet[] = []
  for (const state of nfa.states) {
    for (const m of state.moves) sets.push(m.set)
  }

  const signatures = new Map<string, number>()
  const classOf = new Array<number>(ALPHABET_SIZE).fill(0)
  const classChars: number[][] = []

  for (let c = 0; c < ALPHABET_SIZE; c++) {
    let key = ""
    for (const set of sets) key += set[c] ? "1" : "0"

    let id = signatures.get(key)
    if (id === undefined) {
      id = classChars.length
      signatures.set(key, id)
      classChars.push([])
    }

    classOf[c] = id
    classChars[id].push(c)
  }

  return { classOf, classChars }
}

export function buildDfa(nfa: Nfa): Dfa {
  const { classOf, classChars } = computeCharClasses(nfa)
  const numClasses = classChars.length

  const startSet = epsilonClosure(nfa, [nfa.start])
  const indexOf = new Map<string, number>()
  const sets: number[][] = []
  const trans: number[][] = []
  const accept: number[] = []

  const keyFor = (s: number[]) => s.join(",")

  const addState = (set: number[]): number => {
    const key = keyFor(set)
    const existing = indexOf.get(key)
    if (existing !== undefined) return existing

    const id = sets.length
    indexOf.set(key, id)
    sets.push(set)
    trans.push(new Array<number>(numClasses).fill(-1))

    // Prioridad: gana la regla declarada primero
    let rule = -1
    for (const s of set) {
      const r = nfa.accepts.get(s)
      if (r !== undefined && (rule === -1 || r < rule)) rule = r
    }
    accept.push(rule)

    return id
  }

  addState(startSet)

  for (let i = 0; i < sets.length; i++) {
    for (let cls = 0; cls < numClasses; cls++) {
      const representative = classChars[cls][0]
      const target = move(nfa, sets[i], representative)
      if (target.length === 0) continue
      trans[i][cls] = addState(epsilonClosure(nfa, target))
    }
  }

  return {
    numStates: sets.length,
    numClasses,
    start: 0,
    classOf,
    classChars,
    trans,
    accept,
    nfaSets: sets,
  }
}

/**
 * Minimizacion por refinamiento de particiones (Moore).
 */
export function minimizeDfa(dfa: Dfa): Dfa {
  const n = dfa.numStates
  let block = new Array<number>(n).fill(0)

  // Particion inicial: por regla aceptada
  const initial = new Map<number, number>()
  for (let s = 0; s < n; s++) {
    const key = dfa.accept[s]
    let id = initial.get(key)
    if (id === undefined) {
      id = initial.size
      initial.set(key, id)
    }
    block[s] = id
  }

  for (;;) {
    const signatures = new Map<string, number>()
    const next = new Array<number>(n).fill(0)

    for (let s = 0; s < n; s++) {
      let key = `${block[s]}`
      for (let cls = 0; cls < dfa.numClasses; cls++) {
        const t = dfa.trans[s][cls]
        key += `|${t === -1 ? -1 : block[t]}`
      }

      let id = signatures.get(key)
      if (id === undefined) {
        id = signatures.size
        signatures.set(key, id)
      }
      next[s] = id
    }

    const changed = signatures.size !== new Set(block).size
    block = next
    if (!changed) break
  }

  // Renumerar para que el estado inicial sea 0 y el orden sea estable
  const remap = new Map<number, number>()
  const order: number[] = []
  const queue = [dfa.start]
  const visited = new Set<number>()

  while (queue.length > 0) {
    const s = queue.shift() as number
    const b = block[s]
    if (!remap.has(b)) {
      remap.set(b, order.length)
      order.push(s)
    }
    for (let cls = 0; cls < dfa.numClasses; cls++) {
      const t = dfa.trans[s][cls]
      if (t !== -1 && !visited.has(t)) {
        visited.add(t)
        queue.push(t)
      }
    }
  }

  const numStates = order.length
  const trans: number[][] = []
  const accept: number[] = []
  const nfaSets: number[][] = []

  for (let i = 0; i < numStates; i++) {
    const representative = order[i]
    const row = new Array<number>(dfa.numClasses).fill(-1)
    for (let cls = 0; cls < dfa.numClasses; cls++) {
      const t = dfa.trans[representative][cls]
      row[cls] = t === -1 ? -1 : (remap.get(block[t]) ?? -1)
    }
    trans.push(row)
    accept.push(dfa.accept[representative])
    nfaSets.push(dfa.nfaSets[representative])
  }

  return {
    numStates,
    numClasses: dfa.numClasses,
    start: 0,
    classOf: dfa.classOf,
    classChars: dfa.classChars,
    trans,
    accept,
    nfaSets,
  }
}
