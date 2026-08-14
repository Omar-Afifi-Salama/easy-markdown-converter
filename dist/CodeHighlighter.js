// Dark Theme (OneDark / Catppuccin)
const DARK_THEME = {
    keyword: "#c678dd", // Purple
    string: "#98c379", // Soft Green
    number: "#d19a66", // Orange
    comment: "#7f848e", // Muted Gray
    function: "#61afef", // Soft Blue
    operator: "#56b6c2", // Cyan
    boolean: "#e5c07b", // Gold
};
// Light Theme (GitHub / One Light)
const LIGHT_THEME = {
    keyword: "#d73a49", // Red / Berry
    string: "#032f62", // Deep Navy
    number: "#005cc5", // Blue
    comment: "#6a737d", // Soft Gray
    function: "#6f42c1", // Deep Purple
    operator: "#d73a49", // Red
    boolean: "#005cc5", // Blue
};
function getRules(isDark) {
    const theme = isDark ? DARK_THEME : LIGHT_THEME;
    return [
        {
            type: "comment",
            regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/,
            color: theme.comment,
        },
        {
            type: "string",
            regex: /^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/,
            color: theme.string,
        },
        { type: "number", regex: /^\b\d+(\.\d+)?\b/, color: theme.number },
        {
            type: "boolean",
            regex: /\b(true|false|null|undefined)\b/,
            color: theme.boolean,
        },
        {
            type: "keyword",
            regex: /\b(const|let|var|function|return|if|else|for|while|import|export|from|default|class|type|interface|extends|implements|new|async|await|try|catch|def|elif|echo)\b/,
            color: theme.keyword,
        },
        {
            type: "function",
            regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/,
            color: theme.function,
        },
        {
            type: "operator",
            regex: /^(=>|===|!==|==|!=|<=|>=|\+|-|\*|\/|%|=|&&|\|\||!)/,
            color: theme.operator,
        },
    ];
}
export function highlightCode(code, isDark) {
    let result = "";
    let cursor = 0;
    const rules = getRules(isDark);
    function escapeHTML(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
    while (cursor < code.length) {
        let matched = false;
        for (const rule of rules) {
            rule.regex.lastIndex = 0;
            const match = rule.regex.exec(code.slice(cursor));
            if (match && match.index === 0 && match[0].length > 0) {
                const text = escapeHTML(match[0]);
                const isComment = rule.type === "comment";
                result += `<span style="color: ${rule.color};${isComment ? " font-style: italic;" : ""}">${text}</span>`;
                cursor += match[0].length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            result += escapeHTML(code[cursor]);
            cursor++;
        }
    }
    return result;
}
