import { utils as PixiUtils } from 'pixi.js';

/**
 * Convert a hex string value to a hex value
 */
export const toHex = (color: string): number => PixiUtils.string2hex(color.trim());

/**
 * Load a css variable
 *
 * @param key : name of the variable without '--'
 */
export const CSSVar = (key: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${key}`);
