/**
 * @module i18n
 * Lightweight localization engine.
 *
 * Exposes:
 *  - setLocale(lang, strings)   — activate a locale from a pre-loaded strings object
 *  - t(keyPath, vars?)          — resolve a dot-notation string key with optional interpolation
 *  - getLocaleValue(keyPath)    — resolve any key (including arrays/objects)
 *  - getLocale()                — returns current locale string
 *
 * NOTE: This module does NOT fetch locale files itself. All fetching is done
 * in script.js using import.meta.url for correct path resolution, then the
 * loaded strings object is passed in via setLocale(). This keeps i18n.js as
 * a pure store/accessor with no URL or network concerns.
 *
 * Falls back gracefully: missing keys return the key path itself (visible in
 * the UI as a signal that a translation is missing, rather than crashing).
 */

'use strict';

import { interpolate } from './utils.js';

/** @type {Record<string, any>} The active locale strings object */
let _strings = {};

/** @type {string} */
let _currentLocale = 'bn';

/* --------------------------------------------------------------------------
   Activation
   -------------------------------------------------------------------------- */

/**
 * Activate a locale from a pre-loaded strings object.
 * Call this once at boot after fetching the JSON in script.js.
 *
 * @param {string}             lang    - e.g. 'bn' or 'en'
 * @param {Record<string,any>} strings - The parsed JSON locale object
 */
export function setLocale(lang, strings) {
    _currentLocale = lang;
    _strings       = strings;
}

/* --------------------------------------------------------------------------
   Accessors
   -------------------------------------------------------------------------- */

/**
 * Return the currently active locale key.
 * @returns {string}
 */
export function getLocale() {
    return _currentLocale;
}

/**
 * Resolve a dot-notation key to a string from the active locale.
 * Supports {{placeholder}} interpolation via the second argument.
 *
 * @example t('ui.next') → 'পরবর্তী'
 * @example t('result.headline', { name: 'রাফি' }) → 'রাফি, আপনার ত্বকের...'
 *
 * @param {string}                  keyPath - e.g. 'leadGate.errors.nameRequired'
 * @param {Record<string, string>}  [vars={}]
 * @returns {string}
 */
export function t(keyPath, vars = {}) {
    const value = _resolvePath(keyPath);

    if (value === undefined) {
        console.warn(`[i18n] Missing key: "${keyPath}" in locale "${_currentLocale}"`);
        return keyPath; // visible fallback — signals a missing translation
    }

    if (typeof value !== 'string') {
        console.warn(`[i18n] Key "${keyPath}" is not a string. Use getLocaleValue() for arrays/objects.`);
        return JSON.stringify(value);
    }

    return Object.keys(vars).length ? interpolate(value, vars) : value;
}

/**
 * Resolve a dot-notation key to its raw value (string, array, or object).
 * Use this when you need non-string locale values such as the gender options array.
 *
 * @example getLocaleValue('leadGate.genderOptions')
 *          → [{ value: 'female', label: 'মহিলা' }, ...]
 *
 * @param {string} keyPath
 * @returns {any}
 */
export function getLocaleValue(keyPath) {
    return _resolvePath(keyPath);
}

/* --------------------------------------------------------------------------
   Private
   -------------------------------------------------------------------------- */

/**
 * Walk the locale object by dot-separated path.
 * @param {string} keyPath
 * @returns {any}
 */
function _resolvePath(keyPath) {
    return keyPath.split('.').reduce((obj, key) => obj?.[key], _strings);
}
