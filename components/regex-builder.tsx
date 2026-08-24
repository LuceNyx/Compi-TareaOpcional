"use client"

import { useState } from "react"
import { CornerDownLeft, Eraser, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const META = new Set(["(", ")", "[", "]", "|", "*", "+", "?", "-", "^", ".", '"', "\\"])

/** Escapa un caracter para que se inserte como literal */
function escapeChar(c: string): string {
  if (c === " ") return "\\ "
  return META.has(c) ? `\\${c}` : c
}

const CLASSES: { insert: string; label: string; hint: string }[] = [
  { insert: "[a-z]", label: "[a-z]", hint: "minusculas" },
  { insert: "[A-Z]", label: "[A-Z]", hint: "mayusculas" },
  { insert: "[0-9]", label: "[0-9]", hint: "digitos" },
  { insert: "[a-zA-Z]", label: "[a-zA-Z]", hint: "letras" },
  { insert: "[a-zA-Z0-9]", label: "[a-zA-Z0-9]", hint: "alfanumericos" },
  { insert: "[a-zA-Z_]", label: "[a-zA-Z_]", hint: "inicio de identificador" },
  { insert: "[\\ \\t\\r\\n]", label: "[espacios]", hint: "espacio, tab, CR, LF" },
  { insert: ".", label: ".", hint: "cualquier caracter menos salto de linea" },
]

const OPERATORS: { insert: string; label: string; hint: string }[] = [
  { insert: "|", label: "|", hint: "union: a | b" },
  { insert: "*", label: "*", hint: "cero o mas" },
  { insert: "+", label: "+", hint: "una o mas" },
  { insert: "?", label: "?", hint: "opcional" },
  { insert: "(", label: "(", hint: "abrir grupo" },
  { insert: ")", label: ")", hint: "cerrar grupo" },
]

const CLASS_PARTS: { insert: string; label: string; hint: string }[] = [
  { insert: "[", label: "[", hint: "abrir clase" },
  { insert: "[^", label: "[^", hint: "abrir clase negada" },
  { insert: "-", label: "-", hint: "rango dentro de la clase" },
  { insert: "]", label: "]", hint: "cerrar clase" },
]

const SHORTCUTS: { insert: string; label: string; hint: string }[] = [
  { insert: "\\ ", label: "espacio", hint: "espacio literal" },
  { insert: "\\t", label: "\\t", hint: "tabulador" },
  { insert: "\\n", label: "\\n", hint: "salto de linea" },
  { insert: '\\"', label: '\\"', hint: "comilla literal" },
]

const KEYBOARDS = {
  abc: "abcdefghijklmnopqrstuvwxyz".split(""),
  ABC: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  "123": "0123456789".split(""),
  "#$%": "!#$%&'()*+,-./:;<=>?@[]^_`{|}~\"\\".split(""),
} as const

type KeyboardId = keyof typeof KEYBOARDS

export interface RegexBuilderProps {
  pattern: string
  ruleName: string | null
  canUndo: boolean
  onInsert: (text: string) => void
  onUndo: () => void
  onClear: () => void
}

export function RegexBuilder({
  pattern,
  ruleName,
  canUndo,
  onInsert,
  onUndo,
  onClear,
}: RegexBuilderProps) {
  const [keyboard, setKeyboard] = useState<KeyboardId>("abc")
  const [literal, setLiteral] = useState("")
  const disabled = ruleName === null

  const insertLiteral = () => {
    if (literal === "") return
    onInsert(`"${literal.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    setLiteral("")
  }

  return (
    <section
      aria-label="Constructor de expresiones regulares"
      className="flex flex-col rounded-lg border border-border bg-card"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">Constructor de expresiones</h2>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {ruleName ? `regla: ${ruleName}` : "selecciona una regla"}
        </p>
      </header>

      {/* Expresion en construccion */}
      <div className="border-b border-border bg-muted/40 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="min-h-9 flex-1 overflow-x-auto rounded-md border border-border bg-card px-2.5 py-1.5 scroll-thin">
            {pattern === "" ? (
              <span className="font-mono text-xs text-muted-foreground">
                usa los botones para construir la expresión
              </span>
            ) : (
              <span className="whitespace-pre font-mono text-sm break-keep">
                {pattern}
                <span
                  aria-hidden="true"
                  className="ml-px inline-block h-4 w-[2px] translate-y-0.5 bg-primary"
                />
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer última inserción"
          >
            <Undo2 className="size-3.5" />
            <span className="sr-only">Deshacer</span>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClear}
            disabled={disabled || pattern === ""}
            title="Limpiar expresión"
          >
            <Eraser className="size-3.5" />
            <span className="sr-only">Limpiar</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3 py-3">
        <Group label="Clases de caracteres">
          {CLASSES.map((item) => (
            <PaletteButton key={item.label} {...item} disabled={disabled} onInsert={onInsert} />
          ))}
        </Group>

        <Group label="Operadores y agrupación">
          {OPERATORS.map((item) => (
            <PaletteButton key={item.label} {...item} disabled={disabled} onInsert={onInsert} />
          ))}
        </Group>

        <Group label="Clase manual">
          {CLASS_PARTS.map((item) => (
            <PaletteButton key={item.label} {...item} disabled={disabled} onInsert={onInsert} />
          ))}
          {SHORTCUTS.map((item) => (
            <PaletteButton key={item.label} {...item} disabled={disabled} onInsert={onInsert} />
          ))}
        </Group>

        {/* Cadena literal */}
        <Group label="Cadena literal">
          <div className="flex w-full items-center gap-2">
            <input
              value={literal}
              onChange={(event) => setLiteral(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing || event.keyCode === 229) return
                if (event.key === "Enter") {
                  event.preventDefault()
                  insertLiteral()
                }
              }}
              disabled={disabled}
              placeholder="if, else, ==, //"
              aria-label="Texto de la cadena literal"
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-card px-2 font-mono text-sm outline-none focus:border-primary disabled:opacity-40"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={insertLiteral}
              disabled={disabled || literal === ""}
              className="h-8"
            >
              insertar &quot;…&quot;
              <CornerDownLeft className="size-3" />
            </Button>
          </div>
        </Group>

        {/* Teclado de caracteres */}
        <Group label="Carácter individual">
          <div className="flex w-full flex-col gap-2">
            <div className="flex gap-1">
              {(Object.keys(KEYBOARDS) as KeyboardId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKeyboard(id)}
                  className={cn(
                    "h-6 rounded px-2 font-mono text-[11px] transition-colors",
                    keyboard === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {KEYBOARDS[keyboard].map((char) => (
                <Button
                  key={char}
                  size="icon"
                  variant="token"
                  disabled={disabled}
                  onClick={() => onInsert(escapeChar(char))}
                  title={`insertar ${escapeChar(char)}`}
                >
                  {char}
                </Button>
              ))}
            </div>
          </div>
        </Group>

        <p className="border-t border-border pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
          La concatenación es implícita: al insertar dos elementos seguidos quedan concatenados. Los
          símbolos del metalenguaje se insertan escapados con <code className="font-mono">\</code> o
          entre comillas para tomarse como literales.
        </p>
      </div>
    </section>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  )
}

function PaletteButton({
  insert,
  label,
  hint,
  disabled,
  onInsert,
}: {
  insert: string
  label: string
  hint: string
  disabled: boolean
  onInsert: (text: string) => void
}) {
  return (
    <Button
      size="sm"
      variant="token"
      disabled={disabled}
      onClick={() => onInsert(insert)}
      title={hint}
    >
      {label}
    </Button>
  )
}
