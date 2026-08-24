import os
import subprocess

# Archivos c++
programa = ["main.cpp", "scanner.cpp", "token.cpp", "parser.cpp", "ast.cpp"]

# Compilar
compile = ["g++"] + programa
print("Compilando:", " ".join(compile))
result = subprocess.run(compile, capture_output=True, text=True)

if result.returncode != 0:
    print("Error en compilación:\n", result.stderr)
    exit(1)

print("Compilación exitosa")

# Ejecutar
input_dir = "inputs"
for i in range(1, 2): 
    filename = f"input{i}.txt"
    filepath = os.path.join(input_dir, filename)
    if os.path.isfile(filepath):
        print(f"Ejecutado {filename}")
        run_cmd = ["./a.exe", filepath]
        subprocess.run(run_cmd, capture_output=True, text=True)
    else:
        print(filename, "no encontrado en",input_dir)