#include <iostream>
#include <cstring>
#include <fstream>
#include <cctype>

#include "token.h"
#include "scanner.h"

using namespace std;


// -----------------------------
// Constructor
// -----------------------------

Scanner::Scanner(const char* s)
    : input(s), first(0), current(0) {
}


// -----------------------------
// Función auxiliar
// -----------------------------

bool is_white_space(char c) {

    return c == ' ' ||
           c == '\n' ||
           c == '\r' ||
           c == '\t';
}


// -----------------------------
// nextToken: obtiene el siguiente token
// -----------------------------

Token* Scanner::nextToken() {

    Token* token;
    char c;

    state = 0;
    first = current;

    while (true) {

        switch (state) {

            // =============================
            // ESTADO 0
            // Inicio
            // =============================

            case 0:

                c = nextChar();

                // Espacios en blanco
                if (is_white_space(c)) {

                    first = current;
                    state = 0;
                }

                // Fin de entrada
                else if (c == '\0') {

                    return new Token(Token::END);
                }

                // (
                else if (c == '(') {

                    state = 1;
                }

                // )
                else if (c == ')') {

                    state = 2;
                }

                // [
                else if (c == '[') {

                    state = 3;
                }

                // ]
                else if (c == ']') {

                    state = 4;
                }

                // |
                else if (c == '|') {

                    state = 5;
                }

                // *
                else if (c == '*') {

                    state = 6;
                }

                // +
                else if (c == '+') {

                    state = 7;
                }

                // ?
                else if (c == '?') {

                    state = 8;
                }

                // -
                else if (c == '-') {

                    state = 9;
                }

                // ^
                else if (c == '^') {

                    state = 10;
                }

                // .
                else if (c == '.') {

                    state = 11;
                }

                // "
                else if (c == '"') {

                    state = 12;
                }

                // Caracter normal
                else {

                    state = 14;
                }

                break;


            // =============================
            // (
            // =============================

            case 1:

                return new Token(
                    Token::LPAREN,
                    c
                );


            // =============================
            // )
            // =============================

            case 2:

                return new Token(
                    Token::RPAREN,
                    c
                );


            // =============================
            // [
            // =============================

            case 3:

                return new Token(
                    Token::LBRACKET,
                    c
                );


            // =============================
            // ]
            // =============================

            case 4:

                return new Token(
                    Token::RBRACKET,
                    c
                );


            // =============================
            // |
            // =============================

            case 5:

                return new Token(
                    Token::OR,
                    c
                );


            // =============================
            // *
            // =============================

            case 6:

                return new Token(
                    Token::STAR,
                    c
                );


            // =============================
            // +
            // =============================

            case 7:

                return new Token(
                    Token::PLUS,
                    c
                );


            // =============================
            // ?
            // =============================

            case 8:

                return new Token(
                    Token::QUESTION,
                    c
                );


            // =============================
            // -
            // =============================

            case 9:

                return new Token(
                    Token::DASH,
                    c
                );


            // =============================
            // ^
            // =============================

            case 10:

                return new Token(
                    Token::CARET,
                    c
                );


            // =============================
            // .
            // =============================

            case 11:

                return new Token(
                    Token::DOT,
                    c
                );


            // =============================
            // Cadena entre comillas
            //
            // Ejemplo:
            //
            // "if"
            // "else"
            // =============================

            case 12: {

                int stringStart = current;

                while (true) {

                    c = nextChar();

                    // No se cerró la cadena
                    if (c == '\0') {

                        return new Token(
                            Token::ERR,
                            "Cadena sin cerrar"
                        );
                    }

                    // Se encontró la comilla final
                    if (c == '"') {

                        return new Token(
                            Token::STRING,
                            input,
                            stringStart,
                            current - stringStart - 1
                        );
                    }
                }
            }


            // =============================
            // Caracter normal
            //
            // Ejemplos:
            //
            // a
            // z
            // A
            // Z
            // 0
            // 9
            // =============================

            case 14:

                return new Token(
                    Token::CHAR,
                    c
                );
        }
    }
}


// -----------------------------
// rollBack
// -----------------------------

void Scanner::rollBack() {

    if (current > 0)
        current--;
}


// -----------------------------
// nextChar
// -----------------------------

char Scanner::nextChar() {

    if (current >= (int)input.length())
        return '\0';

    char c = input[current];

    current++;

    return c;
}


// -----------------------------
// Destructor
// -----------------------------

Scanner::~Scanner() {
}


// -----------------------------
// Función de prueba
// -----------------------------

void ejecutar_scanner(
    Scanner* scanner,
    const string& InputFile
) {

    Token* tok;

    // Crear nombre para archivo de salida

    string OutputFileName = InputFile;

    size_t pos =
        OutputFileName.find_last_of(".");

    if (pos != string::npos) {

        OutputFileName =
            OutputFileName.substr(0, pos);
    }

    OutputFileName += "_tokens.txt";


    ofstream outFile(OutputFileName);

    if (!outFile.is_open()) {

        cerr
            << "Error: no se pudo abrir el archivo "
            << OutputFileName
            << endl;

        return;
    }


    outFile
        << "Iniciando Scanner para archivo: "
        << InputFile
        << endl
        << endl;


    while (true) {

        tok = scanner->nextToken();


        // -------------------------
        // END
        // -------------------------

        if (tok->type == Token::END) {

            outFile << *tok << endl;

            delete tok;

            outFile
                << "\nScanner exitoso"
                << endl
                << endl;

            outFile.close();

            return;
        }


        // -------------------------
        // ERROR
        // -------------------------

        if (tok->type == Token::ERR) {

            outFile << *tok << endl;

            delete tok;

            outFile
                << "Caracter invalido"
                << endl
                << endl;

            outFile
                << "Scanner no exitoso"
                << endl
                << endl;

            outFile.close();

            return;
        }


        // -------------------------
        // Token normal
        // -------------------------

        outFile << *tok << endl;

        delete tok;
    }
}