import * as fs from "node:fs";
import * as path from "node:path";
import Tokenizer from "../Tokenizer.js";
import Parser from "../Parser.js";
import Compiler from "../Compiler.js";
import { wrapHTMLDocument } from "./htmlTemplate.js";
import { ALLOWED_FORMATS } from "./pathResolver.js";
/**
 * Helper to dynamically load Puppeteer safely
 */
async function loadPuppeteer() {
    try {
        const puppeteer = await import("puppeteer");
        console.log(`Puppeteer loaded successfully.`);
        return puppeteer.default || puppeteer;
    }
    catch (err) {
        throw new Error(`\n❌ Puppeteer is required for exporting to PDF or Image formats.\n` +
            `👉 Please install it by running: npm install puppeteer\n`);
    }
}
/**
 * Main conversion pipeline supporting HTML, PDF, and Image formats.
 */
export async function convertMarkdown(inputPath, outputPath, format = "html") {
    const normalizedFormat = format.toLowerCase();
    if (!ALLOWED_FORMATS.includes(normalizedFormat)) {
        console.error(`\n❌ Error: Unsupported output format "${format}".\n` +
            `👉 Allowed formats are: ${ALLOWED_FORMATS.map((f) => `"${f}"`).join(", ")}.\n`);
        return;
    }
    const validFormat = normalizedFormat;
    try {
        const sourcePath = path.resolve(inputPath);
        const destinationPath = path.resolve(outputPath);
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Input file not found: ${sourcePath}`);
        }
        const markdownContent = fs.readFileSync(sourcePath, "utf-8");
        // 1. Run Compiler Pipeline
        const tokenizer = new Tokenizer();
        const parser = new Parser(tokenizer);
        const compiler = new Compiler();
        const { ast, warnings: parseWarnings } = parser.parse(markdownContent);
        const { html, metadata, warnings: compileWarnings, } = compiler.compile(ast);
        const allWarnings = [...parseWarnings, ...compileWarnings];
        if (allWarnings.length > 0) {
            console.warn("⚠️ Warnings during compilation:", allWarnings);
        }
        // 2. Generate Complete HTML Shell
        const fullHTML = wrapHTMLDocument(html, metadata);
        // 3. Handle File Emission
        switch (validFormat) {
            case "pdf": {
                console.log(`Rendering PDF to: ${destinationPath}`);
                const puppeteer = await loadPuppeteer();
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ["--no-sandbox", "--disable-setuid-sandbox"],
                });
                const page = await browser.newPage();
                await page.setContent(fullHTML, {
                    waitUntil: "load",
                });
                await page.pdf({
                    path: destinationPath,
                    format: "A4",
                    printBackground: true,
                    margin: {
                        top: "20mm",
                        bottom: "20mm",
                        left: "15mm",
                        right: "15mm",
                    },
                });
                await browser.close();
                break;
            }
            case "image": {
                console.log(`Rendering Screenshot/Image to: ${destinationPath}`);
                const puppeteer = await loadPuppeteer();
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ["--no-sandbox", "--disable-setuid-sandbox"],
                });
                const page = await browser.newPage();
                await page.setViewport({
                    width: 1000,
                    height: 800,
                    deviceScaleFactor: 3,
                });
                await page.setContent(fullHTML, {
                    waitUntil: "load",
                });
                await page.screenshot({
                    path: destinationPath,
                    fullPage: true,
                });
                await browser.close();
                break;
            }
            case "html": {
                fs.writeFileSync(destinationPath, fullHTML, "utf-8");
                break;
            }
        }
        console.log(`✅ [${format.toUpperCase()}] Successfully generated: ${destinationPath}`);
    }
    catch (error) {
        console.error("❌ Conversion failed:", error);
    }
}
