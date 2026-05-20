/**
 * @module scoring
 * Skin type scoring engine.
 *
 * Responsible for:
 *  1. Accumulating weighted scores from the user's answered options
 *  2. Determining the primary skin type (highest score + priority tie-breaking)
 *  3. Determining the secondary skin type (runner-up, only if above threshold)
 *
 * This module is purely functional — it takes data in and returns data out.
 * No state mutations, no DOM, no imports beyond utils.
 */

'use strict';

/** All valid skin type score keys. Must match keys used in questions.json scores objects. */
export const SKIN_TYPE_KEYS = ['O', 'D', 'C', 'S', 'A', 'N', 'X'];

/* --------------------------------------------------------------------------
   Score Computation
   -------------------------------------------------------------------------- */

/**
 * Accumulate weighted scores from all answered questions.
 *
 * Walks through each answered question, finds the selected option,
 * and adds that option's scores to the running totals.
 *
 * @param {Record<string, string>} answers   - { questionId: selectedOptionId }
 * @param {Object[]}               questions - Question config array from questions.json
 * @returns {Record<string, number>} - e.g. { O: 5, D: 2, C: 3, S: 1, A: 7, N: 0, X: 0 }
 */
export function computeScores(answers, questions) {
    // Start all types at zero
    const scores = Object.fromEntries(SKIN_TYPE_KEYS.map(k => [k, 0]));

    for (const [questionId, optionId] of Object.entries(answers)) {
        const question = questions.find(q => q.id === questionId);
        if (!question) continue;

        const option = question.options.find(o => o.id === optionId);
        if (!option?.scores) continue;

        for (const [typeKey, weight] of Object.entries(option.scores)) {
            if (typeKey in scores) {
                scores[typeKey] += weight;
            }
        }
    }

    return scores;
}

/* --------------------------------------------------------------------------
   Primary Type
   -------------------------------------------------------------------------- */

/**
 * Determine the primary (winning) skin type from computed scores.
 *
 * Tie-breaking: when multiple types share the maximum score, the one
 * that appears earliest in `tieBreakingPriority` wins. This priority
 * is defined in recommendation.json so it can be changed without code edits.
 *
 * @param {Record<string, number>} scores              - Output of computeScores()
 * @param {string[]}               tieBreakingPriority - e.g. ['A','S','O','C','D','X','N']
 * @returns {string} Winning skin type key
 */
export function computePrimaryType(scores, tieBreakingPriority) {
    const maxScore = Math.max(...Object.values(scores));

    // If all scores are zero (shouldn't happen in practice), default to last priority item
    if (maxScore === 0) {
        return tieBreakingPriority[tieBreakingPriority.length - 1] ?? 'N';
    }

    // Among all types tied at the max score, pick the highest-priority one
    const winner = tieBreakingPriority.find(k => scores[k] === maxScore);
    return winner ?? 'N';
}

/* --------------------------------------------------------------------------
   Secondary Type
   -------------------------------------------------------------------------- */

/**
 * Determine the secondary skin type (if meaningful).
 *
 * The secondary type is the second-highest-scoring type, but only
 * displayed if its score reaches a minimum fraction of the primary
 * score (the threshold). This prevents showing a weak/noise signal
 * as a meaningful "secondary trait."
 *
 * @example
 * scores = { A: 10, O: 9, D: 2 }, threshold = 0.65
 * primary = 'A', minScore = 10 * 0.65 = 6.5
 * O (9) >= 6.5 → secondary = 'O'
 * D (2) < 6.5 → not shown
 *
 * @param {Record<string, number>} scores              - Output of computeScores()
 * @param {string}                 primaryType         - The already-computed primary type key
 * @param {string[]}               tieBreakingPriority
 * @param {number}                 threshold           - Fraction of primary score, e.g. 0.65
 * @returns {string|null} Secondary type key, or null if no meaningful runner-up
 */
export function computeSecondaryType(scores, primaryType, tieBreakingPriority, threshold) {
    const primaryScore = scores[primaryType] ?? 0;
    if (primaryScore === 0) return null;

    const minScore = primaryScore * threshold;

    // Find the highest-priority type that isn't the primary and meets the threshold
    const secondary = tieBreakingPriority.find(
        k => k !== primaryType && (scores[k] ?? 0) >= minScore
    );

    return secondary ?? null;
}
