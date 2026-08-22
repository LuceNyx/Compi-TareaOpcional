#include <iostream>

#include "ast.h"

using namespace std;


// =====================================================
// Función auxiliar
// =====================================================

void printIndent(
    ostream& out,
    int indent
) {

    for (int i = 0; i < indent; i++) {
        out << "    ";
    }
}


// =====================================================
// CharExpr
// =====================================================

CharExpr::CharExpr(char value)
    : value(value) {
}


void CharExpr::print(
    ostream& out,
    int indent
) const {

    printIndent(out, indent);

    out << "CHAR: "
        << value
        << endl;
}


// =====================================================
// StringExpr
// =====================================================

StringExpr::StringExpr(
    const string& value
)
    : value(value) {
}


void StringExpr::print(
    ostream& out,
    int indent
) const {

    printIndent(out, indent);

    out << "STRING: \""
        << value
        << "\""
        << endl;
}


// =====================================================
// DotExpr
// =====================================================

DotExpr::DotExpr() {
}


void DotExpr::print(
    ostream& out,
    int indent
) const {

    printIndent(out, indent);

    out << "DOT: ."
        << endl;
}


// =====================================================
// CharClassElement
// =====================================================

CharClassElement::CharClassElement(
    char first,
    char last
)
    : first(first),
      last(last) {
}


bool CharClassElement::isRange() const {

    return first != last;
}


// =====================================================
// CharacterClassExpr
// =====================================================

CharacterClassExpr::CharacterClassExpr(
    const vector<CharClassElement>& elements,
    bool negated
)
    : elements(elements),
      negated(negated) {
}


void CharacterClassExpr::print(
    ostream& out,
    int indent
) const {

    printIndent(out, indent);

    if (negated)
        out << "CHARACTER CLASS: [^"
            << endl;
    else
        out << "CHARACTER CLASS: ["
            << endl;


    for (const CharClassElement& element : elements) {

        printIndent(out, indent + 1);

        if (element.isRange()) {

            out << "RANGE: "
                << element.first
                << "-"
                << element.last
                << endl;

        }
        else {

            out << "CHAR: "
                << element.first
                << endl;
        }
    }


    printIndent(out, indent);

    out << "]"
        << endl;
}


// =====================================================
// BinaryRegexExpr
// =====================================================

BinaryRegexExpr::BinaryRegexExpr(
    Expr* left,
    Expr* right,
    BinaryOp op
)
    : left(left),
      right(right),
      op(op) {
}


BinaryRegexExpr::~BinaryRegexExpr() {

    delete left;
    delete right;
}


void BinaryRegexExpr::print(
    ostream& out,
    int indent
) const {

    printIndent(out, indent);

    if (op == BinaryOp::CONCAT) {

        out << "CONCAT"
            << endl;
    }
    else if (op == BinaryOp::OR) {

        out << "OR"
            << endl;
    }


    if (left != nullptr) {

        left->print(
            out,
            indent + 1
        );
    }


    if (right != nullptr) {

        right->print(
            out,
            indent + 1
        );
    }
}


// =====================================================
// UnaryRegexExpr
// =====================================================

UnaryRegexExpr::UnaryRegexExpr(
    Expr* expr,
    UnaryOp op
)
    : expr(expr),
      op(op) {
}


UnaryRegexExpr::~UnaryRegexExpr() {

    delete expr;
}


void UnaryRegexExpr::print(
    ostream& out,
    int indent
) const {

    printIndent(out, indent);


    switch (op) {

        case UnaryOp::STAR:

            out << "STAR (*)"
                << endl;

            break;


        case UnaryOp::PLUS:

            out << "PLUS (+)"
                << endl;

            break;


        case UnaryOp::QUESTION:

            out << "QUESTION (?)"
                << endl;

            break;
    }


    if (expr != nullptr) {

        expr->print(
            out,
            indent + 1
        );
    }
}