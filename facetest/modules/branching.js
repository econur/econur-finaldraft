/**
 * @module branching
 * Conditional question visibility engine.
 *
 * Computes which questions are currently visible based on:
 *  - The showIf rules declared in each question in questions.json
 *  - The user's current answers
 *
 * Called after every answer to update the visible question list, so that
 * conditional questions appear and disappear dynamically.
 *
 * showIf rule schema (from questions.json):
 * {
 *   type: 'anySignal',           // rule type
 *   questions: ['q1', 'q2'],    // which previously-answered questions to inspect
 *   signals: ['oily', 'combo']  // if any of these signals appear in those answers → show
 * }
 *
 * To add new rule types: add a case in isQuestionVisible() below.
 */

'use strict';

/* --------------------------------------------------------------------------
   Single Question Visibility Check
   -------------------------------------------------------------------------- */

/**
 * Determine whether a single question should be shown given current answers.
 *
 * @param {Object}                question     - Question config object (from questions.json)
 * @param {Record<string, string>} answers     - Current answers { questionId: optionId }
 * @param {Object[]}              allQuestions - Full question array (needed to look up option signals)
 * @returns {boolean}
 */
export function isQuestionVisible(question, answers, allQuestions) {
    // No condition — always visible
    if (!question.showIf) return true;

    const { type, questions: watchedQIds, signals: requiredSignals } = question.showIf;

    if (type === 'anySignal') {
        /*
         * Rule: show this question if ANY of the watched questions has been answered
         * with an option that carries ANY of the required signals.
         *
         * Example: show q3 if q1 or q2 was answered with an 'oily' or 'combination' option.
         */
        return watchedQIds.some(qId => {
            const answeredOptionId = answers[qId];
            if (!answeredOptionId) return false; // question hasn't been answered yet

            const watchedQuestion = allQuestions.find(q => q.id === qId);
            if (!watchedQuestion) return false;

            const answeredOption = watchedQuestion.options.find(o => o.id === answeredOptionId);
            if (!answeredOption?.signals) return false;

            return answeredOption.signals.some(sig => requiredSignals.includes(sig));
        });
    }

    // Unknown rule type — default to visible and warn
    console.warn(`[branching] Unknown showIf type: "${type}" on question "${question.id}". Defaulting to visible.`);
    return true;
}

/* --------------------------------------------------------------------------
   Full Visible Question List
   -------------------------------------------------------------------------- */

/**
 * Compute the complete ordered list of visible question IDs for the current state.
 *
 * Should be called:
 *  1. When the quiz starts (answers = {}, computes initial visible set)
 *  2. After every answer (branching may open or close conditional questions)
 *
 * The returned array preserves the original question order from questions.json.
 *
 * @param {Object[]}               allQuestions - Full question array from questions.json
 * @param {Record<string, string>} answers      - Current answers { questionId: optionId }
 * @returns {string[]} Ordered array of visible question IDs
 */
export function computeVisibleQuestions(allQuestions, answers) {
    return allQuestions
        .filter(q => isQuestionVisible(q, answers, allQuestions))
        .map(q => q.id);
}
