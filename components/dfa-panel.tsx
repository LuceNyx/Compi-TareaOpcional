"use client"

import type { Dfa } from "@/lib/lexgen/automata"
import { sanitizeName, type BuildResult, type Rule } from "@/lib/lexgen/build"
import { describeClass } from "@/lib/lexgen/codegen"
import { cn } from "@/lib/utils"

export function DfaPanel({
  dfa,
  rules,
  stats,
}: {
  dfa: Dfa
  rules: Rule[]
  stats: BuildResult["stats"]
}) {
  const classes = Array.from({ length: dfa.numClasses }, (_, i) => i)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-thin">
      <div className="grid grid-cols-2 gap-2 border-b border-border p-3 sm:grid-cols-4">
        <Stat label="Estados AFN" value={stats.nfaStates} hint="Thompson" />
        <Stat label="Estados AFD" value={stats.dfaStates} hint="subconjuntos" />
        <Stat label="AFD mínimo" value={stats.minStates} hint="Moore" accent />
        <Stat label="Clases" value={stats.classes} hint="columnas" />
      </div>

      <div className="p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tabla de transiciones
        </h3>

        <div className="overflow-auto rounded-md border border-border scroll-thin">
          <table className="w-max border-collapse font-mono text-[11px]">
            <thead>
              <tr className="bg-muted">
                <th className="sticky left-0 z-10 border-b border-r border-border bg-muted px-2 py-1.5 text-left font-semibold">
                  q
                </th>
                <th className="border-b border-r border-border px-2 py-1.5 text-left font-semibold">
                  acepta
                </th>
                {classes.map((cls) => (
                  <th
                    key={cls}
                    title={describeClass(dfa.classChars[cls], 8)}
                    className="border-b border-border px-1.5 py-1.5 font-semibold text-muted-foreground"
                  >
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dfa.trans.map((row, state) => {
                const ruleIndex = dfa.accept[state]
                const accepting = ruleIndex !== -1

                return (
                  <tr key={state} className={accepting ? "bg-accent/5" : undefined}>
                    <th
                      scope="row"
                      className={cn(
                        "sticky left-0 z-10 border-b border-r border-border px-2 py-1 text-left",
                        accepting ? "bg-accent/10 text-accent" : "bg-card text-foreground",
                      )}
                    >
                      {state}
                      {state === dfa.start && <span className="ml-1 text-primary">→</span>}
                    </th>
                    <td
                      className={cn(
                        "border-b border-r border-border px-2 py-1 whitespace-nowrap",
                        accepting ? "text-accent" : "text-muted-foreground/50",
                      )}
                    >
                      {accepting ? sanitizeName(rules[ruleIndex].name) : "—"}
                    </td>
                    {row.map((target, cls) => (
                      <td
                        key={cls}
                        className={cn(
                          "border-b border-border px-1.5 py-1 text-center",
                          target === -1 ? "text-muted-foreground/25" : "text-foreground",
                        )}
                      >
                        {target === -1 ? "·" : target}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <h3 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Clases de equivalencia
        </h3>
        <ul className="grid gap-1 sm:grid-cols-2">
          {classes.map((cls) => (
            <li
              key={cls}
              className="flex items-baseline gap-2 rounded border border-border bg-card px-2 py-1 font-mono text-[11px]"
            >
              <span className="w-5 shrink-0 text-right text-primary">{cls}</span>
              <span className="truncate text-muted-foreground">
                {describeClass(dfa.classChars[cls], 6)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: number
  hint: string
  accent?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-card px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-mono text-xl leading-tight",
          accent ? "text-accent" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="font-mono text-[10px] text-muted-foreground/70">{hint}</p>
    </div>
  )
}
