#ifndef AST_H
#define AST_H

#include <iostream>
#include <string>
#include <vector>

using namespace std;


// =====================================================
// Clase base de todas las expresiones
// =====================================================

class Expr {

public:

    virtual ~Expr() {}

    // Para mostrar el AST
    virtual void print(ostream& out, int indent = 0) const = 0;
};


// =====================================================
// Carácter individual
//
// Ejemplos:
//
// a
// b
// 0
// 9
// +
// =====================================================

class CharExpr : public Expr {

public:

    char value;

    CharExpr(char value);

    void print(
        ostream& out,
        int indent = 0
    ) const override;
};


// =====================================================
// Cadena
//
// Ejemplos:
//
// "if"
// "else"
// =====================================================

class StringExpr : public Expr {

public:

    string value;

    StringExpr(const string& value);

    void print(
        ostream& out,
        int indent = 0
    ) const override;
};


// =====================================================
// Cualquier carácter
//
// .
//
// =====================================================

class DotExpr : public Expr {

public:

    DotExpr();

    void print(
        ostream& out,
        int indent = 0
    ) const override;
};


// =====================================================
// Elemento de una clase de caracteres
//
// Ejemplos:
//
// a-z
// A-Z
// 0-9
// a
//
// Para un carácter individual:
//
// first = a
// last  = a
//
// Para un rango:
//
// first = a
// last  = z
// =====================================================

class CharClassElement {

public:

    char first;
    char last;

    CharClassElement(
        char first,
        char last
    );

    bool isRange() const;
};


// =====================================================
// Clase de caracteres
//
// Ejemplos:
//
// [a-z]
// [A-Z]
// [0-9]
// [a-zA-Z0-9]
// [^0-9]
// =====================================================

class CharacterClassExpr : public Expr {

public:

    vector<CharClassElement> elements;

    bool negated;

    CharacterClassExpr(
        const vector<CharClassElement>& elements,
        bool negated
    );

    void print(
        ostream& out,
        int indent = 0
    ) const override;
};


// =====================================================
// Operadores binarios
//
// CONCAT:
//      ab
//
// OR:
//      a|b
// =====================================================

enum class BinaryOp {

    CONCAT,
    OR
};


// =====================================================
// Expresión binaria
// =====================================================

class BinaryRegexExpr : public Expr {

public:

    Expr* left;
    Expr* right;

    BinaryOp op;

    BinaryRegexExpr(
        Expr* left,
        Expr* right,
        BinaryOp op
    );

    ~BinaryRegexExpr();

    void print(
        ostream& out,
        int indent = 0
    ) const override;
};


// =====================================================
// Operadores unarios
//
// STAR:
//      a*
//
// PLUS:
//      a+
//
// QUESTION:
//      a?
// =====================================================

enum class UnaryOp {

    STAR,
    PLUS,
    QUESTION
};


// =====================================================
// Expresión unaria
// =====================================================

class UnaryRegexExpr : public Expr {

public:

    Expr* expr;

    UnaryOp op;

    UnaryRegexExpr(
        Expr* expr,
        UnaryOp op
    );

    ~UnaryRegexExpr();

    void print(
        ostream& out,
        int indent = 0
    ) const override;
};


// =====================================================
// Función auxiliar para imprimir espacios
// =====================================================

void printIndent(
    ostream& out,
    int indent
);

#endif // AST_H