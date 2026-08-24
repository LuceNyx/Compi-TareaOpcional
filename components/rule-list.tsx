"use client"

import { AlertCircle, ArrowDown, ArrowUp, Eye, EyeOff, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Rule, RuleDiagnostic } from "@/lib/lexgen/build"
import { cn } from "@/lib/utils"

export interface RuleListProps {
  rules: Rule[]
  selectedId: string | null
  diagnostics: RuleDiagnostic[]
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
  onToggleSkip: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

export function RuleList({
  rules,
  selectedId,
  diagnostics,
  onSelect,
  onAdd,
  onRemove,
  onRename,
  onToggleSkip,
  onMove,
}: RuleListProps) {
  const errorOf = (id: string) => diagnostics.find((d) => d.ruleId === id)

  return (
    <section
      aria-label="Reglas del analizador léxico"
      className="flex flex-col rounded-lg border border-border bg-card"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">Reglas</h2>
          <span className="text-[11px] text-muted-foreground">
            la primera que coincide gana el empate
          </span>
        </div>
        <Button size="sm" variant="primary" onClick={onAdd}>
          <Plus className="size-3.5" />
          Regla
        </Button>
      </header>

      <ol className="flex max-h-[19rem] flex-col overflow-y-auto scroll-thin">
        {rules.length === 0 && (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            No hay reglas. Agrega una para comenzar.
          </li>
        )}

        {rules.map((rule, index) => {
          const selected = rule.id === selectedId
          const error = errorOf(rule.id)

          return (
            <li
              key={rule.id}
              className={cn(
                "border-b border-border last:border-b-0",
                selected ? "bg-primary/5" : "hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded font-mono text-[10px]",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>

                <input
                  value={rule.name}
                  onChange={(event) => onRename(rule.id, event.target.value)}
                  onFocus={() => onSelect(rule.id)}
                  aria-label={`Nombre del token de la regla ${index + 1}`}
                  className="h-7 min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 font-mono text-xs font-medium uppercase outline-none focus:border-input focus:bg-card"
                />

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onToggleSkip(rule.id)}
                  title={rule.skip ? "Token ignorado (no se emite)" : "Token emitido"}
                  className={rule.skip ? "text-accent" : ""}
                >
                  {rule.skip ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span className="sr-only">Alternar si el token se emite</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onMove(rule.id, -1)}
                  disabled={index === 0}
                  title="Subir prioridad"
                >
                  <ArrowUp className="size-3.5" />
                  <span className="sr-only">Subir</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onMove(rule.id, 1)}
                  disabled={index === rules.length - 1}
                  title="Bajar prioridad"
                >
                  <ArrowDown className="size-3.5" />
                  <span className="sr-only">Bajar</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(rule.id)}
                  title="Eliminar regla"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>

              <button
                type="button"
                onClick={() => onSelect(rule.id)}
                className="block w-full px-2 pb-2 text-left"
              >
                <span
                  className={cn(
                    "block truncate rounded border px-2 py-1 font-mono text-xs",
                    error
                      ? "border-accent/40 bg-accent/5 text-accent"
                      : selected
                        ? "border-primary/30 bg-card text-foreground"
                        : "border-transparent bg-muted/60 text-muted-foreground",
                  )}
                >
                  {rule.pattern === "" ? "· vacía ·" : rule.pattern}
                </span>
                {error && (
                  <span className="mt-1 flex items-start gap-1 text-[11px] text-accent">
                    <AlertCircle className="mt-px size-3 shrink-0" />
                    {error.message}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
