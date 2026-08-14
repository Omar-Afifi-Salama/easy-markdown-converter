const NAMED_COLORS: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    gray: "#808080",
    darkgray: "#a9a9a9",
    lightgray: "#d3d3d3",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    navy: "#000080",
    teal: "#008080",
    purple: "#800080",
};

/**
 * Parses hex (#fff, #ffffff), rgb, or named colors into RGB channels [r, g, b].
 */
export function parseColorToRgb(colorStr?: string): [number, number, number] {
    if (!colorStr) return [255, 255, 255]; // default white

    let color = colorStr.trim().toLowerCase();
    if (NAMED_COLORS[color]) color = NAMED_COLORS[color]!;

    // #RGB
    if (/^#[0-9a-f]{3}$/i.test(color)) {
        const r = parseInt(color[1]! + color[1]!, 16);
        const g = parseInt(color[2]! + color[2]!, 16);
        const b = parseInt(color[3]! + color[3]!, 16);
        return [r, g, b];
    }

    // #RRGGBB
    if (/^#[0-9a-f]{6}$/i.test(color)) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return [r, g, b];
    }

    // rgb(r, g, b)
    const rgbMatch = color.match(
        /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
    );
    if (rgbMatch) {
        return [
            parseInt(rgbMatch[1]!, 10),
            parseInt(rgbMatch[2]!, 10),
            parseInt(rgbMatch[3]!, 10),
        ];
    }

    return [255, 255, 255];
}

/**
 * Returns true if the color is dark using perceived brightness luminance formula.
 */
export function isDarkColor(colorStr?: string): boolean {
    const [r, g, b] = parseColorToRgb(colorStr);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 140;
}
