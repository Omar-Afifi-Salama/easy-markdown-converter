# ⚡ Custom Markdown Compiler & Multi-Format Exporter

A modular, lightweight, extensible Markdown compiler built from scratch in TypeScript. It parses extended Markdown syntax and generates clean, styled **HTML**, **PDF**, or high-resolution **Retina PNG/Image** documents using headless browser rendering.

---

## 🚀 Key Features

- **3-Stage Architecture:** Clean separation of concerns via `Tokenizer` (Lexer) $\rightarrow$ `Parser` (AST builder) $\rightarrow$ `Compiler` (Code generator).
- **Built-in Zero-Dependency Syntax Highlighter:** Native tokenization and styling for keywords, strings, numbers, booleans, functions, operators, and comments.
- **Auto Light/Dark Theme Detection:** Calculates background color luminance to automatically toggle between dark (OneDark/Catppuccin) and light (GitHub Light) syntax themes.
- **Frontmatter Metadata & Design Tokens:** Configure document typography, code block backgrounds, heading colors, borders, and OpenGraph/HTML `<meta>` tags directly in YAML-style frontmatter.
- **Inline Color Tokens:** Color arbitrary words or phrases using named colors or hexadecimal codes (`[color:red]{text}` or `[#a6e3a1]{text}`).
- **GitHub Flavored Tables:** Full Markdown table parsing including column alignments (`:---`, `:---:`, `---:`).
- **Hard Line Breaks & Horizontal Rules:** Support for `\\`, trailing double spaces, and standalone `---` horizontal rules.
- **Crisp Multi-Format Export:** Directly export to `.html`, `.pdf`, or high-DPI (2x Retina) `.png` without needing manual file extensions.

---

## 📦 Project Architecture

```

src/
├── types.ts            # Shared AST nodes, token types, and metadata models
├── Tokenizer.ts        # Regex-driven block & inline lexer
├── Parser.ts           # Recursive AST builder with method overloading
├── Compiler.ts         # AST-to-HTML generator with nesting & indentation control
├── CodeHighlighter.ts  # Built-in code syntax tokenizer & palette manager
├── index.ts            # CLI entry point
└── utils/              # Utility and helper modules
    ├── colorUtils.ts   # Luminance calculation & color format parsers
    ├── converter.ts    # Multi-format emission pipeline (HTML / PDF / Retina Image)
    ├── htmlTemplate.ts # HTML shell wrapper, dynamic CSS injection & <meta> tags
    └── pathResolver.ts # Smart CLI argument and path normalizer

```

---

## 🛠️ Installation & Setup

1. **Clone the repository and install dependencies:**
    ```bash
    git clone <repo-url>
    cd markdown-parser
    npm install
    ```

````

2. **(Optional) Headless rendering dependencies:**
To export to **PDF** or **Image**, install Puppeteer:
```bash
npm install puppeteer

````

3. **Build the TypeScript source:**

```bash
npm run build

```

---

## 💻 CLI Usage & API

You can run the compiler using `npm run dev --` (or `node ./dist/index.js`):

```bash
npm run dev -- [input] [output] [format]

```

### Argument Resolution Matrix

| Argument   | Description                           | Default / Inferred Behavior                                  |
| ---------- | ------------------------------------- | ------------------------------------------------------------ |
| `[input]`  | Path to the source file               | Defaults to `./input.md`. Omitting `.md` auto-appends it.    |
| `[output]` | Target file or directory              | Auto-inferred based on input file name and format.           |
| `[format]` | Target format: `html`, `pdf`, `image` | Defaults to `html` (or inferred from output file extension). |

---

### CLI Examples

#### 1. Quick Compile (Default to HTML)

Looks for `input.md` and generates `input.html`:

```bash
npm run dev

```

#### 2. Auto-Resolving Names and Extensions

Omitting extensions is fully supported:

```bash
# Compiles ./notes.md -> ./notes.html
npm run dev -- notes

# Compiles ./notes.md -> ./notes.pdf
npm run dev -- notes pdf

# Compiles ./notes.md -> ./notes.png (at 2x Retina resolution)
npm run dev -- notes image

```

#### 3. Custom Output Destinations

```bash
# Compile to a specific output file
npm run dev -- ./docs/spec.md ./dist/spec.html

# Compile to a directory (automatically creates ./dist/spec.pdf)
npm run dev -- ./docs/spec.md ./dist pdf

```

---

## 📝 Extended Markdown Syntax Guide

### 1. Frontmatter Design & Metadata Attributes

Place metadata at the absolute start of your file. Styling properties are injected directly into the document CSS, while unrecognized keys are rendered as `<meta>` tags:

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

- **`bgColor`**: Document background (Hex, RGB, or named color). Automatically triggers light/dark syntax themes if `codeTheme` is `auto`.
- **`textColor`**: Base text color.
- **`headingColor`**: Color for all headings (`h1` through `h6`).
- **`fontSize`**: Base font size (e.g., `16px`, `1.1rem`).
- **`fontFamily`**: Custom font stack.
- **`maxWidth`**: Content wrapper width (e.g., `800px`, `1000px`).
- **`codeBg` / `codeTextColor` / `codeBorderColor**`: Styles for `<pre>`blocks and inline`<code>`.
- **`codeTheme`**: Force code palette (`auto`, `dark`, or `light`).
- **`tableBorderColor` / `tableHeaderBg**`: Border and heading cell background for tables.
- **`hrColor`**: Divider line color.

---

### 2. Code Blocks & Syntax Highlighting

Fenced code blocks are styled automatically with matching themes:

```typescript
import Tokenizer from "./Tokenizer.js";

// Initialize and parse
const parser = new Parser(new Tokenizer());
const { ast } = parser.parse("# Title");
console.log(ast);
```

Inline code is also supported:

```markdown
Use `npm run dev -- notes` to compile quickly.
```

---

### 3. Custom Text Colors

Color words or phrases inline with named colors or hexadecimal codes:

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

You can import and integrate the parser components directly into your own applications:

```typescript
import Tokenizer from "./Tokenizer.js";
import Parser from "./Parser.js";
import Compiler from "./Compiler.js";
import { wrapHTMLDocument } from "./htmlTemplate.js";

const markdown = `---
title: Programmatic Document
bgColor: #1e1e2e
textColor: #cdd6f4
---

# Hello World
This is **bold** with [color:tomato]{colored text}.

\`\`\`typescript
const greeting = "Hello!";
console.log(greeting);
\`\`\`
`;

// 1. Initialize pipeline
const tokenizer = new Tokenizer();
const parser = new Parser(tokenizer);
const compiler = new Compiler();

// 2. Parse Markdown string to AST
const { ast, warnings: parseWarnings } = parser.parse(markdown);

// 3. Compile AST to HTML string
const { html, metadata, warnings: compileWarnings } = compiler.compile(ast);

// 4. Wrap with full document shell, styles, and meta tags
const fullHTML = wrapHTMLDocument(html, metadata);

console.log(fullHTML);
```

---

## 📜 License

MIT License. Feel free to modify and build upon it!
