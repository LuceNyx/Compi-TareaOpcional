"use client"

import { Fragment, useMemo, useState } from "react"
import { Check, Copy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const KEYWORDS = new Set([
  "bool",
  "break",
  "char",
  "class",
  "const",
  "continue",
  "else",
  "enum",
  "explicit",
  "false",
  "for",
  "if",
  "int",
  "private",
  "public",
  "return",
  "size_t",
  "static",
  "struct",
  "true",
  "unsigned",
  "void",
  "while",
  "include",
  "define",
  "std",
  "string",
  "cout",
  "cin",
])

const PATTERN =
  /(\/\/[^\n]*)|(R"LEXGEN\(|\)LEXGEN")|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(-?\b\d+\b)|([A-Za-z_][A-Za-z0-9_]*)/g

function highlight(line: string, key: number) {
  const nodes: React.ReactNode[] = []
  let last = 0
  let index = 0

  for (const match of line.matchAll(PATTERN)) {
    const start = match.index ?? 0
    if (start > last) nodes.push(line.slice(last, start))

    const [text, comment, raw, str, chr, num, word] = match

    if (comment) {
      nodes.push(
        <span key={index} className="text-muted-foreground italic">
          {text}
        </span>,
      )
    } else if (raw) {
      nodes.push(
        <span key={index} className="text-accent/70">
          {text}
        </span>,
      )
    } else if (str || chr) {
      nodes.push(
        <span key={index} className="text-accent">
          {text}
        </span>,
      )
    } else if (num) {
      nodes.push(
        <span key={index} className="text-primary/70">
          {text}
        </span>,
      )
    } else if (word && KEYWORDS.has(word)) {
      nodes.push(
        <span key={index} className="font-medium text-primary">
          {text}
        </span>,
      )
    } else {
      nodes.push(text)
    }

    last = start + text.length
    index += 1
  }

  if (last < line.length) nodes.push(line.slice(last))

  return <Fragment key={key}>{nodes}</Fragment>
}

export function CodePanel({ code, fileName }: { code: string; fileName: string }) {
  const [copied, setCopied] = useState(false)
  const lines = useMemo(() => code.split("\n"), [code])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const download = () => {
    const blob = new Blob([code], { type: "text/x-c++src" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-xs text-muted-foreground">{fileName}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {lines.length} líneas
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <Button size="sm" variant="primary" onClick={download}>
            <Download className="size-3.5" />
            Descargar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto scroll-thin">
        <pre className="w-max min-w-full py-2 font-mono text-[11.5px] leading-[1.6]">
          <code>
            {lines.map((line, i) => (
              <span key={i} className="flex">
                <span
                  aria-hidden="true"
                  className="sticky left-0 w-11 shrink-0 select-none border-r border-border bg-card pr-2 text-right text-muted-foreground/60"
                >
                  {i + 1}
                </span>
                <span className="px-3 whitespace-pre">{highlight(line, i)}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
