import {} from "./types.js";
export default class Tokenizer {
    tokenizeBlocks(input) {
        const blockPatterns = [
            // HEADING
            [
                /^#{1,6}\s[^\n]*(?:\n|$)/,
                "HEADING",
                (match) => ({
                    level: match.trim().split(" ")[0]?.length,
                    value: match.replace(/^#+\s/, "").trim(),
                }),
            ],
            [
                /^([ \t]*)[-*+]\s+[^\n]*(?:\n|$)/,
                "LISTITEM",
                (match, indent) => ({
                    value: match.replace(/^\s*[-*+]\s+/, "").trim(),
                    indent: indent.length,
                }),
            ],
            // NEWLINE
            [/\n+/, "NEWLINE"],
            // TEXT
            [
                /^(?![#\-*+]\s)[^\n]+/,
                "TEXT",
                (match) => ({ value: match.trim() }),
            ],
        ];
        return this.scan(input, blockPatterns, false);
    }
    tokenizeInline(input) {
        const inlinePatterns = [
            [
                /^!\[([^\]]+)\]\(([^)]+)\)/,
                "IMAGE",
                (match, alt, url) => ({
                    alt,
                    url,
                    value: match,
                }),
            ],
            [
                /^\[([^\]]+)\]\(([^)]+)\)/,
                "LINK",
                (match, text, url) => ({
                    value: text,
                    url,
                }),
            ],
            [
                /^(\*\*|__)([^\n]+?)\1/,
                "BOLD",
                (match, _, content) => ({
                    value: content,
                }),
            ],
            [
                /^(\*|_)([^\n]+?)\1/,
                "ITALIC",
                (match, _, content) => ({
                    value: content,
                }),
            ],
            [/\s+/, "SPACE"],
            [/[^\s*_![\n]+/, "TEXT"],
        ];
        return this.scan(input, inlinePatterns, true);
    }
    scan(input, patterns, fallbackToText) {
        let tokens = [];
        let cursor = 0;
        while (cursor < input.length) {
            let matched = false;
            for (const [regexp, type, handler] of patterns) {
                regexp.lastIndex = 0;
                const match = regexp.exec(input.slice(cursor));
                if (match && match.index === 0) {
                    const tokenData = handler
                        ? handler(...match)
                        : { value: match[0] };
                    tokens.push({ type, ...tokenData });
                    cursor += match[0].length;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                if (fallbackToText) {
                    tokens.push({ type: "TEXT", value: input[cursor] });
                }
                cursor++;
            }
        }
        return tokens;
    }
}
