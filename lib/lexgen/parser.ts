// =====================================================
// Parser descendente recursivo
//
// Port en TypeScript de parser.cpp / ast.h
//
// Gramatica:
//
//   expresion   -> termino ( '|' termino )*
//   termino     -> repeticion ( repeticion )*
//   repeticion  -> primario [ '*' | '+' | '?' ]
//   primario    -> '(' expresion ')'
//                | '"' cadena '"'
//                | '[' [ '^' ] clase ']'
//                | '.'
//                | caracter
// =====================================================

import { RegexError, scanRegex, type RegexToken, type TokenType } from "./scanner"

export type BinaryOp = "CONCAT" | "OR"
export type UnaryOp = "STAR" | "PLUS" | "QUESTION"

export interface CharClassElement {
  first: string
  last: string
}

export type Expr =
  | { kind: "char"; value: string }
  | { kind: "string"; value: string }
  | { kind: "dot" }
  | { kind: "class"; elements: CharClassElement[]; negated: boolean }
  | { kind: "binary"; op: BinaryOp; left: Expr; right: Expr }
  | { kind: "unary"; op: UnaryOp; expr: Expr }

class Parser {
  private tokens: RegexToken[]
  private index = 0

  constructor(tokens: RegexToken[]) {
    this.tokens = tokens
  }

  private get current(): RegexToken {
    return this.tokens[this.index]
  }

  private get previous(): RegexToken {
    return this.tokens[this.index - 1]
  }

  private isAtEnd(): boolean {
    return this.current.type === "END"
  }

  private check(type: TokenType): boolean {
    return this.current.type === type
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.index++
      return true
    }
    return false
  }

  private consume(type: TokenType, message: string): void {
    if (this.check(type)) {
      this.index++
      return
    }
    throw new RegexError(message, this.current.pos)
  }

  private startsPrimary(): boolean {
    const t = this.current.type
    return t === "CHAR" || t === "STRING" || t === "LPAREN" || t === "LBRACKET" || t === "DOT"
  }

  parseProgram(): Expr {
    if (this.isAtEnd()) {
      throw new RegexError("La expresion regular esta vacia", 0)
    }

    const ast = this.parseExpression()

    if (!this.isAtEnd()) {
      throw new RegexError(
        `Se esperaba fin de entrada, se encontro '${this.current.text}'`,
        this.current.pos,
      )
    }

    return ast
  }

  private parseExpression(): Expr {
    let left = this.parseTerm()

    while (this.match("OR")) {
      const right = this.parseTerm()
      left = { kind: "binary", op: "OR", left, right }
    }

    return left
  }

  private parseTerm(): Expr {
    let left = this.parseRepetition()

    while (this.startsPrimary()) {
      const right = this.parseRepetition()
      left = { kind: "binary", op: "CONCAT", left, right }
    }

    return left
  }

  private parseRepetition(): Expr {
    const expr = this.parsePrimary()

    if (this.match("STAR")) return { kind: "unary", op: "STAR", expr }
    if (this.match("PLUS")) return { kind: "unary", op: "PLUS", expr }
    if (this.match("QUESTION")) return { kind: "unary", op: "QUESTION", expr }

    return expr
  }

  private parsePrimary(): Expr {
    if (this.match("LPAREN")) {
      const expr = this.parseExpression()
      this.consume("RPAREN", "Se esperaba ')'")
      return expr
    }

    if (this.match("STRING")) {
      return { kind: "string", value: this.previous.text }
    }

    if (this.match("LBRACKET")) {
      return this.parseCharacterClass()
    }

    if (this.match("DOT")) {
      return { kind: "dot" }
    }

    if (this.match("CHAR")) {
      return { kind: "char", value: this.previous.text }
    }

    throw new RegexError("Se esperaba una expresion regular", this.current.pos)
  }

  private parseCharacterClass(): Expr {
    let negated = false

    if (this.match("CARET")) {
      negated = true
    }

    if (!this.check("CHAR")) {
      throw new RegexError("Se esperaba un caracter dentro de []", this.current.pos)
    }

    const elements: CharClassElement[] = []

    while (!this.check("RBRACKET") && !this.isAtEnd()) {
      this.consume("CHAR", "Se esperaba un caracter dentro de []")
      const first = this.previous.text

      if (this.match("DASH")) {
        if (!this.check("CHAR")) {
          throw new RegexError("Se esperaba un caracter despues de '-'", this.current.pos)
        }
        this.consume("CHAR", "Se esperaba un caracter")
        const last = this.previous.text

        if (last.charCodeAt(0) < first.charCodeAt(0)) {
          throw new RegexError(`Rango invalido: ${first}-${last}`, this.previous.pos)
        }

        elements.push({ first, last })
      } else {
        elements.push({ first, last: first })
      }
    }

    this.consume("RBRACKET", "Se esperaba ']'")

    return { kind: "class", elements, negated }
  }
}

export function parseRegex(source: string): Expr {
  return new Parser(scanRegex(source)).parseProgram()
}

// =====================================================
// Impresion del AST, con el mismo formato que ast.cpp
// =====================================================

export function printAst(expr: Expr, indent = 0): string {
  const pad = " ".repeat(indent)

  switch (expr.kind) {
    case "char":
      return `${pad}Char('${visible(expr.value)}')`

    case "string":
      return `${pad}String("${expr.value.split("").map(visible).join("")}")`

    case "dot":
      return `${pad}Dot(.)`

    case "class": {
      const head = `${pad}CharClass${expr.negated ? " (negada)" : ""}`
      const items = expr.elements.map((e) =>
        e.first === e.last
          ? `${pad}  '${visible(e.first)}'`
          : `${pad}  '${visible(e.first)}' - '${visible(e.last)}'`,
      )
      return [head, ...items].join("\n")
    }

    case "binary":
      return [
        `${pad}${expr.op === "OR" ? "Or (|)" : "Concat"}`,
        printAst(expr.left, indent + 2),
        printAst(expr.right, indent + 2),
      ].join("\n")

    case "unary": {
      const label =
        expr.op === "STAR" ? "Star (*)" : expr.op === "PLUS" ? "Plus (+)" : "Question (?)"
      return [`${pad}${label}`, printAst(expr.expr, indent + 2)].join("\n")
    }
  }
}

export function visible(c: string): string {
  switch (c) {
    case "\n":
      return "\\n"
    case "\t":
      return "\\t"
    case "\r":
      return "\\r"
    case " ":
      return "espacio"
    case "\0":
      return "\\0"
    default:
      return c
  }
}
