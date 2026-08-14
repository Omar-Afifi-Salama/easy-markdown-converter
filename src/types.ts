export type TokenType =
    | "HEADING"
    | "PARAGRAPH"
    | "LINK"
    | "IMAGE"
    | "BOLD"
    | "ITALIC"
    | "LIST"
    | "LISTITEM"
    | "NEWLINE"
    | "TEXT"
    | "SPACE"
    | "BREAK" // 🟢 <br>
    | "COLOR" // 🟢 [color:red]{text}
    | "TABLE" // 🟢 <table>
    | "TABLE_ROW" // 🟢 <tr>
    | "TABLE_CELL" // 🟢 <td> or <th>
    | "FRONTMATTER" // 🟢 Metadata
    | "HR"
    | "CODE_BLOCK" // 🟢 Fenced code block (```lang ... ```)
    | "INLINE_CODE"; // 🟢 Inline code (`...`)

export interface Metadata {
    title?: string;

    // Base Document Styles
    bgColor?: string;
    textColor?: string;
    fontSize?: string;
    fontFamily?: string;
    headingColor?: string;
    lineHeight?: string;
    maxWidth?: string;

    // Code Block & Inline Code Styles
    codeBg?: string;
    codeTextColor?: string;
    codeBorderColor?: string;
    codeTheme?: "auto" | "dark" | "light"; // Force theme or let it auto-detect

    // Table & Rule Styles
    tableBorderColor?: string;
    tableHeaderBg?: string;
    hrColor?: string;

    [key: string]: string | undefined;
}

export interface Token {
    type: TokenType;
    value: string;
    level?: number;
    alt?: string;
    url?: string;
    indent?: number;
    lang?: string; // 🟢 Code block language
    color?: string;
    align?: "left" | "center" | "right";
    isHeader?: boolean;
    metadata?: Metadata;
}

export interface ASTNode {
    type: TokenType;
    children?: ASTNode[];
    value?: string;
    level?: number;
    alt?: string;
    url?: string;
    indent?: string;
    lang?: string; // 🟢 Code block language (e.g. "typescript", "html")
    color?: string; // For COLOR nodes
    align?: "left" | "center" | "right"; // For table cells
    isHeader?: boolean; // For <th> vs <td>
    metadata?: Metadata; // For FRONTMATTER
}

export type PatternRule = [RegExp, TokenType, Function?];

export type OutputFormat = "html" | "pdf" | "image";
