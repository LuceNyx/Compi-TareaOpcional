"use client"

import { useMemo, useState } from "react"
import { parseRegex, printAst, visible, type Expr } from "@/lib/lexgen/parser"
import type { Rule } from "@/lib/lexgen/build"
import { cn } from "@/lib/utils"

type Node = {
  label: string
  leaf: boolean
  children: Node[]
}

function toNode(expr: Expr): Node {
  switch (expr.kind) {
    case "char":
      return { label: `Char '${visible(expr.value)}'`, leaf: true, children: [] }

    case "string":
      return {
        label: `String "${expr.value.split("").map(visible).join("")}"`,
        leaf: true,
        children: [],
      }

    case "dot":
      return { label: "Dot .", leaf: true, children: [] }

    case "class":
      return {
        label: `CharClass ${expr.negated ? "^" : ""}[${expr.elements
          .map((e) => (e.first === e.last ? visible(e.first) : `${visible(e.first)}-${visible(e.last)}`))
          .join(" ")}]`,
        leaf: true,
        children: [],
      }

    case "binary":
      return {
        label: expr.op === "OR" ? "Or |" : "Concat",
        leaf: false,
        children: [toNode(expr.left), toNode(expr.right)],
      }

    case "unary":
      return {
        label: expr.op === "STAR" ? "Star *" : expr.op === "PLUS" ? "Plus +" : "Question ?",
        leaf: false,
        children: [toNode(expr.expr)],
      }
  }
}

function TreeNode({ node, prefix, isLast, isRoot }: { node: Node; prefix: string; isLast: boolean; isRoot: boolean }) {
  const branch = isRoot ? "" : isLast ? "└─ " : "├─ "
  const childPrefix = isRoot ? "" : prefix + (isLast ? "   " : "│  ")

  return (
    <>
      <div className="flex items-center whitespace-pre font-mono text-xs leading-6">
        <span className="text-muted-foreground">{prefix + branch}</span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5",
            node.leaf ? "bg-accent/12 text-accent" : "bg-secondary text-foreground",
          )}
        >
          {node.label}
        </span>
      </div>
      {node.children.map((child, i) => (
        <TreeNode
          key={i}
          node={child}
          prefix={childPrefix}
          isLast={i === node.children.length - 1}
          isRoot={false}
        />
      ))}
    </>
  )
}

export function AstPanel({ rules }: { rules: Rule[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [raw, setRaw] = useState(false)

  const active = rules.find((r) => r.id === selectedId) ?? rules[0]

  const result = useMemo(() => {
    if (!active) return null
    try {
      const ast = parseRegex(active.pattern)
      return { node: toNode(ast), text: printAst(ast), error: null as string | null }
    } catch (e) {
      return { node: null, text: "", error: e instanceof Error ? e.message : String(e) }
    }
  }, [active])

  if (rules.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Agrega una regla para ver su arbol sintactico.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-3">
        {rules.map((rule) => (
          <button
            key={rule.id}
            type="button"
            onClick={() => setSelectedId(rule.id)}
            className={cn(
              "rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
              rule.id === active.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted",
            )}
          >
            {rule.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRaw((v) => !v)}
          className="ml-auto rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {raw ? "Vista arbol" : "Vista ast.cpp"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <p className="mb-3 break-all font-mono text-xs text-muted-foreground">{active.pattern}</p>

        {result?.error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">{result.error}</p>
        ) : raw ? (
          <pre className="font-mono text-xs leading-6 text-foreground">{result?.text}</pre>
        ) : (
          result?.node && <TreeNode node={result.node} prefix="" isLast isRoot />
        )}
      </div>
    </div>
  )
}
