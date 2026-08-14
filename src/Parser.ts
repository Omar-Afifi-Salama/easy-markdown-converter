import Tokenizer from "./Tokenizer.js";

import { type Token, type TokenType, type ASTNode } from "./types.js";

export default class Parser {
    private tokens: Token[] = [];
    private current = 0;
    private ast: ASTNode[] = [];
    private warnings: string[] = [];

    constructor(private tokenizer: Tokenizer) {}

    parse(input: string): { ast: ASTNode[]; warnings: string[] };
    parse(tokens: Token[]): { ast: ASTNode[]; warnings: string[] };
    parse(inputOrTokens: string | Token[]): {
        ast: ASTNode[];
        warnings: string[];
    } {
        if (typeof inputOrTokens === "string") {
            this.tokens = this.tokenizer.tokenizeBlocks(inputOrTokens);
        } else {
            this.tokens = inputOrTokens;
        }

        this.current = 0;
        this.ast = [];
        this.warnings = [];

        while (!this.isAtEnd()) {
            const node = this.parseBlock();
            if (node) this.ast.push(node);
        }

        return { ast: this.ast, warnings: this.warnings };
    }

    private parseBlock(): ASTNode | null {
        if (this.match("FRONTMATTER")) {
            const token = this.previous();
            return { type: "FRONTMATTER", metadata: token?.metadata! };
        }

        if (this.match("HR")) {
            return { type: "HR" };
        }

        if (this.match("TABLE")) {
            return this.parseTable(this.previous().value);
        }

        if (this.match("HEADING")) {
            const token = this.previous();
            return {
                type: "HEADING",
                level: token?.level!,
                value: token?.value!,
                children: this.parseInline(token.value || ""),
            };
        }

        if (this.match("CODE_BLOCK")) {
            const token = this.previous();
            return {
                type: "CODE_BLOCK",
                lang: token?.lang!,
                value: token?.value!,
            };
        }

        if (this.match("IMAGE")) {
            const token = this.previous();
            return {
                type: "IMAGE",
                alt: token?.alt!,
                url: token?.url!,
            };
        }

        if (this.match("LINK")) {
            const token = this.previous();
            return {
                type: "LINK",
                value: token?.value!,
                url: token?.url!,
                children: this.parseInline(token.value || ""),
            };
        }

        if (this.check("LISTITEM")) {
            return this.parseList();
        }
        // 🟢 PARAGRAPH: Merge consecutive text lines into one paragraph
        if (this.match("PARAGRAPH") || this.match("TEXT")) {
            let combinedText = this.previous().value;

            // If the line ended with a break "\\", keep a newline so parseInline creates <br>
            while (this.match("PARAGRAPH") || this.match("TEXT")) {
                const prevWasBreak =
                    combinedText.endsWith("\\") || combinedText.endsWith("  ");
                combinedText +=
                    (prevWasBreak ? "\n" : " ") + this.previous().value;
            }

            return {
                type: "PARAGRAPH",
                value: combinedText,
                children: this.parseInline(combinedText),
            };
        }

        if (this.match("NEWLINE")) {
            while (this.match("NEWLINE")) {}
            return null;
        }

        this.advance();
        return null;
    }

    private parseInline(input: string): ASTNode[] {
        const tokens = this.tokenizer.tokenizeInline(input);
        const nodes: ASTNode[] = [];

        let current = 0;

        while (current < tokens.length) {
            const token = tokens[current];

            switch (token!.type) {
                case "IMAGE":
                    nodes.push({
                        type: "IMAGE",
                        alt: token?.alt!,
                        url: token?.url!,
                    });
                    break;
                case "LINK":
                    nodes.push({
                        type: "LINK",
                        url: token?.url!,
                        value: token?.value!,
                        children: token?.value!
                            ? this.parseInline(token.value)
                            : [],
                    });
                    break;
                case "COLOR": // 🟢 Color AST node
                    nodes.push({
                        type: "COLOR",
                        color: token?.color!,
                        value: token?.value!,
                        children: this.parseInline(token?.value || ""),
                    });
                    break;
                case "INLINE_CODE":
                    nodes.push({
                        type: "INLINE_CODE",
                        value: token?.value!,
                    });
                    break;
                case "BREAK": // 🟢 Line break
                    nodes.push({ type: "BREAK" });
                    break;
                case "BOLD":
                    nodes.push({
                        type: "BOLD",
                        value: token?.value!,
                        children: token?.value!
                            ? this.parseInline(token.value)
                            : [],
                    });
                    break;
                case "ITALIC":
                    nodes.push({
                        type: "ITALIC",
                        value: token?.value!,
                        children: token?.value!
                            ? this.parseInline(token.value)
                            : [],
                    });
                    break;
                case "TEXT":
                    nodes.push({
                        type: "TEXT",
                        value: token!.value,
                    });
                    break;
                case "SPACE":
                    nodes.push({ type: "SPACE", value: " " });
                    break;
                default:
                    this.warnings.push("unexpected inline token");
                    break;
            }

            current++;
        }

        return nodes;
    }

    private parseList(currentIndent = 0): ASTNode {
        const items: ASTNode[] = [];

        while (this.check("LISTITEM")) {
            const token = this.peek();
            const indent = token.indent || 0;

            // If indent is smaller, we're returning to a parent list level
            if (indent < currentIndent) {
                break;
            }

            // If indent is larger, recursively parse as a nested sub-list
            if (indent > currentIndent) {
                const nestedList = this.parseList(indent);
                if (items.length > 0) {
                    const lastItem = items[items.length - 1]!;
                    lastItem.children = [
                        ...(lastItem.children || []),
                        nestedList,
                    ];
                }
                continue;
            }

            // Same indentation level: consume token and add LISTITEM
            this.advance();
            items.push({
                type: "LISTITEM",
                value: token.value,
                children: this.parseInline(token.value || ""),
            });
        }

        return {
            type: "LIST",
            children: items,
        };
    }

    private parseTable(rawTable: string): ASTNode {
        const lines = rawTable.trim().split("\n");
        const headerLine = lines[0]!;
        const alignLine = lines[1]!;
        const rowLines = lines.slice(2);

        // Parse alignments (:---:, ---:, :---)
        const alignments: ("left" | "center" | "right")[] = alignLine
            .split("|")
            .filter((col) => col.trim() !== "")
            .map((col) => {
                const trimmed = col.trim();
                if (trimmed.startsWith(":") && trimmed.endsWith(":"))
                    return "center";
                if (trimmed.endsWith(":")) return "right";
                return "left";
            });

        const rows: ASTNode[] = [];

        // Parse Header Row
        const headerCells = headerLine
            .split("|")
            .filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1)
            .map((cellText, idx) => ({
                type: "TABLE_CELL" as TokenType,
                isHeader: true,
                align: alignments[idx] || "left",
                children: this.parseInline(cellText.trim()),
            }));

        rows.push({ type: "TABLE_ROW", children: headerCells });

        // Parse Body Rows
        for (const line of rowLines) {
            const cellTokens = line
                .split("|")
                .filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);

            const cells = cellTokens.map((cellText, idx) => ({
                type: "TABLE_CELL" as TokenType,
                isHeader: false,
                align: alignments[idx] || "left",
                children: this.parseInline(cellText.trim()),
            }));

            rows.push({ type: "TABLE_ROW", children: cells });
        }

        return { type: "TABLE", children: rows };
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    private check(type: TokenType): boolean {
        return !this.isAtEnd() && this.peek().type === type;
    }

    private peek(): Token {
        return this.tokens[this.current]!;
    }

    private previous(): Token {
        return this.tokens[this.current - 1]!;
    }

    private isAtEnd(): boolean {
        return this.current >= this.tokens.length;
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }
}
