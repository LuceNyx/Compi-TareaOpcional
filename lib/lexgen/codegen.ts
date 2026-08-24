// =====================================================
// Generador de codigo C++
//
// Emite un analizador lexico completo basado en una
// tabla de transiciones del AFD, con la estrategia
// "maximal munch" (la coincidencia mas larga gana y,
// en caso de empate, la regla declarada primero).
// =====================================================

import type { Dfa } from "./automata"
import { sanitizeName, type Rule } from "./build"

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function charLabel(code: number): string {
  switch (code) {
    case 9:
      return "\\t"
    case 10:
      return "\\n"
    case 13:
      return "\\r"
    case 32:
      return "sp"
    case 0:
      return "\\0"
  }
  if (code < 32 || code === 127) return `\\x${code.toString(16).padStart(2, "0")}`
  return String.fromCharCode(code)
}

/** Describe una clase de equivalencia como rangos legibles */
export function describeClass(chars: number[], maxRanges = 5): string {
  const ranges: [number, number][] = []
  for (const c of chars) {
    const last = ranges[ranges.length - 1]
    if (last && c === last[1] + 1) last[1] = c
    else ranges.push([c, c])
  }

  const shown = ranges
    .slice(0, maxRanges)
    .map(([a, b]) => (a === b ? charLabel(a) : `${charLabel(a)}-${charLabel(b)}`))

  const rest = ranges.length - shown.length
  return shown.join(" ") + (rest > 0 ? ` (+${rest} mas)` : "")
}

function table2d(rows: number[][], perLine: number, width: number): string {
  return rows
    .map((row, index) => {
      const lines = chunk(row, perLine).map((part) =>
        part.map((value) => String(value).padStart(width)).join(", "),
      )
      const body = lines.join(",\n         ")
      return `    /* ${String(index).padStart(3)} */ { ${body} }`
    })
    .join(",\n")
}

function table1d(values: number[], perLine: number, width: number): string {
  return chunk(values, perLine)
    .map((part) => "    " + part.map((v) => String(v).padStart(width)).join(", "))
    .join(",\n")
}

export interface CodegenOptions {
  dfa: Dfa
  rules: Rule[]
  demoInput: string
}

export function generateCpp({ dfa, rules, demoInput }: CodegenOptions): string {
  const names = rules.map((r) => sanitizeName(r.name))
  const numRules = rules.length

  const header = [
    "// =====================================================",
    "//  Analizador lexico generado automaticamente",
    "//",
    "//  Generado por LexGen - version moderna de Flex / Lex",
    "//  Metodo: Thompson (AFN) -> subconjuntos (AFD) ->",
    "//          minimizacion + maximal munch",
    "//",
    "//  Compilar:  g++ -std=c++17 -o lexer lexer.cpp",
    "//  Ejecutar:  ./lexer < entrada.txt",
    "//",
    "//  Reglas (en orden de prioridad):",
    ...rules.map(
      (r, i) =>
        `//    ${String(i + 1).padStart(2)}. ${names[i].padEnd(14)} ${r.pattern}` +
        (r.skip ? "   [se ignora]" : ""),
    ),
    "// =====================================================",
    "",
    "#include <iostream>",
    "#include <iomanip>",
    "#include <iterator>",
    "#include <string>",
    "",
  ]

  const enumBody = names.map((n, i) => `    TK_${n} = ${i},`).join("\n")

  const classRows = chunk([...dfa.classOf], 16)
    .map((part, index) =>
      `    ${part.map((v) => String(v).padStart(2)).join(", ")}` +
      `${index * 16 + part.length < dfa.classOf.length ? "," : ""}` +
      `   // ${index * 16}..${index * 16 + part.length - 1}`,
    )
    .join("\n")

  const classComments = dfa.classChars.map(
    (chars, index) => `//   clase ${String(index).padStart(2)} : ${describeClass(chars)}`,
  )

  const transWidth = String(dfa.numStates).length + 1
  const body = `
// -----------------------------------------------------
// Tipos de token
// -----------------------------------------------------

enum TokenType {
${enumBody}
    TK_ERROR = ${numRules},
    TK_END   = ${numRules + 1}
};

static const char* const TOKEN_NAMES[] = {
${names.map((n) => `    "${n}"`).join(",\n")},
    "ERROR",
    "END"
};

struct Token {
    TokenType   type;
    std::string lexeme;
    int         line;
    int         col;
};

// -----------------------------------------------------
// Tablas del AFD
// -----------------------------------------------------

static const int NUM_RULES   = ${numRules};
static const int NUM_STATES  = ${dfa.numStates};
static const int NUM_CLASSES = ${dfa.numClasses};
static const int START_STATE = ${dfa.start};

// Reglas que se reconocen pero no producen token
static const bool RULE_SKIP[NUM_RULES] = {
${chunk(
    rules.map((r) => (r.skip ? " true" : "false")),
    8,
  )
    .map((part) => "    " + part.join(", "))
    .join(",\n")}
};

// Clases de equivalencia de caracteres.
// Cada caracter ASCII se traduce a una columna de la tabla.
${classComments.join("\n")}
static const int CHAR_CLASS[128] = {
${classRows}
};

// TRANSITION[estado][clase] -> estado destino, -1 = sin transicion
static const int TRANSITION[NUM_STATES][NUM_CLASSES] = {
${table2d(dfa.trans, 16, transWidth)}
};

// ACCEPT[estado] -> indice de la regla aceptada, -1 = no acepta
static const int ACCEPT[NUM_STATES] = {
${table1d(dfa.accept, 16, transWidth)}
};

// -----------------------------------------------------
// Analizador lexico
// -----------------------------------------------------

class Lexer {

public:

    explicit Lexer(const std::string& source)
        : input(source), pos(0), line(1), col(1) {}

    Token next() {

        while (pos < input.size()) {

            int    state    = START_STATE;
            int    lastRule = -1;
            size_t lastPos  = pos;

            // Maximal munch: avanzar mientras el AFD lo permita
            // y recordar la ultima aceptacion vista.
            for (size_t i = pos; i < input.size(); ++i) {

                unsigned char c =
                    static_cast<unsigned char>(input[i]);

                if (c >= 128)
                    break;

                int target = TRANSITION[state][CHAR_CLASS[c]];

                if (target < 0)
                    break;

                state = target;

                if (ACCEPT[state] >= 0) {
                    lastRule = ACCEPT[state];
                    lastPos  = i + 1;
                }
            }

            int tokenLine = line;
            int tokenCol  = col;

            // Ninguna regla coincide: se reporta el caracter
            // y se avanza uno para poder continuar.
            if (lastRule < 0 || lastPos <= pos) {

                std::string bad(1, input[pos]);

                advance(bad);
                pos += 1;

                return Token{ TK_ERROR, bad, tokenLine, tokenCol };
            }

            std::string lexeme =
                input.substr(pos, lastPos - pos);

            advance(lexeme);
            pos = lastPos;

            // Regla marcada como ignorada (espacios, comentarios)
            if (RULE_SKIP[lastRule])
                continue;

            return Token{
                static_cast<TokenType>(lastRule),
                lexeme,
                tokenLine,
                tokenCol
            };
        }

        return Token{ TK_END, "", line, col };
    }

private:

    void advance(const std::string& text) {

        for (size_t i = 0; i < text.size(); ++i) {

            if (text[i] == '\\n') {
                line += 1;
                col   = 1;
            } else {
                col += 1;
            }
        }
    }

    std::string input;
    size_t      pos;
    int         line;
    int         col;
};

// -----------------------------------------------------
// Utilidades de impresion
// -----------------------------------------------------

static std::string visible(const std::string& text) {

    std::string out;

    for (size_t i = 0; i < text.size(); ++i) {

        char c = text[i];

        if      (c == '\\n') out += "\\\\n";
        else if (c == '\\t') out += "\\\\t";
        else if (c == '\\r') out += "\\\\r";
        else                out += c;
    }

    return out;
}

// -----------------------------------------------------
// Entrada de prueba usada cuando no se recibe nada
// por la entrada estandar.
// -----------------------------------------------------

static const char* DEMO_INPUT =
R"LEXGEN(${demoInput})LEXGEN";

int main() {

    std::string source(
        (std::istreambuf_iterator<char>(std::cin)),
        std::istreambuf_iterator<char>()
    );

    if (source.empty())
        source = DEMO_INPUT;

    std::cout
        << "Entrada:\\n"
        << source
        << "\\n\\n";

    std::cout
        << std::left
        << std::setw(16) << "TOKEN"
        << std::setw(24) << "LEXEMA"
        << std::setw(8)  << "LINEA"
        << "COL"
        << "\\n"
        << std::string(56, '-')
        << "\\n";

    Lexer lexer(source);

    int total  = 0;
    int errors = 0;

    while (true) {

        Token token = lexer.next();

        if (token.type == TK_END)
            break;

        if (token.type == TK_ERROR)
            errors += 1;
        else
            total += 1;

        std::cout
            << std::left
            << std::setw(16) << TOKEN_NAMES[token.type]
            << std::setw(24) << visible(token.lexeme)
            << std::setw(8)  << token.line
            << token.col
            << "\\n";
    }

    std::cout
        << "\\n"
        << total  << " token(s) reconocido(s), "
        << errors << " error(es)."
        << "\\n";

    return errors == 0 ? 0 : 1;
}
`

  return header.join("\n") + body
}
