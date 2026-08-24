"use client"

import { useCallback, useMemo, useState } from "react"
import { Braces, FlaskConical, Network, ScrollText } from "lucide-react"
import { AstPanel } from "@/components/ast-panel"
import { CodePanel } from "@/components/code-panel"
import { DfaPanel } from "@/components/dfa-panel"
import { RegexBuilder } from "@/components/regex-builder"
import { RuleList } from "@/components/rule-list"
import { TesterPanel } from "@/components/tester-panel"
import { buildLexer, type Rule } from "@/lib/lexgen/build"
import { generateCpp } from "@/lib/lexgen/codegen"
import { newId, presetRules, PRESETS } from "@/lib/lexgen/presets"
import { cn } from "@/lib/utils"

type TabId = "cpp" | "dfa" | "ast" | "test"

const TABS: { id: TabId; label: string; icon: typeof Braces }[] = [
  { id: "cpp", label: "Código C++", icon: Braces },
  { id: "test", label: "Probador", icon: FlaskConical },
  { id: "dfa", label: "AFD", icon: Network },
  { id: "ast", label: "AST", icon: ScrollText },
]

export function LexgenApp() {
  const initial = PRESETS[0]

  const [rules, setRules] = useState<Rule[]>(() => presetRules(initial))
  const [presetId, setPresetId] = useState(initial.id)
  const [demoInput, setDemoInput] = useState(initial.demo)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>("cpp")
  /** historial de inserciones por regla, para el boton de deshacer */
  const [history, setHistory] = useState<Record<string, string[]>>({})

  const selected = rules.find((r) => r.id === selectedId) ?? null

  const build = useMemo(() => buildLexer(rules), [rules])

  const code = useMemo(() => {
    if (!build.dfa || build.rules.length === 0) return null
    return generateCpp({ dfa: build.dfa, rules: build.rules, demoInput })
  }, [build, demoInput])

  // ---------- acciones sobre las reglas ----------

  const updateRule = useCallback((id: string, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const addRule = useCallback(() => {
    const rule: Rule = { id: newId(), name: `TOKEN_${rules.length + 1}`, pattern: "", skip: false }
    setRules((prev) => [...prev, rule])
    setSelectedId(rule.id)
  }, [rules.length])

  const removeRule = useCallback(
    (id: string) => {
      setRules((prev) => prev.filter((r) => r.id !== id))
      if (selectedId === id) setSelectedId(null)
    },
    [selectedId],
  )

  const moveRule = useCallback((id: string, direction: -1 | 1) => {
    setRules((prev) => {
      const index = prev.findIndex((r) => r.id === id)
      const target = index + direction
      if (index === -1 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  // ---------- constructor de expresiones ----------

  const insert = useCallback(
    (text: string) => {
      if (!selected) return
      const id = selected.id
      setHistory((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), text] }))
      updateRule(id, { pattern: selected.pattern + text })
    },
    [selected, updateRule],
  )

  const undo = useCallback(() => {
    if (!selected) return
    const id = selected.id
    const stack = history[id] ?? []
    if (stack.length === 0) return
    const last = stack[stack.length - 1]
    setHistory((prev) => ({ ...prev, [id]: stack.slice(0, -1) }))
    updateRule(id, { pattern: selected.pattern.slice(0, -last.length) })
  }, [selected, history, updateRule])

  const clearPattern = useCallback(() => {
    if (!selected) return
    setHistory((prev) => ({ ...prev, [selected.id]: [] }))
    updateRule(selected.id, { pattern: "" })
  }, [selected, updateRule])

  const loadPreset = useCallback((id: string) => {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    setPresetId(preset.id)
    setRules(presetRules(preset))
    setDemoInput(preset.demo)
    setSelectedId(null)
    setHistory({})
  }, [])

  const activePreset = PRESETS.find((p) => p.id === presetId)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="font-mono text-lg font-semibold tracking-tight">
              lex<span className="text-primary">gen</span>
            </h1>
            <p className="text-pretty text-xs text-muted-foreground">
              Generador de analizadores léxicos · expresión regular → AFN → AFD → C++
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Ejemplos:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset.id)}
                title={preset.description}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs transition-colors",
                  preset.id === presetId
                    ? "border-primary bg-primary/8 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        {/* Columna izquierda: reglas y botones de expresiones */}
        <div className="flex flex-col gap-4">
          <RuleList
            rules={rules}
            selectedId={selectedId}
            diagnostics={build.diagnostics}
            onSelect={setSelectedId}
            onAdd={addRule}
            onRemove={removeRule}
            onRename={(id, name) => updateRule(id, { name })}
            onToggleSkip={(id) => {
              const rule = rules.find((r) => r.id === id)
              if (rule) updateRule(id, { skip: !rule.skip })
            }}
            onMove={moveRule}
          />

          <RegexBuilder
            pattern={selected?.pattern ?? ""}
            ruleName={selected?.name ?? null}
            canUndo={Boolean(selected && (history[selected.id] ?? []).length > 0)}
            onInsert={insert}
            onUndo={undo}
            onClear={clearPattern}
          />
        </div>

        {/* Columna derecha: salida */}
        <section
          aria-label="Salida del generador"
          className="flex min-h-[34rem] flex-col rounded-lg border border-border bg-card lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)]"
        >
          <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {build.dfa && code ? (
            <>
              {tab === "cpp" && <CodePanel code={code} fileName={`${presetId || "lexer"}.cpp`} />}
              {tab === "test" && (
                <TesterPanel
                  dfa={build.dfa}
                  rules={build.rules}
                  input={demoInput}
                  onInputChange={setDemoInput}
                />
              )}
              {tab === "dfa" && (
                <DfaPanel dfa={build.dfa} rules={build.rules} stats={build.stats} />
              )}
              {tab === "ast" && <AstPanel rules={build.rules} />}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Todavía no hay ninguna regla válida que compilar.
              </p>
              <p className="max-w-sm text-pretty text-xs text-muted-foreground/70">
                Agrega una regla, selecciónala y construye su expresión regular con los botones del
                panel izquierdo.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card px-4 py-2.5">
        <p className="mx-auto max-w-[1600px] text-pretty text-[11px] text-muted-foreground">
          {activePreset ? `Ejemplo activo: ${activePreset.description}. ` : ""}
          Compila la salida con{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">g++ -std=c++17 lexer.cpp</code> y
          ejecútala para tokenizar cualquier cadena desde la entrada estándar.
        </p>
      </footer>
    </div>
  )
}
