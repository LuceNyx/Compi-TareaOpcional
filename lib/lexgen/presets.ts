import type { Rule } from "./build"

export interface Preset {
  id: string
  label: string
  description: string
  demo: string
  rules: Omit<Rule, "id">[]
}

export const PRESETS: Preset[] = [
  {
    id: "mini-c",
    label: "Mini lenguaje tipo C",
    description: "Palabras reservadas, identificadores, numeros, cadenas, operadores y comentarios",
    demo: `int suma = 0;
// acumula los primeros valores
while (suma <= 100) {
  suma = suma + 3.14;
}
float promedio = suma / 2;`,
    rules: [
      {
        name: "PALABRA_CLAVE",
        pattern: `"if"|"else"|"while"|"for"|"return"|"int"|"float"`,
        skip: false,
      },
      { name: "ID", pattern: `[a-zA-Z_][a-zA-Z0-9_]*`, skip: false },
      { name: "REAL", pattern: `[0-9]+"."[0-9]+`, skip: false },
      { name: "ENTERO", pattern: `[0-9]+`, skip: false },
      { name: "CADENA", pattern: `\\"[^\\"]*\\"`, skip: false },
      {
        name: "OPERADOR",
        pattern: `"=="|"!="|"<="|">="|"+"|"-"|"*"|"/"|"="|"<"|">"`,
        skip: false,
      },
      { name: "PUNTUACION", pattern: `"("|")"|"{"|"}"|";"|","`, skip: false },
      { name: "COMENTARIO", pattern: `"//"[^\\n]*`, skip: true },
      { name: "ESPACIO", pattern: `[\\ \\t\\r\\n]+`, skip: true },
    ],
  },
  {
    id: "aritmetica",
    label: "Calculadora aritmetica",
    description: "Numeros con signo, operadores y parentesis",
    demo: `(12 + 4) * -3.5 / 2`,
    rules: [
      { name: "REAL", pattern: `"-"?[0-9]+"."[0-9]+`, skip: false },
      { name: "ENTERO", pattern: `"-"?[0-9]+`, skip: false },
      { name: "SUMA", pattern: `"+"`, skip: false },
      { name: "RESTA", pattern: `"-"`, skip: false },
      { name: "MULT", pattern: `"*"`, skip: false },
      { name: "DIV", pattern: `"/"`, skip: false },
      { name: "PARENTESIS", pattern: `"("|")"`, skip: false },
      { name: "ESPACIO", pattern: `[\\ \\t\\r\\n]+`, skip: true },
    ],
  },
  {
    id: "identificadores",
    label: "Minimo: ID y numeros",
    description: "El caso mas pequeno para revisar el AFN, el AFD y el AST",
    demo: `x1 area 42 total99`,
    rules: [
      { name: "ID", pattern: `[a-zA-Z][a-zA-Z0-9]*`, skip: false },
      { name: "NUMERO", pattern: `[0-9]+`, skip: false },
      { name: "ESPACIO", pattern: `[\\ \\t\\r\\n]+`, skip: true },
    ],
  },
]

let counter = 0

export function newId(): string {
  counter += 1
  return `r${Date.now().toString(36)}${counter}`
}

export function presetRules(preset: Preset): Rule[] {
  return preset.rules.map((r) => ({ ...r, id: newId() }))
}
