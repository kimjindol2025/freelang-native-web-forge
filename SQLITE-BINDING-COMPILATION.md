# SQLite Binding Compilation Guide

**Purpose**: Compile sqlite_binding.c into a shared library for FreeLang FFI
**Status**: Ready to compile
**Files**: stdlib/core/sqlite_binding.c, sqlite_binding.h

---

## Quick Start

```bash
# Step 1: Ensure SQLite3 is installed
sudo apt-get install libsqlite3-dev

# Step 2: Compile to object file
gcc -c stdlib/core/sqlite_binding.c \
    -o stdlib/core/sqlite_binding.o \
    -Wall -fPIC

# Step 3: Create shared library
gcc -shared -fPIC \
    stdlib/core/sqlite_binding.o \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3

# Step 4: Verify library
ldd stdlib/core/libfreelang_sqlite.so
nm -D stdlib/core/libfreelang_sqlite.so | grep fl_sqlite
```

---

## Compilation Methods

### Method 1: Direct GCC (Simplest)

```bash
# All-in-one compilation
gcc -shared -fPIC stdlib/core/sqlite_binding.c \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3 -Wall -O2
```

**Pros**:
- Simple, one command
- Fast compilation
- All-in-one

**Cons**:
- Rebuilds everything
- No incremental builds

### Method 2: Separate Compile & Link (Best)

```bash
# Compile to object
gcc -c stdlib/core/sqlite_binding.c \
    -o stdlib/core/sqlite_binding.o \
    -Wall -fPIC -O2

# Link to shared library
gcc -shared -fPIC \
    stdlib/core/sqlite_binding.o \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3

# Later, just relink if needed
gcc -shared -fPIC \
    stdlib/core/sqlite_binding.o \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3
```

**Pros**:
- Incremental builds
- Separate compile and link phases
- Better for development

**Cons**:
- Two commands

### Method 3: Makefile (Professional)

Create `stdlib/core/Makefile`:

```makefile
CC = gcc
CFLAGS = -Wall -fPIC -O2
LIBS = -lsqlite3

# Targets
.PHONY: all clean

all: libfreelang_sqlite.so

libfreelang_sqlite.so: sqlite_binding.o
	$(CC) -shared -fPIC sqlite_binding.o -o $@ $(LIBS)

sqlite_binding.o: sqlite_binding.c sqlite_binding.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f sqlite_binding.o libfreelang_sqlite.so
```

Usage:
```bash
cd stdlib/core
make
make clean  # removes .o and .so files
```

### Method 4: CMake (Enterprise)

Create `stdlib/core/CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.10)
project(freelang_sqlite)

# Find SQLite3
find_package(SQLite3 REQUIRED)

# Create shared library
add_library(freelang_sqlite SHARED sqlite_binding.c)

# Link SQLite3
target_link_libraries(freelang_sqlite PUBLIC SQLite3::SQLite3)

# Compiler options
target_compile_options(freelang_sqlite PRIVATE -Wall -fPIC)

# Output directory
set_target_properties(freelang_sqlite PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/lib"
)
```

Usage:
```bash
cd stdlib/core
mkdir build
cd build
cmake ..
make
```

---

## Compilation Options Explained

### Compiler Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `-c` | Compile only (no linking) | `gcc -c file.c -o file.o` |
| `-o` | Output file name | `gcc ... -o libfoo.so` |
| `-shared` | Create shared library (.so) | `gcc -shared ...` |
| `-fPIC` | Position-Independent Code | Required for shared libraries |
| `-Wall` | All warnings | Recommended for safety |
| `-O2` | Optimization level | Performance vs. compile time |
| `-g` | Debug symbols | For debugging with gdb |
| `-L` | Library search path | `-L/usr/local/lib` |
| `-l` | Link library | `-lsqlite3` → libsqlite3.so |
| `-I` | Include search path | `-I/usr/include` |

### Recommended Compilation

```bash
# Development (debug symbols)
gcc -shared -fPIC sqlite_binding.c \
    -o libfreelang_sqlite.so \
    -lsqlite3 -Wall -g

# Production (optimized)
gcc -shared -fPIC sqlite_binding.c \
    -o libfreelang_sqlite.so \
    -lsqlite3 -Wall -O3
```

---

## Verifying Compilation

### Check if Library was Created

```bash
# List file
ls -lh stdlib/core/libfreelang_sqlite.so

# Check size (should be > 100KB)
file stdlib/core/libfreelang_sqlite.so
```

### Check Dependencies

```bash
# See linked libraries
ldd stdlib/core/libfreelang_sqlite.so
```

**Expected output**:
```
linux-vdso.so.1
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6
libsqlite3.so.0 => /usr/lib/x86_64-linux-gnu/libsqlite3.so.0
/lib64/ld-linux-x86-64.so.2
```

### Check Exported Symbols

```bash
# List all functions in library
nm -D stdlib/core/libfreelang_sqlite.so

# Filter for fl_ functions
nm -D stdlib/core/libfreelang_sqlite.so | grep fl_sqlite
```

**Expected output**:
```
00000000000010a0 T fl_sqlite_open
00000000000010d0 T fl_sqlite_close
00000000000010f0 T fl_sqlite_execute
00000000000011a0 T fl_sqlite_execute_update
... (14 functions total)
```

---

## Common Issues & Solutions

### Issue 1: SQLite3 Not Found

```
error: sqlite3.h: No such file or directory
```

**Solution**:
```bash
# Install SQLite3 development headers
sudo apt-get install libsqlite3-dev

# Or on macOS:
brew install sqlite3

# Or on Fedora:
sudo dnf install sqlite-devel
```

### Issue 2: Permission Denied

```
error: Permission denied
```

**Solution**:
```bash
# Make directory writable
chmod 755 stdlib/core/

# Or compile to /tmp
gcc -shared -fPIC sqlite_binding.c -o /tmp/libfreelang_sqlite.so -lsqlite3
```

### Issue 3: Library Not Found at Runtime

```
error: cannot open shared object file
```

**Solution**:
```bash
# Add library to LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/path/to/stdlib/core:$LD_LIBRARY_PATH

# Or copy to standard location
sudo cp stdlib/core/libfreelang_sqlite.so /usr/local/lib/
sudo ldconfig
```

### Issue 4: Undefined Reference

```
undefined reference to `sqlite3_open'
```

**Solution**:
```bash
# Make sure -lsqlite3 is in link command
gcc -shared -fPIC sqlite_binding.c \
    -o libfreelang_sqlite.so \
    -lsqlite3  # THIS IS REQUIRED
```

---

## Platform-Specific Instructions

### Linux (Ubuntu/Debian)

```bash
# Install dependencies
sudo apt-get install gcc libsqlite3-dev

# Compile
gcc -shared -fPIC stdlib/core/sqlite_binding.c \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3

# Verify
ldd stdlib/core/libfreelang_sqlite.so
```

### Linux (Fedora/RHEL)

```bash
# Install dependencies
sudo dnf install gcc sqlite-devel

# Compile
gcc -shared -fPIC stdlib/core/sqlite_binding.c \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3

# Verify
ldd stdlib/core/libfreelang_sqlite.so
```

### macOS

```bash
# SQLite3 is pre-installed on macOS
# But you may need to install it via Homebrew

brew install sqlite3

# Compile
gcc -shared -fPIC stdlib/core/sqlite_binding.c \
    -o stdlib/core/libfreelang_sqlite.dylib \
    -lsqlite3

# Verify
otool -L stdlib/core/libfreelang_sqlite.dylib
```

### Windows (MinGW)

```bash
# Install MinGW and SQLite3 dev library

# Compile to DLL
gcc -shared sqlite_binding.c \
    -o libfreelang_sqlite.dll \
    -lsqlite3

# Or use MSVC:
cl /LD sqlite_binding.c sqlite3.lib
```

---

## Integration with FreeLang Compiler

### Method 1: Copy to stdlib

```bash
# Copy compiled library to stdlib
cp stdlib/core/libfreelang_sqlite.so ~/.freelang/stdlib/core/

# Or use symlink
ln -s $(pwd)/stdlib/core/libfreelang_sqlite.so ~/.freelang/stdlib/core/
```

### Method 2: Set LD_LIBRARY_PATH

```bash
# Add to ~/.bashrc or ~/.zshrc
export LD_LIBRARY_PATH="${HOME}/.freelang/stdlib/core:$LD_LIBRARY_PATH"

# Then FreeLang compiler can find the library
freelang run examples/ffi_activation_test.free
```

### Method 3: Configure Compiler

Update FreeLang compiler configuration to include stdlib/core in library search path:

```typescript
// In FreeLang compiler code
const LIBRARY_PATHS = [
  './stdlib/core',
  '/usr/local/lib',
  '/usr/lib',
];
```

---

## Automated Build Script

Create `build_sqlite_binding.sh`:

```bash
#!/bin/bash

set -e  # Exit on error

echo "Building FreeLang SQLite Binding..."
echo ""

# Check if sqlite3 is installed
if ! pkg-config --exists sqlite3; then
    echo "ERROR: SQLite3 development library not found"
    echo "Install with: sudo apt-get install libsqlite3-dev"
    exit 1
fi

# Compile
echo "[1/3] Compiling sqlite_binding.c..."
gcc -c stdlib/core/sqlite_binding.c \
    -o stdlib/core/sqlite_binding.o \
    -Wall -fPIC -O2

# Link
echo "[2/3] Linking shared library..."
gcc -shared -fPIC stdlib/core/sqlite_binding.o \
    -o stdlib/core/libfreelang_sqlite.so \
    -lsqlite3

# Verify
echo "[3/3] Verifying compilation..."
if [ -f stdlib/core/libfreelang_sqlite.so ]; then
    SIZE=$(stat -f%z stdlib/core/libfreelang_sqlite.so 2>/dev/null || stat -c%s stdlib/core/libfreelang_sqlite.so 2>/dev/null)
    echo ""
    echo "✅ Compilation successful!"
    echo "   Library: stdlib/core/libfreelang_sqlite.so"
    echo "   Size: $SIZE bytes"
    echo ""
    echo "Exported functions:"
    nm -D stdlib/core/libfreelang_sqlite.so | grep fl_sqlite | head -5
    echo "   ... (9 more functions)"
else
    echo "❌ Compilation failed: Library not created"
    exit 1
fi
```

Usage:
```bash
chmod +x build_sqlite_binding.sh
./build_sqlite_binding.sh
```

---

## Testing Compiled Library

### C Test Program

Create `test_sqlite_binding.c`:

```c
#include <stdio.h>
#include "stdlib/core/sqlite_binding.h"

int main() {
    // Open database
    fl_sqlite_connection_t conn = fl_sqlite_open("test.db");

    if (!conn) {
        printf("Failed to open database\n");
        return 1;
    }

    printf("✅ Database opened successfully\n");

    // Execute simple query
    fl_sqlite_result_t result = fl_sqlite_execute(conn,
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");

    printf("✅ Query executed\n");

    // Close database
    fl_sqlite_close(conn);
    printf("✅ Database closed\n");

    return 0;
}
```

Compile and link:
```bash
gcc -c test_sqlite_binding.c -o test_sqlite_binding.o
gcc test_sqlite_binding.o -o test_sqlite_binding \
    stdlib/core/libfreelang_sqlite.so -lsqlite3

# Run test
./test_sqlite_binding
```

---

## Next Steps

1. ✅ Compilation preparation (THIS DOCUMENT)
2. ⏳ Compile sqlite_binding.c
   ```bash
   ./build_sqlite_binding.sh
   ```
3. ⏳ Integrate with FreeLang compiler
4. ⏳ Test with examples/ffi_activation_test.free
5. ⏳ Run actual database queries

---

## Reference

### SQLite3 Documentation
- https://www.sqlite.org/cli.html
- https://www.sqlite.org/c3ref/intro.html

### GCC Documentation
- https://gcc.gnu.org/onlinedocs/
- https://linux.die.net/man/1/gcc

### Building Shared Libraries
- https://tldp.org/HOWTO/Program-Library-HOWTO/
- https://www.gnu.org/software/libtool/manual/

---

**Status**: Ready for compilation
**Files**: stdlib/core/sqlite_binding.c, sqlite_binding.h
**Output**: stdlib/core/libfreelang_sqlite.so
**Next**: Run compilation script and test!
