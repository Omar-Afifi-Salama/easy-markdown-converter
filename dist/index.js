#!/usr/bin/env node
import { resolveCliPaths } from "./utils/pathResolver.js";
import { convertMarkdown } from "./utils/converter.js";
const args = process.argv.slice(2);
const { inputFile, outputFile, outputFormat } = resolveCliPaths(args[0], args[1], args[2]);
console.log(`\n📄 Input:   ${inputFile}`);
console.log(`🎯 Output:  ${outputFile}`);
console.log(`⚙️  Format:  ${outputFormat.toUpperCase()}\n`);
convertMarkdown(inputFile, outputFile, outputFormat);
