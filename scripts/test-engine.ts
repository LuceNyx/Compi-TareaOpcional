import { buildLexer, runLexer } from "../lib/lexgen/build"
import { generateCpp } from "../lib/lexgen/codegen"
import { printAst } from "../lib/lexgen/parser"
import { PRESETS, presetRules } from "../lib/lexgen/presets"
import { writeFileSync } from "node:fs"

for (const preset of PRESETS) {
  const rules = presetRules(preset)
  const result = buildLexer(rules)

  console.log("=".repeat(60))
  console.log(preset.label, "->", result.ok ? "OK" : "CON ERRORES")
  console.log("stats", result.stats)
  if (result.diagnostics.length) console.log("diagnostics", result.diagnostics)

  if (!result.dfa) continue

  const run = runLexer(result.dfa, result.rules, preset.demo)
  console.log(
    run.tokens
      .filter((t) => !t.skipped)
      .map((t) => `${t.name}(${JSON.stringify(t.lexeme)})`)
      .join(" "),
  )
  console.log("errores:", run.errors)

  const cpp = generateCpp({ dfa: result.dfa, rules: result.rules, demoInput: preset.demo })
  writeFileSync(`/tmp/${preset.id}.cpp`, cpp)
}

// AST de muestra
const single = buildLexer([{ id: "a", name: "ID", pattern: "[a-z]+(0|1)?", skip: false }])
console.log(printAst(single.asts[0]))
