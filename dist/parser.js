import Tokenizer from "./tokenizer.js";
import {} from "./types.js";
export default class Parser {
    tokenizer;
    tokens = [];
    current = 0;
    ast = [];
    warnings = [];
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
    }
    parse(inputOrTokens) {
        if (typeof inputOrTokens === "string") {
            this.tokens = this.tokenizer.tokenizeBlocks(inputOrTokens);
        }
        else {
            this.tokens = inputOrTokens;
        }
        this.current = 0;
        this.ast = [];
        this.warnings = [];
        while (!this.isAtEnd()) {
            const node = this.parseBlock();
            if (node)
                this.ast.push(node);
        }
        return { ast: this.ast, warnings: this.warnings };
    }
    parseBlock() {
        if (this.match("HEADING")) {
            const token = this.previous();
            return {
                type: "HEADING",
                level: token?.level,
                value: token?.value,
                children: this.parseInline(token.value || ""),
            };
        }
        if (this.match("IMAGE")) {
            const token = this.previous();
            return {
                type: "IMAGE",
                alt: token?.alt,
                url: token?.url,
            };
        }
        if (this.match("LINK")) {
            const token = this.previous();
            return {
                type: "LINK",
                value: token?.value,
                url: token?.url,
                children: this.parseInline(token.value || ""),
            };
        }
        if (this.check("LISTITEM")) {
            return this.parseList();
        }
        if (this.match("TEXT")) {
            const token = this.previous();
            return {
                type: "PARAGRAPH",
                value: token.value,
                children: this.parseInline(token.value || ""),
            };
        }
        if (this.match("NEWLINE")) {
            while (this.match("NEWLINE")) { }
            return null;
        }
        return null;
    }
    parseInline(input) {
        const tokens = this.tokenizer.tokenizeInline(input);
        const nodes = [];
        let current = 0;
        while (current < tokens.length) {
            const token = tokens[current];
            switch (token.type) {
                case "IMAGE":
                    nodes.push({
                        type: "IMAGE",
                        alt: token?.alt,
                        url: token?.url,
                    });
                    break;
                case "LINK":
                    nodes.push({
                        type: "LINK",
                        url: token?.url,
                        value: token?.value,
                        children: token?.value
                            ? this.parseInline(token.value)
                            : [],
                    });
                    break;
                case "BOLD":
                    nodes.push({
                        type: "BOLD",
                        value: token?.value,
                        children: token?.value
                            ? this.parseInline(token.value)
                            : [],
                    });
                    break;
                case "ITALIC":
                    nodes.push({
                        type: "ITALIC",
                        value: token?.value,
                        children: token?.value
                            ? this.parseInline(token.value)
                            : [],
                    });
                    break;
                case "TEXT":
                    nodes.push({
                        type: "TEXT",
                        value: token.value,
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
    parseList(currentIndent = 0) {
        const items = [];
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
                    const lastItem = items[items.length - 1];
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
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(type) {
        return !this.isAtEnd() && this.peek().type === type;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    isAtEnd() {
        return this.current >= this.tokens.length;
    }
    advance() {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }
}
