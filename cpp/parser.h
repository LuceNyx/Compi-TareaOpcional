#ifndef PARSER_H
#define PARSER_H

#include <stdexcept>

#include "token.h"
#include "scanner.h"
#include "ast.h"

using namespace std;

class Parser {

private:

    Scanner* scanner;

    Token* previous;
    Token* current;

    // =============================
    // Funciones auxiliares
    // =============================

    bool match(Token::Type type);
    bool check(Token::Type type);
    bool advance();
    bool isAtEnd();

    void consume(Token::Type type, const string& message);

    // Determina si el token actual puede
    // comenzar un elemento primario.
    bool startsPrimary();

    // =============================
    // Reglas gramaticales
    // =============================

    Expr* parseExpression();
    Expr* parseTerm();
    Expr* parseRepetition();
    Expr* parsePrimary();

    // Clase de caracteres:
    // [a-z]
    // [A-Z]
    // [0-9]
    // [a-zA-Z0-9]
    // [^0-9]
    Expr* parseCharacterClass();

public:

    Parser(Scanner* sc);

    ~Parser();

    Expr* parseProgram();
};

#endif