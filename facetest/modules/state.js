/**
 * @module state
 * Centralized application state — the single source of truth for the quiz.
 *
 * All quiz data flows through this object. No module should store its own
 * copy of quiz state. To read state: import and read. To write: import and
 * assign. For a larger app, replace direct assignments with setter functions.
 *
 * @typedef {Object} AppState
 * @property {string}                    lang                - Active locale key ('bn' | 'en')
 * @property {string}                    userName            - User's display name
 * @property {string}                    gender              - User's gender ('female'|'male'|'other')
 * @property {string}                    waNumber            - User's WhatsApp number
 * @property {number}                    currentQIndex       - 0-based index into visibleQuestions[]
 * @property {string[]}                  visibleQuestions    - Ordered IDs of currently visible questions
 * @property {Record<string, string>}    answers             - { questionId: selectedOptionId }
 * @property {Record<string, number>}    scores              - Accumulated skin type scores { O, D, C, S, A, N, X }
 * @property {string|null}               primaryType         - Winning skin type key
 * @property {string|null}               secondaryType       - Runner-up skin type key, or null
 * @property {string|null}               recommendedProductId - Product id from recommender
 */

'use strict';

export const state = {
    lang:                 'bn',
    userName:             '',
    gender:               '',
    waNumber:             '',
    currentQIndex:        0,
    visibleQuestions:     [],
    answers:              {},
    scores:               {},
    primaryType:          null,
    secondaryType:        null,
    recommendedProductId: null,
};

/**
 * Reset all quiz-related fields back to their initial values.
 * Preserves language preference.
 * Called when the user retakes the quiz.
 */
export function resetQuizState() {
    state.userName             = '';
    state.gender               = '';
    state.waNumber             = '';
    state.currentQIndex        = 0;
    state.visibleQuestions     = [];
    state.answers              = {};
    state.scores               = {};
    state.primaryType          = null;
    state.secondaryType        = null;
    state.recommendedProductId = null;
}
