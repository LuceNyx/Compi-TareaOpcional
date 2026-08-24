#ifndef TOKEN_H
#define TOKEN_H

#include <iostream>
#include <string>

using namespace std;

class Token {

public:

    enum Type {

        // Caracteres y cadenas
        CHAR,
        STRING,

        // Agrupación
        LPAREN,     // (
        RPAREN,     // )

        // Clases de caracteres
        LBRACKET,   // [
        RBRACKET,   // ]

        // Operadores de expresiones regulares
        OR,         // |
        STAR,       // *
        PLUS,       // +
        QUESTION,   // ?

        // Elementos de clases
        DASH,       // -
        CARET,      // ^

        // Cualquier carácter
        DOT,        // .

        // Fin y error
        END,
        ERR
    };

    Type type;
    string text;

    // Constructores
    Token(Type type);
    Token(Type type, char c);
    Token(Type type, const string& text);
    Token(Type type, const string& source, int first, int length);

};

// Sobrecarga de <<
ostream& operator<<(ostream& outs, const Token& tok);
ostream& operator<<(ostream& outs, const Token* tok);

#endif