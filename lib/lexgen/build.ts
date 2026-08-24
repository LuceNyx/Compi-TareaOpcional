// =====================================================
// Orquestador: reglas -> AST -> AFN -> AFD minimizado
// y simulador del AFD para el probador en vivo.
// =====================================================

import { ALPHABET_SIZE, buildDfa, buildNfa, minimizeDfa, type Dfa, type Nfa } from "./automata"
import { parseRegex, type Expr } from "./parser"
import { RegexError } from "./scanner"

export interface Rule {
  id: string
  name: string
  pattern: string
  /** Si es true el token se reconoce pero no se emite (espacios, comentarios) */
  skip: boolean
}

export interface RuleDiagnostic {
  ruleId: string
  ruleName: string
  message: string
  pos: number
}

export interface BuildResult {
  ok: boolean
  /** Reglas que compilaron correctamente, en orden de prioridad */
  rules: Rule[]
  asts: Expr[]
  diagnostics: RuleDiagnostic[]
  nfa: Nfa | null
  dfa: Dfa | null
  stats: {
    nfaStates: number
    dfaStates: number
    minStates: number
    classes: number
  }
}

const EMPTY_STATS = { nfaStates: 0, dfaStates: 0, minStates: 0, classes: 0 }

export function buildLexer(inputRules: Rule[]): BuildResult {
  const diagnostics: RuleDiagnostic[] = []
  const rules: Rule[] = []
  const asts: Expr[] = []
  const seenNames = new Set<string>()

  for (const rule of inputRules) {
    if (rule.pattern.trim() === "") {
      diagnostics.push({
        ruleId: rule.id,
        ruleName: rule.name,
        message: "La expresion regular esta vacia",
        pos: 0,
      })
      continue
    }

    if (rule.name.trim() === "") {
      diagnostics.push({
        ruleId: rule.id,
        ruleName: rule.name,
        message: "La regla necesita un nombre de token",
        pos: 0,
      })
      continue
    }

    const key = sanitizeName(rule.name)
    if (seenNames.has(key)) {
      diagnostics.push({
        ruleId: rule.id,
        ruleName: rule.name,
        message: `Nombre de token repetido: ${key}`,
        pos: 0,
      })
      continue
    }

    try {
      const ast = parseRegex(rule.pattern)
      asts.push(ast)
      rules.push(rule)
      seenNames.add(key)
    } catch (error) {
      const err = error as RegexError
      diagnostics.push({
        ruleId: rule.id,
        ruleName: rule.name,
        message: err.message ?? "Error al analizar la expresion",
        pos: typeof err.pos === "number" ? err.pos : 0,
      })
    }
  }

  if (rules.length === 0) {
    return {
      ok: false,
      rules: [],
      asts: [],
      diagnostics,
      nfa: null,
      dfa: null,
      stats: EMPTY_STATS,
    }
  }

  const nfa = buildNfa(asts)
  const rawDfa = buildDfa(nfa)
  const dfa = minimizeDfa(rawDfa)

  return {
    ok: diagnostics.length === 0,
    rules,
    asts,
    diagnostics,
    nfa,
    dfa,
    stats: {
      nfaStates: nfa.states.length,
      dfaStates: rawDfa.numStates,
      minStates: dfa.numStates,
      classes: dfa.numClasses,
    },
  }
}

/** Convierte el nombre de la regla en un identificador valido de C++ */
export function sanitizeName(name: string): string {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/^([0-9])/, "_$1")
  return cleaned === "" ? "TOKEN" : cleaned
}

// -----------------------------------------------------
// Simulador (maximal munch), el mismo algoritmo que
// emite el codigo C++ generado.
// -----------------------------------------------------

export interface LexToken {
  ruleIndex: number
  name: string
  lexeme: string
  line: number
  col: number
  skipped: boolean
}

export interface LexDiagnostic {
  message: string
  line: number
  col: number
}

export interface RunResult {
  tokens: LexToken[]
  errors: LexDiagnostic[]
}

export function runLexer(dfa: Dfa, rules: Rule[], input: string): RunResult {
  const tokens: LexToken[] = []
  const errors: LexDiagnostic[] = []

  let pos = 0
  let line = 1
  let col = 1

  const advanceOver = (text: string) => {
    for (const ch of text) {
      if (ch === "\n") {
        line++
        col = 1
      } else {
        col++
      }
    }
  }

  while (pos < input.length) {
    let state = dfa.start
    let lastAcceptRule = -1
    let lastAcceptPos = -1

    for (let i = pos; i < input.length; i++) {
      const code = input.charCodeAt(i)
      if (code >= ALPHABET_SIZE) break

      const next = dfa.trans[state][dfa.classOf[code]]
      if (next === -1) break

      state = next
      if (dfa.accept[state] !== -1) {
        lastAcceptRule = dfa.accept[state]
        lastAcceptPos = i + 1
      }
    }

    if (lastAcceptRule === -1 || lastAcceptPos <= pos) {
      const bad = input[pos]
      errors.push({
        message: `Caracter no reconocido: '${bad === "\n" ? "\\n" : bad}'`,
        line,
        col,
      })
      advanceOver(bad)
      pos += 1
      continue
    }

    const lexeme = input.slice(pos, lastAcceptPos)
    const rule = rules[lastAcceptRule]

    tokens.push({
      ruleIndex: lastAcceptRule,
      name: sanitizeName(rule.name),
      lexeme,
      line,
      col,
      skipped: rule.skip,
    })

    advanceOver(lexeme)
    pos = lastAcceptPos
  }

  return { tokens, errors }
}
