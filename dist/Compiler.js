import { highlightCode } from "./CodeHighlighter.js"; // 🟢 Your custom highlighter!
import { isDarkColor } from "./utils/colorUtils.js";
export default class Compiler {
    warnings = [];
    compile(ast) {
        this.warnings = [];
        let metadata = {};
        const frontmatterNode = ast.find((node) => node.type === "FRONTMATTER");
        if (frontmatterNode && frontmatterNode.metadata) {
            metadata = frontmatterNode.metadata;
        }
        const isDarkTheme = metadata.codeTheme
            ? metadata.codeTheme === "dark"
            : isDarkColor(metadata.codeBg || metadata.bgColor || "#ffffff");
        const bodyHTML = ast
            .filter((node) => node.type !== "FRONTMATTER")
            .map((node) => this.compileNode(node, isDarkTheme, 0))
            .join("\n\n");
        return { html: bodyHTML, metadata, warnings: this.warnings };
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
    compileInlineChildren(node, isDarkTheme) {
        if (!node.children || node.children.length === 0) {
            return node.value ? this.escapeHTML(node.value) : "";
        }
        return node.children
            .map((child) => this.compileNode(child, isDarkTheme, 0))
            .join("");
    }
    // Main node compiler with indentation tracking
    compileNode(node, isDarkTheme, indentLevel = 0) {
        const indent = "  ".repeat(indentLevel); // 2 spaces per indent level
        switch (node.type) {
            case "HEADING":
                return `${indent}<h${node.level}>${this.compileInlineChildren(node, isDarkTheme)}</h${node.level}>`;
            case "PARAGRAPH":
                return `${indent}<p>${this.compileInlineChildren(node, isDarkTheme)}</p>`;
            case "HR":
                return `${indent}<hr />`;
            case "BREAK":
                return `<br />`;
            case "COLOR":
                return `<span style="color: ${node.color};">${this.compileInlineChildren(node, isDarkTheme)}</span>`;
            case "TABLE": {
                const rows = (node.children || [])
                    .map((row) => this.compileNode(row, isDarkTheme, indentLevel + 1))
                    .join("\n");
                return `${indent}<table>\n${rows}\n${indent}</table>`;
            }
            case "TABLE_ROW": {
                const cells = (node.children || [])
                    .map((cell) => this.compileNode(cell, isDarkTheme, indentLevel + 1))
                    .join("");
                return `${indent}<tr>${cells}</tr>`;
            }
            case "TABLE_CELL": {
                const tag = node.isHeader ? "th" : "td";
                const alignStyle = node.align
                    ? ` style="text-align: ${node.align};"`
                    : "";
                return `<${tag}${alignStyle}>${this.compileInlineChildren(node, isDarkTheme)}</${tag}>`;
            }
            case "CODE_BLOCK": {
                const rawCode = node.value || "";
                const lang = node.lang?.trim().toLowerCase();
                const highlighted = highlightCode(rawCode, isDarkTheme);
                const langBadge = lang
                    ? `<div class="code-header"><span class="code-lang">${this.escapeHTML(lang)}</span></div>`
                    : "";
                const langClass = lang
                    ? ` class="language-${this.escapeHTML(lang)}"`
                    : "";
                return `${indent}<div class="code-block-wrapper">
${indent}  ${langBadge}
${indent}  <pre><code${langClass}>${highlighted}</code></pre>
${indent}</div>`;
            }
            case "INLINE_CODE":
                return `<code>${this.escapeHTML(node.value || "")}</code>`;
            case "LIST": {
                if (!node.children || node.children.length === 0)
                    return "";
                const items = node.children
                    .map((child) => this.compileNode(child, isDarkTheme, indentLevel + 1))
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
                    .map((child) => this.compileNode(child, isDarkTheme, 0))
                    .join("");
                if (sublist) {
                    // Render inline text, then the nested list on a new line, cleanly closed
                    const compiledSublist = this.compileNode(sublist, isDarkTheme, indentLevel + 1);
                    return `${indent}<li>\n${indent}  ${textContent}\n${compiledSublist}\n${indent}</li>`;
                }
                return `${indent}<li>${textContent}</li>`;
            }
            // --- Inline Elements (indentLevel ignored) ---
            case "LINK":
                return `<a href="${node.url}">${this.compileInlineChildren(node, isDarkTheme)}</a>`;
            case "IMAGE":
                return `<img src="${node.url}" alt="${this.escapeHTML(node.alt || "")}" />`;
            case "BOLD":
                return `<b>${this.compileInlineChildren(node, isDarkTheme)}</b>`;
            case "ITALIC":
                return `<i>${this.compileInlineChildren(node, isDarkTheme)}</i>`;
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
