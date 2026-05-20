/**
 * @module utils
 * Pure utility functions. No side effects, no DOM assumptions, no imports.
 * Safe to import from any module without risk of circular dependencies.
 */

'use strict';

/**
 * Shorthand for document.querySelector.
 * @param {string} sel - CSS selector
 * @param {Element|Document} [ctx=document] - Optional search context
 * @returns {Element|null}
 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Shorthand for document.querySelectorAll, returned as a plain Array.
 * @param {string} sel - CSS selector
 * @param {Element|Document} [ctx=document] - Optional search context
 * @returns {Element[]}
 */
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/**
 * Convert ASCII digit string or number to Bengali (Bangla) numerals.
 * @example toBnDigits(12) → '১২'
 * @example toBnDigits('09') → '০৯'
 * @param {number|string} n
 * @returns {string}
 */
export function toBnDigits(n) {
    const BN = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(n).replace(/\d/g, d => BN[+d]);
}

/**
 * Show one <section class="sec"> and hide all others.
 * Scrolls to top after switching.
 * @param {string} id - CSS selector for the target section, e.g. '#sec-quiz'
 */
export function showSection(id) {
    $$('.sec').forEach(s => s.classList.remove('active'));
    $(id)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Interpolate {{placeholders}} in a template string.
 * Missing keys are replaced with an empty string.
 * @example interpolate('Hello {{name}}!', { name: 'রাফি' }) → 'Hello রাফি!'
 * @param {string} template
 * @param {Record<string, string>} vars
 * @returns {string}
 */
export function interpolate(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

/**
 * Resolve a locale-specific value from a locale-keyed object.
 * Falls back to 'bn' if the requested locale key is absent.
 * If the field is a plain string (not locale-keyed), returns it as-is.
 *
 * Works with string values, string arrays, and nested objects.
 *
 * @param {Record<string, any>|string|any[]} field
 * @param {string} locale - e.g. 'bn' or 'en'
 * @returns {any}
 *
 * @example
 * localize({ bn: 'তৈলাক্ত ত্বক', en: 'Oily Skin' }, 'bn') → 'তৈলাক্ত ত্বক'
 * localize({ bn: ['সমস্যা ১', 'সমস্যা ২'], en: ['Problem 1'] }, 'bn') → ['সমস্যা ১', 'সমস্যা ২']
 * localize('plain string', 'en') → 'plain string'
 */
export function localize(field, locale) {
    if (typeof field === 'string' || Array.isArray(field)) return field;
    if (field === null || field === undefined) return '';
    return field[locale] ?? field['bn'] ?? '';
}
