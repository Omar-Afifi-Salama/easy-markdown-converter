export default class Compiler {
    warnings = [];
    compile(ast) {
        this.warnings = [];
        const html = ast.map((node) => this.compileNode(node, 0)).join("\n\n");
        return {
            html,
            warnings: this.warnings,
        };
    }
    escapeHTML(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    // Compiles inline children (bold, italic, links, plain text) flatly without extra newlines
    compileInlineChildren(node) {
        if (!node.children || node.children.length === 0) {
            return node.value ? this.escapeHTML(node.value) : "";
        }
        return node.children
            .map((child) => this.compileNode(child, 0))
            .join("");
    }
    // Main node compiler with indentation tracking
    compileNode(node, indentLevel = 0) {
        const indent = "  ".repeat(indentLevel); // 2 spaces per indent level
        switch (node.type) {
            case "HEADING":
                return `${indent}<h${node.level}>${this.compileInlineChildren(node)}</h${node.level}>`;
            case "PARAGRAPH":
                return `${indent}<p>${this.compileInlineChildren(node)}</p>`;
            case "LIST": {
                if (!node.children || node.children.length === 0)
                    return "";
                const items = node.children
                    .map((child) => this.compileNode(child, indentLevel + 1))
                    .join("\n");
                return `${indent}<ul>\n${items}\n${indent}</ul>`;
            }
            case "LISTITEM": {
                if (!node.children || node.children.length === 0) {
                    return `${indent}<li>${this.escapeHTML(node.value || "")}</li>`;
                }
                // Check if this <li> contains a nested sub-list (<ul>)
                const sublist = node.children.find((c) => c.type === "LIST");
                const inlineChildren = node.children.filter((c) => c.type !== "LIST");
                const textContent = inlineChildren
                    .map((child) => this.compileNode(child, 0))
                    .join("");
                if (sublist) {
                    // Render inline text, then the nested list on a new line, cleanly closed
                    const compiledSublist = this.compileNode(sublist, indentLevel + 1);
                    return `${indent}<li>\n${indent}  ${textContent}\n${compiledSublist}\n${indent}</li>`;
                }
                return `${indent}<li>${textContent}</li>`;
            }
            // --- Inline Elements (indentLevel ignored) ---
            case "LINK":
                return `<a href="${node.url}">${this.compileInlineChildren(node)}</a>`;
            case "IMAGE":
                return `<img src="${node.url}" alt="${this.escapeHTML(node.alt || "")}" />`;
            case "BOLD":
                return `<b>${this.compileInlineChildren(node)}</b>`;
            case "ITALIC":
                return `<i>${this.compileInlineChildren(node)}</i>`;
            case "TEXT":
                return this.escapeHTML(node.value || "");
            case "SPACE":
                return " ";
            default:
                this.warnings.push(`Unknown node type during compilation: ${node.type}`);
                return "";
        }
    }
}
