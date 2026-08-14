import * as path from "node:path";
import * as fs from "node:fs";
export const ALLOWED_FORMATS = ["html", "pdf", "image"];
/**
 * Type guard to safely check if an arbitrary string is an OutputFormat
 */
export function isOutputFormat(format) {
    return ALLOWED_FORMATS.includes(format);
}
export function resolveCliPaths(rawInput, rawOutput, rawFormat) {
    let input = rawInput || "input";
    if (!path.extname(input)) {
        input += ".md";
    }
    const inputParsed = path.parse(input);
    const baseName = inputParsed.name;
    // 1. Determine requested format string
    let candidateFormat = "html";
    if (rawOutput && isOutputFormat(rawOutput.toLowerCase())) {
        candidateFormat = rawOutput.toLowerCase();
        rawOutput = undefined;
    }
    else if (rawFormat) {
        candidateFormat = rawFormat.toLowerCase();
    }
    else if (rawOutput) {
        const ext = path.extname(rawOutput).toLowerCase();
        if (ext === ".pdf")
            candidateFormat = "pdf";
        else if ([".png", ".jpg", ".jpeg"].includes(ext))
            candidateFormat = "image";
        else if (ext === ".html")
            candidateFormat = "html";
    }
    // 2. Validate format using Type Guard
    const isValidFormat = isOutputFormat(candidateFormat);
    const outputFormat = isValidFormat
        ? candidateFormat
        : "html";
    // 3. Resolve target extension
    const targetExtension = candidateFormat === "pdf"
        ? ".pdf"
        : candidateFormat === "image"
            ? ".png"
            : ".html";
    // 4. Resolve Output Destination
    let output = rawOutput;
    if (!output) {
        output = path.join(inputParsed.dir || ".", `${baseName}${targetExtension}`);
    }
    else if (fs.existsSync(output) && fs.statSync(output).isDirectory()) {
        output = path.join(output, `${baseName}${targetExtension}`);
    }
    else if (!path.extname(output)) {
        output += targetExtension;
    }
    return {
        inputFile: input,
        outputFile: output,
        outputFormat,
        isValidFormat,
    };
}
