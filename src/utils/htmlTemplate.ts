import type { Metadata } from "../types.js";
import { isDarkColor } from "./colorUtils.js";

/**
 * Builds HTML <meta> tags from frontmatter metadata,
 * excluding CSS layout and title keys.
 */
export function buildMetaTags(metadata: Metadata): string {
    const reservedKeys = new Set([
        "title",
        "bgColor",
        "textColor",
        "fontSize",
        "fontFamily",
        "headingColor",
        "lineHeight",
        "maxWidth",
        "codeBg",
        "codeTextColor",
        "codeBorderColor",
        "codeTheme",
        "tableBorderColor",
        "tableHeaderBg",
        "hrColor",
    ]);
    const tags: string[] = [];

    for (const [key, value] of Object.entries(metadata)) {
        if (!reservedKeys.has(key) && value) {
            tags.push(`    <meta name="${key}" content="${value}">`);
        }
    }

    return tags.length > 0 ? tags.join("\n") + "\n" : "";
}

/**
 * Wraps body HTML in a complete styled document with dynamic metadata.
 */
export function wrapHTMLDocument(
    htmlContent: string,
    metadata: Metadata,
): string {
    const metaTags = buildMetaTags(metadata);

    // 1. Detect if the background is dark or light
    const isDark = isDarkColor(metadata.bgColor || "#ffffff");

    // 2. Computed Defaults based on dark/light background
    const defaultBg = isDark ? "#1e1e2e" : "#ffffff";
    const defaultText = isDark ? "#cdd6f4" : "#24292f";
    const defaultHeading = isDark ? "#cdd6f4" : "#1f2328";

    // Code block background and border defaults
    const defaultCodeBg = isDark ? "rgba(0, 0, 0, 0.35)" : "#f6f8fa";
    const defaultCodeText = isDark ? "#e6edf3" : "#24292f";
    const defaultCodeBorder = isDark ? "#45475a" : "#d0d7de";

    // Table and HR defaults
    const defaultTableBorder = isDark ? "#45475a" : "#d0d7de";
    const defaultTableHeaderBg = isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.03)";
    const defaultHrColor = isDark ? "#45475a" : "#d0d7de";

    // 3. User Frontmatter Values (or fallbacks)
    const bgColor = metadata.bgColor || defaultBg;
    const textColor = metadata.textColor || defaultText;
    const headingColor = metadata.headingColor || defaultHeading;
    const fontSize = metadata.fontSize || "16px";
    const fontFamily =
        metadata.fontFamily ||
        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const lineHeight = metadata.lineHeight || "1.6";
    const maxWidth = metadata.maxWidth || "800px";

    const codeBg = metadata.codeBg || defaultCodeBg;
    const codeTextColor = metadata.codeTextColor || defaultCodeText;
    const codeBorderColor = metadata.codeBorderColor || defaultCodeBorder;

    const tableBorderColor = metadata.tableBorderColor || defaultTableBorder;
    const tableHeaderBg = metadata.tableHeaderBg || defaultTableHeaderBg;
    const hrColor = metadata.hrColor || defaultHrColor;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title || "Document"}</title>
${metaTags}    <style>
            body {
                background-color: ${bgColor};
                color: ${textColor};
                font-size: ${fontSize};
                font-family: ${fontFamily};
                line-height: ${lineHeight};
                padding: 2rem;
                max-width: ${maxWidth};
                margin: 0 auto;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }

            h1, h2, h3, h4, h5, h6 {
                color: ${headingColor};
                margin: 1.5em 0 0.5em;
            }

            /* Inline Code */
            :not(pre) > code {
                background-color: ${codeBg};
                color: ${codeTextColor};
                border: 1px solid ${codeBorderColor};
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
                font-size: 0.9em;
            }

            /* Fenced Code Block Box & Header */
            .code-block-wrapper {
                margin: 1.5rem 0;
                border-radius: 8px;
                border: 1px solid ${codeBorderColor};
                background-color: ${codeBg};
                overflow: hidden;
            }

            .code-header {
                display: flex;
                justify-content: flex-end;
                padding: 0.35rem 0.85rem;
                background: rgba(0, 0, 0, 0.15);
                border-bottom: 1px solid ${codeBorderColor};
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                opacity: 0.7;
                color: ${codeTextColor};
                user-select: none;
            }

            /* 🟢 Code content inside block: Wraps cleanly without horizontal overflow */
            .code-block-wrapper pre {
                margin: 0;
                padding: 1rem 1.25rem;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
                font-size: 0.9em;
                line-height: 1.5;
                white-space: pre-wrap;       /* Wraps code lines */
                word-break: break-word;      /* Breaks long words/URLs */
            }

            .code-block-wrapper pre code {
                background: transparent;
                border: none;
                padding: 0;
                color: inherit;
                font: inherit;
            }

            /* Tables & Rules */
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 1.5rem 0;
                table-layout: fixed;         /* Prevents table overflow */
                word-break: break-word;
            }

            th, td {
                border: 1px solid ${tableBorderColor};
                padding: 8px 12px;
            }

            th {
                background-color: ${tableHeaderBg};
            }

            hr {
                border: 0;
                border-top: 1px solid ${hrColor};
                margin: 2rem 0;
            }

            /* PDF / Print Optimization */
            @media print {
                .code-block-wrapper, table, tr, img {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                }
                h1, h2, h3, h4, h5, h6 {
                    break-after: avoid !important;
                    page-break-after: avoid !important;
                }
                /* Avoid orphaned single lines at top/bottom of pages */
                p, li {
                    orphans: 3;
                    widows: 3;
                }
            }
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}
