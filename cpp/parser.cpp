#include <iostream>
#include <stdexcept>

#include "token.h"
#include "scanner.h"
#include "ast.h"
#include "parser.h"

using namespace std;


// =============================
// Constructor
// =============================

Parser::Parser(Scanner* sc)
    : scanner(sc),
      previous(nullptr) {

    current = scanner->nextToken();

    if (current->type == Token::ERR) {
        throw runtime_error("Error lexico");
    }
}


// =============================
// Destructor
// =============================

Parser::~Parser() {

    if (previous != nullptr)
        delete previous;

    if (current != nullptr)
        delete current;
}


// =============================
// Funciones auxiliares
// =============================

bool Parser::match(Token::Type type) {

    if (check(type)) {
        advance();
        return true;
    }

    return false;
}


bool Parser::check(Token::Type type) {

    if (isAtEnd())
        return type == Token::END;

    return current->type == type;
}


bool Parser::advance() {

    if (!isAtEnd()) {

        Token* temp = current;

        current = scanner->nextToken();

        if (previous != nullptr)
            delete previous;

        previous = temp;

        if (current->type == Token::ERR) {
            throw runtime_error("Error lexico");
        }

        return true;
    }

    return false;
}


bool Parser::isAtEnd() {

    return current->type == Token::END;
}


void Parser::consume(
    Token::Type type,
    const string& message
) {

    if (check(type)) {
        advance();
        return;
    }

    throw runtime_error(message);
}


// =============================
// Determina si puede comenzar
// un elemento primario
// =============================

bool Parser::startsPrimary() {

    return
        current->type == Token::CHAR ||
        current->type == Token::STRING ||
        current->type == Token::LPAREN ||
        current->type == Token::LBRACKET ||
        current->type == Token::DOT;
}


// =============================
// Programa
// =============================

Expr* Parser::parseProgram() {

    Expr* ast = parseExpression();

    if (!isAtEnd()) {
        throw runtime_error(
            "Error sintactico: se esperaba fin de entrada"
        );
    }

    cout << "Parseo exitoso" << endl;

    return ast;
}


// =============================
// <expresion>
//
// <expresion> →
//      <termino>
//      <termino> | <expresion>
//
// Implementada sin recursion
// izquierda:
//
// expresion → termino ( '|' termino )*
// =============================

Expr* Parser::parseExpression() {

    Expr* left = parseTerm();

    while (match(Token::OR)) {

        Expr* right = parseTerm();

        left = new BinaryRegexExpr(
            left,
            right,
            BinaryOp::OR
        );
    }

    return left;
}


// =============================
// <termino>
//
// termino →
//      repeticion
//      repeticion repeticion ...
//
// La concatenacion NO tiene
// un token propio.
// Se detecta cuando aparece
// otro primario inmediatamente.
// =============================

Expr* Parser::parseTerm() {

    Expr* left = parseRepetition();

    while (startsPrimary()) {

        Expr* right = parseRepetition();

        left = new BinaryRegexExpr(
            left,
            right,
            BinaryOp::CONCAT
        );
    }

    return left;
}


// =============================
// <repeticion>
//
// repeticion →
//      primario
//      primario *
//      primario +
//      primario ?
// =============================

Expr* Parser::parseRepetition() {

    Expr* expr = parsePrimary();

    if (match(Token::STAR)) {

        return new UnaryRegexExpr(
            expr,
            UnaryOp::STAR
        );
    }

    if (match(Token::PLUS)) {

        return new UnaryRegexExpr(
            expr,
            UnaryOp::PLUS
        );
    }

    if (match(Token::QUESTION)) {

        return new UnaryRegexExpr(
            expr,
            UnaryOp::QUESTION
        );
    }

    return expr;
}


// =============================
// <primario>
//
// primario →
//      ( expresion )
//      "cadena"
//      [ clase ]
//      [ ^ clase ]
//      caracter
//      .
// =============================

Expr* Parser::parsePrimary() {

    // -------------------------
    // (expresion)
    // -------------------------

    if (match(Token::LPAREN)) {

        Expr* expr = parseExpression();

        consume(
            Token::RPAREN,
            "Error sintactico: se esperaba ')'"
        );

        return expr;
    }


    // -------------------------
    // "cadena"
    // -------------------------

    if (match(Token::STRING)) {

        return new StringExpr(
            previous->text
        );
    }


    // -------------------------
    // [clase]
    // -------------------------

    if (match(Token::LBRACKET)) {

        return parseCharacterClass();
    }


    // -------------------------
    // .
    // -------------------------

    if (match(Token::DOT)) {

        return new DotExpr();
    }


    // -------------------------
    // caracter
    // -------------------------

    if (match(Token::CHAR)) {

        return new CharExpr(
            previous->text[0]
        );
    }


    // -------------------------
    // Error
    // -------------------------

    throw runtime_error(
        "Error sintactico: "
        "se esperaba una expresion regular"
    );
}


// =============================
// Clase de caracteres
//
// Ejemplos:
//
// [a-z]
// [A-Z]
// [0-9]
// [a-zA-Z]
// [a-zA-Z0-9]
// [^0-9]
// =============================

Expr* Parser::parseCharacterClass() {

    bool negated = false;

    // -------------------------
    // [^
    // -------------------------

    if (match(Token::CARET)) {
        negated = true;
    }


    // Debe haber al menos
    // un elemento dentro de [].

    if (!check(Token::CHAR)) {

        throw runtime_error(
            "Error sintactico: "
            "se esperaba un caracter dentro de []"
        );
    }


    vector<CharClassElement> elements;


    // -------------------------
    // Leer elementos
    // -------------------------

    while (!check(Token::RBRACKET) && !isAtEnd()) {

        // Primer caracter
        consume(
            Token::CHAR,
            "Se esperaba un caracter"
        );

        char first = previous->text[0];


        // -------------------------
        // Rango:
        //
        // a-z
        // A-Z
        // 0-9
        // -------------------------

        if (match(Token::DASH)) {

            if (!check(Token::CHAR)) {

                throw runtime_error(
                    "Error sintactico: "
                    "se esperaba un caracter despues de '-'"
                );
            }

            consume(
                Token::CHAR,
                "Se esperaba un caracter"
            );

            char last = previous->text[0];

            elements.push_back(
                CharClassElement(
                    first,
                    last
                )
            );
        }

        // -------------------------
        // Caracter individual
        // -------------------------

        else {

            elements.push_back(
                CharClassElement(
                    first,
                    first
                )
            );
        }
    }


    // -------------------------
    // ]
    // -------------------------

    consume(
        Token::RBRACKET,
        "Error sintactico: "
        "se esperaba ']'"
    );


    return new CharacterClassExpr(
        elements,
        negated
    );
}