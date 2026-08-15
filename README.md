# ⚡ Easy Markdown Converter

[![npm version](https://img.shields.io/npm/v/easy-markdown-converter.svg?color=blue)](https://www.npmjs.com/package/easy-markdown-converter)
[![npm downloads](https://img.shields.io/npm/dt/easy-markdown-converter.svg)](https://www.npmjs.com/package/easy-markdown-converter)
[![GitHub license](https://img.shields.io/github/license/Omar-Afifi-Salama/easy-markdown-converter.svg)](https://github.com/Omar-Afifi-Salama/easy-markdown-converter/blob/main/LICENSE)

A modular, lightweight, and extensible Markdown compiler built from scratch in TypeScript. It parses extended Markdown syntax and renders clean, styled **HTML**, print-ready **PDF**, or high-resolution **Retina PNG/Image** documents using headless browser rendering.

---

## 🚀 Key Features

- **Zero-Install CLI (`npx`):** Run and compile documents instantly without manual cloning or configuration.
- **3-Stage Architecture:** Clean separation of concerns via `Tokenizer` (Lexer) $\rightarrow$ `Parser` (AST builder) $\rightarrow$ `Compiler` (Code generator).
- **Built-in Zero-Dependency Syntax Highlighter:** Native tokenization and styling for keywords, strings, numbers, booleans, functions, operators, and comments.
- **Automatic Luminance Detection:** Calculates background color luminance to auto-toggle between dark (OneDark/Catppuccin) and light (GitHub Light) code palettes.
- **Frontmatter Design Tokens:** Configure document typography, code block backgrounds, heading colors, borders, and OpenGraph/HTML `<meta>` tags directly in YAML-style frontmatter.
- **Inline Color Tokens:** Style arbitrary words or phrases using named colors or hex codes (`[color:red]{text}` or `[#a6e3a1]{text}`).
- **Print & PDF Page-Break Optimization:** Prevents split code blocks, broken tables, and orphaned headings across pages during PDF export.
- **GitHub Flavored Tables:** Full Markdown table parsing with alignment rules (`:---`, `:---:`, `---:`).
- **Crisp Multi-Format Export:** Directly export to `.html`, `.pdf`, or high-DPI (2x Retina) `.png` without needing manual file extensions.

---

## ⚡ Quick Start (`npx`)

Convert markdown files instantly without installing the package globally:

```bash
# Convert ./input.md -> ./input.html
npx easy-markdown-converter

# Convert ./notes.md -> ./notes.pdf
npx easy-markdown-converter notes.md notes.pdf pdf

# Convert ./spec.md -> ./spec.png (2x Retina screenshot)
npx easy-markdown-converter spec.md spec.png image
```

> **Note on PDF/Image Export:** Exporting to `pdf` or `image` formats uses Puppeteer for headless rendering. If Puppeteer is not installed in your current project, install it via `npm install -D puppeteer`.

---

## 📦 Installation & Global CLI

You can install the CLI globally or add it as a project dependency:

### Global Installation

```bash
npm install -g easy-markdown-converter

```

Now you can use the `easy-markdown-converter` command directly:

```bash
easy-markdown-converter README.md output.html

```

### Local Project Installation

```bash
npm install easy-markdown-converter

```

---

## 💻 CLI Usage & API

```bash
easy-markdown-converter [input] [output] [format]

```

### Argument Resolution Matrix

| Argument   | Description                           | Default / Inferred Behavior                                  |
| ---------- | ------------------------------------- | ------------------------------------------------------------ |
| `[input]`  | Path to the source file               | Defaults to `./input.md`. Omitting `.md` auto-appends it.    |
| `[output]` | Target file or destination directory  | Auto-inferred based on input file name and chosen format.    |
| `[format]` | Target format: `html`, `pdf`, `image` | Defaults to `html` (or inferred from output file extension). |

---

### CLI Examples

#### 1. Quick Compile (Default to HTML)

Looks for `input.md` and generates `input.html`:

```bash
npx easy-markdown-converter

```

#### 2. Auto-Resolving Names and Extensions

Omitting extensions is fully supported:

```bash
# Compiles ./notes.md -> ./notes.html
npx easy-markdown-converter notes

# Compiles ./notes.md -> ./notes.pdf
npx easy-markdown-converter notes pdf

# Compiles ./notes.md -> ./notes.png (at 2x Retina resolution)
npx easy-markdown-converter notes image

```

#### 3. Custom Output Destinations

```bash
# Compile to a specific output file
npx easy-markdown-converter ./docs/spec.md ./dist/spec.html

# Compile to a directory (automatically creates ./dist/spec.pdf)
npx easy-markdown-converter ./docs/spec.md ./dist pdf

```

---

## 📝 Extended Markdown Syntax Guide

### 1. Frontmatter Design & Metadata Attributes

Place metadata at the absolute start of your document. Styling properties are injected directly into the document CSS, while unrecognized keys are rendered as HTML `<meta>` tags:

```markdown
---
title: Custom API Reference
author: Omar
description: Technical documentation generated via custom Markdown parser
bgColor: #1e1e2e
textColor: #cdd6f4
headingColor: #89b4fa
fontSize: 16px
fontFamily: system-ui, sans-serif
maxWidth: 850px
codeBg: #181825
codeTextColor: #cdd6f4
codeBorderColor: #45475a
codeTheme: auto
tableBorderColor: #45475a
tableHeaderBg: rgba(255, 255, 255, 0.05)
hrColor: #45475a
---
```

#### Supported Style Attributes:

- **`bgColor`**: Document background color (Hex, RGB, or CSS named color). Automatically triggers light/dark syntax palettes when `codeTheme: auto`.
- **`textColor`**: Base body text color.
- **`headingColor`**: Color applied to headings (`h1` through `h6`).
- **`fontSize`**: Base font size (e.g., `16px`, `1.1rem`).
- **`fontFamily`**: Custom font stack.
- **`maxWidth`**: Content container width (e.g., `800px`, `1000px`).
- **`codeBg` / `codeTextColor` / `codeBorderColor**`: Styling tokens for `<pre>`blocks and inline`<code>`.
- **`codeTheme`**: Force code syntax palette (`auto`, `dark`, or `light`).
- **`tableBorderColor` / `tableHeaderBg**`: Border and heading cell background for tables.
- **`hrColor`**: Divider line color.

---

### 2. Code Blocks & Syntax Highlighting

Fenced code blocks with language tags are styled automatically with matching themes:

````markdown
```typescript
import Tokenizer from "./Tokenizer.js";

const parser = new Parser(new Tokenizer());
const { ast } = parser.parse("# Title");
console.log(ast);
```
````

Inline code is also styled automatically:

```markdown
Run `npx easy-markdown-converter notes` to compile quickly.
```

---

### 3. Custom Inline Colors

Color individual words or phrases using named colors or hexadecimal codes:

```markdown
This is [color:crimson]{custom red text} and this is [#89b4fa]{hex colored text}.
```

---

### 4. Hard Line Breaks & Horizontal Rules

```markdown
This line ends with a forced break\\
and continues immediately below.

---
```

---

### 5. GitHub Flavored Tables

```markdown
| Method |  Status   | Performance |
| :----- | :-------: | ----------: |
| `GET`  | Supported |        Fast |
| `POST` |  Active   |     Optimal |
```

---

## 🧩 Programmatic TypeScript API

You can import and integrate the parser components directly into your own Node.js / TypeScript applications:

```typescript
import {
    Tokenizer,
    Parser,
    Compiler,
    wrapHTMLDocument,
    convertMarkdown,
} from "easy-markdown-converter";

// Option A: Full CLI-like conversion
await convertMarkdown("./input.md", "./output.pdf", "pdf");

// Option B: Custom pipeline access
const markdown = `---
title: Programmatic Document
bgColor: #1e1e2e
textColor: #cdd6f4
---

# Hello World
This is **bold** with [color:tomato]{colored text}.
`;

const tokenizer = new Tokenizer();
const parser = new Parser(tokenizer);
const compiler = new Compiler();

const { ast, warnings: parseWarnings } = parser.parse(markdown);
const { html, metadata, warnings: compileWarnings } = compiler.compile(ast);
const fullHTML = wrapHTMLDocument(html, metadata);

console.log(fullHTML);
```

---

## 🛠️ Local Development & Contributing

1. **Clone the repository:**

```bash
git clone https://github.com/Omar-Afifi-Salama/easy-markdown-converter.git

cd easy-markdown-converter
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

4. **Test local binary linking:**

```bash
npm link
easy-markdown-converter input.md
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
