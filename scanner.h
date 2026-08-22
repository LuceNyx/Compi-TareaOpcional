#ifndef SCANNER_H
#define SCANNER_H

#include <string>
#include "token.h"
using namespace std;

class Scanner {
private:
    string input;
    int first;
    int current;
    int state;                        // solo para automata  

public:
    // Constructor
    Scanner(const char* in_s);

    // Retorna el siguiente token
    Token* nextToken();

    // Destructor
    ~Scanner();

    char nextChar();                  // solo para automata
    void rollBack();                  // solo para automata
};

// Ejecutar scanner
void ejecutar_scanner(Scanner* scanner,const string& InputFile);

#endif // SCANNER_H