#include <iostream>
#include "token.h"

using namespace std;


Token::Token(Type type)
    : type(type), text("") {
}

Token::Token(Type type, char c)
    : type(type), text(string(1, c)) {
}

Token::Token(Type type, const string& text)
    : type(type), text(text) {
}

Token::Token(
    Type type,
    const string& source,
    int first,
    int length
)
    : type(type),
      text(source.substr(first, length)) {
}


ostream& operator<<(ostream& outs, const Token& tok) {

    switch (tok.type) {

        case Token::CHAR:
            outs << "TOKEN(CHAR, \"" 
                 << tok.text << "\")";
            break;

        case Token::STRING:
            outs << "TOKEN(STRING, \"" 
                 << tok.text << "\")";
            break;

        case Token::LPAREN:
            outs << "TOKEN(LPAREN, \"" 
                 << tok.text << "\")";
            break;

        case Token::RPAREN:
            outs << "TOKEN(RPAREN, \"" 
                 << tok.text << "\")";
            break;

        case Token::LBRACKET:
            outs << "TOKEN(LBRACKET, \"" 
                 << tok.text << "\")";
            break;

        case Token::RBRACKET:
            outs << "TOKEN(RBRACKET, \"" 
                 << tok.text << "\")";
            break;

        case Token::OR:
            outs << "TOKEN(OR, \"" 
                 << tok.text << "\")";
            break;

        case Token::STAR:
            outs << "TOKEN(STAR, \"" 
                 << tok.text << "\")";
            break;

        case Token::PLUS:
            outs << "TOKEN(PLUS, \"" 
                 << tok.text << "\")";
            break;

        case Token::QUESTION:
            outs << "TOKEN(QUESTION, \"" 
                 << tok.text << "\")";
            break;

        case Token::DASH:
            outs << "TOKEN(DASH, \"" 
                 << tok.text << "\")";
            break;

        case Token::CARET:
            outs << "TOKEN(CARET, \"" 
                 << tok.text << "\")";
            break;

        case Token::DOT:
            outs << "TOKEN(DOT, \"" 
                 << tok.text << "\")";
            break;

        case Token::ERR:
            outs << "TOKEN(ERR, \"" 
                 << tok.text << "\")";
            break;

        case Token::END:
            outs << "TOKEN(END)";
            break;
    }

    return outs;
}


ostream& operator<<(ostream& outs, const Token* tok) {

    if (!tok)
        return outs << "TOKEN(NULL)";

    return outs << *tok;
}