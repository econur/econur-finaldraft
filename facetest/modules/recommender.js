/**
 * @module recommender
 * Product recommendation engine.
 *
 * Applies answer-level override rules before falling back to the default
 * skin-type → product mapping. Fully driven by recommendation.json — no
 * product logic is hardcoded in JS.
 *
 * Decision flow:
 *  1. Check each answerOverride rule in order — first matching rule wins.
 *  2. If no override matched, use primaryMapping[primaryType].
 *  3. If primaryMapping has no entry for the type, use customFallback.
 */

'use strict';

/* --------------------------------------------------------------------------
   Recommendation Engine
   -------------------------------------------------------------------------- */

/**
 * Determine the recommended product ID for a completed quiz.
 *
 * @param {string}                 primaryType - Computed primary skin type key (e.g. 'O', 'D')
 * @param {Record<string, string>} answers     - All answers { questionId: optionId }
 * @param {Object}                 config      - Full recommendation.json contents
 * @returns {string} Product ID (key into products.json)
 */
export function getRecommendedProductId(primaryType, answers, config) {
    const { primaryMapping, answerOverrides, customFallback } = config;

    // --- Step 1: Answer-level overrides (first match wins) ---
    for (const rule of answerOverrides) {
        const { triggerAnswer, appliesWhenPrimaryIs, overrideProduct, id } = rule;

        // Was this specific option selected anywhere in the answers?
        const wasTriggered = Object.values(answers).includes(triggerAnswer);
        if (!wasTriggered) continue;

        // Does this rule apply to the computed primary type?
        if (!appliesWhenPrimaryIs.includes(primaryType)) continue;

        // Match — override applies
        return overrideProduct;
    }

    // --- Step 2: Default primary mapping ---
    if (primaryMapping[primaryType]) {
        return primaryMapping[primaryType];
    }

    // --- Step 3: Custom fallback (no mapping found) ---
    return customFallback;
}
