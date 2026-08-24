// =====================================================
// Scanner de expresiones regulares
//
// Port en TypeScript de scanner.cpp / token.h
// Reconoce los mismos tokens que el analizador
// escrito en C++ para la tarea anterior.
// =====================================================

export type TokenType =
  | "LPAREN"
  | "RPAREN"
  | "LBRACKET"
  | "RBRACKET"
  | "OR"
  | "STAR"
  | "PLUS"
  | "QUESTION"
  | "DASH"
  | "CARET"
  | "DOT"
  | "STRING"
  | "CHAR"
  | "END"

export interface RegexToken {
  type: TokenType
  /** Texto ya procesado (sin comillas, con escapes resueltos) */
  text: string
  /** Posicion inicial dentro de la expresion */
  pos: number
}

export class RegexError extends Error {
  pos: number
  constructor(message: string, pos: number) {
    super(message)
    this.name = "RegexError"
    this.pos = pos
  }
}

function isWhiteSpace(c: string): boolean {
  return c === " " || c === "\n" || c === "\r" || c === "\t"
}

const SINGLE: Record<string, TokenType> = {
  "(": "LPAREN",
  ")": "RPAREN",
  "[": "LBRACKET",
  "]": "RBRACKET",
  "|": "OR",
  "*": "STAR",
  "+": "PLUS",
  "?": "QUESTION",
  "-": "DASH",
  "^": "CARET",
  ".": "DOT",
}

/**
 * Escapes admitidos dentro de una cadena entre comillas.
 * Es la unica extension respecto al scanner en C++ y existe
 * para poder describir espacios, tabuladores y saltos de linea.
 */
const ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  r: "\r",
  "0": "\0",
  '"': '"',
  "\\": "\\",
}

export function scanRegex(input: string): RegexToken[] {
  const tokens: RegexToken[] = []
  let i = 0

  while (i < input.length) {
    const c = input[i]

    // Los espacios en blanco se ignoran fuera de las cadenas,
    // igual que en el scanner original.
    if (isWhiteSpace(c)) {
      i++
      continue
    }

    const single = SINGLE[c]
    if (single) {
      tokens.push({ type: single, text: c, pos: i })
      i++
      continue
    }

    // Caracter escapado: \n, \t, \", \\, \+, \[ ...
    // Extension respecto al scanner en C++: permite usar
    // como literal cualquier simbolo del metalenguaje.
    if (c === "\\") {
      if (i + 1 >= input.length) {
        throw new RegexError("Se esperaba un caracter despues de '\\'", i)
      }
      const raw = input[i + 1]
      tokens.push({ type: "CHAR", text: ESCAPES[raw] ?? raw, pos: i })
      i += 2
      continue
    }

    // Cadena entre comillas: "if", "else", "=="
    if (c === '"') {
      const start = i
      i++
      let value = ""
      let closed = false

      while (i < input.length) {
        const ch = input[i]

        if (ch === "\\" && i + 1 < input.length) {
          const esc = ESCAPES[input[i + 1]]
          if (esc === undefined) {
            throw new RegexError(`Escape desconocido: \\${input[i + 1]}`, i)
          }
          value += esc
          i += 2
          continue
        }

        if (ch === '"') {
          i++
          closed = true
          break
        }

        value += ch
        i++
      }

      if (!closed) {
        throw new RegexError("Cadena sin cerrar", start)
      }

      tokens.push({ type: "STRING", text: value, pos: start })
      continue
    }

    // Cualquier otro caracter es un caracter literal
    tokens.push({ type: "CHAR", text: c, pos: i })
    i++
  }

  tokens.push({ type: "END", text: "", pos: input.length })
  return tokens
}
