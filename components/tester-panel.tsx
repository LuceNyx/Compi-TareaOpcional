"use client"

import { useMemo, useState } from "react"
import { AlertTriangle } from "lucide-react"
import type { Dfa } from "@/lib/lexgen/automata"
import { runLexer, type Rule } from "@/lib/lexgen/build"
import { cn } from "@/lib/utils"

const PALETTE = [
  "text-[var(--tok-1)]",
  "text-[var(--tok-2)]",
  "text-[var(--tok-3)]",
  "text-[var(--tok-4)]",
  "text-[var(--tok-5)]",
  "text-[var(--tok-6)]",
]

function visibleLexeme(text: string): string {
  return text.replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r")
}

export function TesterPanel({
  dfa,
  rules,
  input,
  onInputChange,
}: {
  dfa: Dfa
  rules: Rule[]
  input: string
  onInputChange: (value: string) => void
}) {
  const [showSkipped, setShowSkipped] = useState(false)

  const result = useMemo(() => runLexer(dfa, rules, input), [dfa, rules, input])

  const visibleTokens = showSkipped ? result.tokens : result.tokens.filter((t) => !t.skipped)
  const emitted = result.tokens.filter((t) => !t.skipped).length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="test-input" className="text-xs font-semibold">
            Cadena de entrada
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={showSkipped}
              onChange={(event) => setShowSkipped(event.target.checked)}
              className="size-3 accent-[var(--primary)]"
            />
            mostrar ignorados
          </label>
        </div>
        <textarea
          id="test-input"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          spellCheck={false}
          rows={5}
          className="w-full resize-y rounded-md border border-input bg-card px-2.5 py-2 font-mono text-xs leading-relaxed outline-none focus:border-primary"
        />
        <div className="flex flex-wrap gap-3 font-mono text-[11px] text-muted-foreground">
          <span>
            tokens: <span className="text-foreground">{emitted}</span>
          </span>
          <span>
            ignorados:{" "}
            <span className="text-foreground">{result.tokens.length - emitted}</span>
          </span>
          <span>
            errores:{" "}
            <span className={result.errors.length > 0 ? "text-destructive" : "text-foreground"}>
              {result.errors.length}
            </span>
          </span>
        </div>
      </div>

      {result.errors.length > 0 && (
        <ul className="flex flex-col gap-1 border-b border-border bg-destructive/5 px-3 py-2">
          {result.errors.slice(0, 5).map((error, i) => (
            <li key={i} className="flex items-center gap-1.5 font-mono text-[11px] text-destructive">
              <AlertTriangle className="size-3 shrink-0" />
              {error.line}:{error.col} {error.message}
            </li>
          ))}
          {result.errors.length > 5 && (
            <li className="font-mono text-[11px] text-destructive/70">
              … y {result.errors.length - 5} mas
            </li>
          )}
        </ul>
      )}

      <div className="min-h-0 flex-1 overflow-auto scroll-thin">
        {visibleTokens.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Escribe una cadena para ver los tokens reconocidos.
          </p>
        ) : (
          <table className="w-full border-collapse font-mono text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="border-b border-border px-3 py-1.5 text-right font-semibold text-muted-foreground">
                  #
                </th>
                <th className="border-b border-border px-2 py-1.5 text-left font-semibold text-muted-foreground">
                  token
                </th>
                <th className="border-b border-border px-2 py-1.5 text-left font-semibold text-muted-foreground">
                  lexema
                </th>
                <th className="border-b border-border px-2 py-1.5 text-right font-semibold text-muted-foreground">
                  ln:col
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTokens.map((token, i) => (
                <tr key={i} className={cn("hover:bg-muted/50", token.skipped && "opacity-45")}>
                  <td className="border-b border-border/60 px-3 py-1 text-right text-muted-foreground/60">
                    {i + 1}
                  </td>
                  <td
                    className={cn(
                      "border-b border-border/60 px-2 py-1 font-medium",
                      PALETTE[token.ruleIndex % PALETTE.length],
                    )}
                  >
                    {token.name}
                    {token.skipped && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">(ignorado)</span>
                    )}
                  </td>
                  <td className="border-b border-border/60 px-2 py-1 text-foreground">
                    {visibleLexeme(token.lexeme)}
                  </td>
                  <td className="border-b border-border/60 px-2 py-1 text-right text-muted-foreground/70">
                    {token.line}:{token.col}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
