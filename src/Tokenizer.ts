import type { Token, PatternRule, Metadata } from "./types.js";

export default class Tokenizer {
    tokenizeBlocks(input: string): Token[] {
        // Strip carriage returns to make all newlines uniform \n
        const normalized = input.replace(/\r\n/g, "\n");

        const blockPatterns: PatternRule[] = [
            // 🟢 1. FRONTMATTER: Strictly anchored at the absolute beginning of file (cursor 0)
            [
                /^---\n([\s\S]*?)\n---\n?/,
                "FRONTMATTER",
                (match: string, rawYaml: string) => {
                    const metadata: Metadata = {};
                    rawYaml.split("\n").forEach((line) => {
                        const colonIdx = line.indexOf(":");
                        if (colonIdx > -1) {
                            const key = line.slice(0, colonIdx).trim();
                            const val = line.slice(colonIdx + 1).trim();
                            if (key) metadata[key] = val;
                        }
                    });
                    return { value: match, metadata };
                },
            ],

            // 🟢 2. FENCED CODE BLOCKS (```lang ... ```)
            [
                /^```([a-zA-Z0-9_-]*)\n([\s\S]*?)\n```(?:\n|$)/,
                "CODE_BLOCK",
                (match: string, lang: string, code: string) => ({
                    lang: lang.trim() || undefined,
                    value: code,
                }),
            ],

            // 🟢 3. HORIZONTAL RULE (--- or *** or ___ alone on a line)
            [
                /^(?:-{3,}|\*{3,}|_{3,})[ \t]*(?:\n|$)/,
                "HR",
                () => ({ value: "" }),
            ],

            // 🟢 4. GITHUB TABLE
            [
                /^(\|.+?\|\n\|[-:\s|]+\|\n(?:\|.+?\|(?:\n|$))*)/,
                "TABLE",
                (match: string) => ({ value: match.trim() }),
            ],

            // 🟢 5. HEADING (# ...)
            [
                /^#{1,6}\s[^\n]*(?:\n|$)/,
                "HEADING",
                (match: string) => ({
                    level: match.trim().split(" ")[0]?.length,
                    value: match.replace(/^#+\s/, "").trim(),
                }),
            ],

            // 🟢 6. ORDERED & UNORDERED LISTITEMS (- or * or + or 1.)
            [
                /^([ \t]*)(?:[-*+]|\d+\.)\s+[^\n]*(?:\n|$)/,
                "LISTITEM",
                (match: string, indent: string) => ({
                    value: match
                        .replace(/^[ \t]*(?:[-*+]|\d+\.)\s+/, "")
                        .trim(),
                    indent: indent.length,
                }),
            ],

            // 🟢 7. BLANK LINES
            [/^\n+/, "NEWLINE"],

            // 🟢 8. PARAGRAPH (Single line fallback)
            [
                /^[^\n]+(?:\n|$)/,
                "PARAGRAPH",
                (match: string) => ({ value: match.replace(/\n$/, "") }),
            ],
        ];

        return this.scan(normalized, blockPatterns, false);
    }

    tokenizeInline(input: string): Token[] {
        const inlinePatterns: PatternRule[] = [
            // 1. INLINE CODE (`code`)
            [
                /^`([^`\n]+)`/,
                "INLINE_CODE",
                (match: string, code: string) => ({ value: code }),
            ],

            // 2. HARD BREAK (\\ or \ or 2+ spaces before newline/end)
            [/^(?:\\\\|\\| {2,})(?:\n|$)/, "BREAK", () => ({ value: "" })],

            // 3. IMAGE
            [
                /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/,
                "IMAGE",
                (match: string, alt: string, url: string) => ({
                    alt,
                    url,
                    value: match,
                }),
            ],

            // 4. LINK
            [
                /^\[((?:!\[[^\]]*\]\([^)]+\)|[^\]])+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/,
                "LINK",
                (match: string, text: string, url: string) => ({
                    value: text,
                    url,
                }),
            ],

            // 5. COLOR
            [
                /^\[(?:color:)?([a-zA-Z]+|#[0-9a-fA-F]{3,8})\]\{([^}]+)\}/,
                "COLOR",
                (match: string, color: string, content: string) => ({
                    color,
                    value: content,
                }),
            ],

            // 6. BOLD & ITALIC
            [
                /^(\*\*|__)([^\n]+?)\1/,
                "BOLD",
                (match: string, _: any, content: string) => ({
                    value: content,
                }),
            ],
            [
                /^(\*|_)([^\n]+?)\1/,
                "ITALIC",
                (match: string, _: any, content: string) => ({
                    value: content,
                }),
            ],

            // 7. SPACES & TEXT
            [/^[ \t]+/, "SPACE"],
            [/^[^\s*_![\\]+/, "TEXT"],
        ];

        return this.scan(input, inlinePatterns, true);
    }

    private scan(
        input: string,
        patterns: PatternRule[],
        fallbackToText: boolean,
    ): Token[] {
        let tokens: Token[] = [];
        let cursor = 0;

        while (cursor < input.length) {
            let matched = false;

            for (const [regexp, type, handler] of patterns) {
                if (type === "FRONTMATTER" && cursor !== 0) {
                    continue;
                }

                regexp.lastIndex = 0;
                const match = regexp.exec(input.slice(cursor));

                if (match && match.index === 0 && match[0].length > 0) {
                    const tokenData = handler
                        ? handler(...match)
                        : { value: match[0] };

                    tokens.push({ type, ...tokenData } as Token);
                    cursor += match[0].length;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                if (fallbackToText) {
                    tokens.push({ type: "TEXT", value: input[cursor]! });
                }
                cursor++;
            }
        }

        return tokens;
    }
}
