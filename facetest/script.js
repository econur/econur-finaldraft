/**
 * Eco-Nur Skin Type Quiz — script.js
 * ====================================
 * Application entry point and orchestrator.
 *
 * This file boots the application, loads all config files, wires all event
 * listeners, and coordinates between modules. It intentionally contains NO
 * business logic — all logic is delegated to the appropriate module.
 *
 * ─────────────────────────────────────────────────────────────
 * ⚙️  CONFIGURE BEFORE DEPLOYING — edit only these constants:
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/** Webhook URL that receives lead submissions (Cloudflare Worker → Google Sheets) */
const WEBHOOK_URL = 'https://webhook-receiver.sf56787-0d4.workers.dev/hook/facetest-submission';

/** Business WhatsApp number — digits only, country code first, no + or spaces */
const WHATSAPP_NUMBER = '8801XXXXXXXXX';

/** Default locale on page load. Switch to 'en' for English-first. */
const DEFAULT_LOCALE = 'bn';

/**
 * Card transition duration in milliseconds.
 * Must match the CSS animation duration on .q-card.is-exiting / .is-entering.
 */
const TRANSITION_MS = 220;

/* ==========================================================================
   IMPORTS
   ========================================================================== */

import { $, showSection }                                           from './modules/utils.js';
import { state, resetQuizState }                                    from './modules/state.js';
import { setLocale, t }                                             from './modules/i18n.js';
import { computeScores, computePrimaryType, computeSecondaryType }  from './modules/scoring.js';
import { computeVisibleQuestions }                                  from './modules/branching.js';
import { getRecommendedProductId }                                  from './modules/recommender.js';
import {
    renderProgress,
    renderQuestion,
    updateOptionSelection,
    initLeadGate,
    showLeadError,
    setLeadSubmitting,
    resetLeadForm,
    renderResult,
}                                                                   from './modules/renderer.js';
import { validateLead, buildPayload, submitToWebhook }              from './modules/lead.js';

/* ==========================================================================
   BASE PATH — resolved relative to this script file, not the HTML page.
   This is critical because the HTML is in the site root but this script
   lives in facetest/. fetch('./config/...') from the HTML page context
   would look in the wrong directory. import.meta.url always points to
   the script file's own location, giving the correct base.
   ========================================================================== */

/**
 * Directory URL of this script file (e.g. "https://eco-nur.com/facetest/").
 * All config fetches are resolved relative to this path.
 */
const _BASE = new URL('./', import.meta.url).href;

/* ==========================================================================
   CONFIG STORAGE — populated at boot, read-only after that
   ========================================================================== */

/** @type {Object[]} */ let QUESTIONS   = [];
/** @type {Object}   */ let PRODUCTS    = {};
/** @type {Object}   */ let RESULTS     = {};
/** @type {Object}   */ let RECO_CONFIG = {};

/* ==========================================================================
   BOOT
   Loads all JSON config files and locale strings in parallel, then inits.
   ========================================================================== */

async function boot() {
    try {
        // Load all config files AND locale in parallel using _BASE for correct paths.
        // setLocale() is used instead of loadLocale() so that all fetching stays
        // in one place (here) and i18n.js stays a pure store with no path logic.
        const [questionsData, productsData, resultsData, recoData, localeData] = await Promise.all([
            fetch(`${_BASE}config/questions.json`).then(r => r.json()),
            fetch(`${_BASE}config/products.json`).then(r => r.json()),
            fetch(`${_BASE}config/results.json`).then(r => r.json()),
            fetch(`${_BASE}config/recommendation.json`).then(r => r.json()),
            fetch(`${_BASE}config/i18n/${DEFAULT_LOCALE}.json`).then(r => r.json()),
        ]);

        setLocale(DEFAULT_LOCALE, localeData);

        QUESTIONS   = questionsData.questions;
        PRODUCTS    = productsData.products;
        RESULTS     = resultsData.skinTypes;
        RECO_CONFIG = recoData;

        init();

    } catch (err) {
        console.error('[Eco-Nur] Boot failed:', err);
        // Surface a minimal error message to avoid a silent blank page
        document.body.innerHTML += `<p style="color:red;padding:2rem">
            পেজ লোড হতে সমস্যা হচ্ছে। পেজ রিফ্রেশ করুন।
        </p>`;
    }
}

/* ==========================================================================
   INIT — Wire all event listeners
   ========================================================================== */

function init() {
    // Populate lead gate form labels and gender options from locale
    initLeadGate();

    // Clear any browser-autofilled values from a previous session
    const nameEl = $('#inp-name');
    const waEl   = $('#inp-wa');
    if (nameEl) nameEl.value = '';
    if (waEl)   waEl.value   = '';

    // --- Landing page ---
    $('#btn-start')?.addEventListener('click', startQuiz);
    $('#inp-landing-name')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') startQuiz();
    });

    // --- Quiz navigation ---
    $('#btn-next')?.addEventListener('click', goNext);
    $('#btn-prev')?.addEventListener('click', goPrev);

    // --- Lead gate ---
    $('#btn-lead-gate')?.addEventListener('click', submitLeadGate);
    $('#inp-wa')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitLeadGate();
    });

    // --- Result ---
    $('#btn-retake')?.addEventListener('click', resetQuiz);

    // --- Keyboard shortcuts ---
    document.addEventListener('keydown', handleKeyboard);
}

/* ==========================================================================
   QUIZ START
   ========================================================================== */

function startQuiz() {
    // Capture optional name from landing page input (if present)
    const landingName = $('#inp-landing-name')?.value.trim();
    state.userName = landingName || '';

    resetQuizState();

    // Compute initial visible question list (no answers yet, so no conditionals show)
    state.visibleQuestions = computeVisibleQuestions(QUESTIONS, state.answers);

    _renderCurrentQuestion();
    showSection('#sec-quiz');
}

/* ==========================================================================
   QUIZ NAVIGATION
   ========================================================================== */

function goNext() {
    const currentQId = state.visibleQuestions[state.currentQIndex];

    // Guard: must have answered the current question
    if (!state.answers[currentQId]) return;

    if (state.currentQIndex < state.visibleQuestions.length - 1) {
        // Advance to the next question with an animated transition
        _transitionCard(() => {
            state.currentQIndex++;
            // Re-evaluate branching after each answer — may reveal/hide conditional questions
            state.visibleQuestions = computeVisibleQuestions(QUESTIONS, state.answers);
            _renderCurrentQuestion();
        });
    } else {
        // Last question answered — advance to lead gate
        showSection('#sec-lead-gate');
    }
}

function goPrev() {
    if (state.currentQIndex > 0) {
        _transitionCard(() => {
            state.currentQIndex--;
            _renderCurrentQuestion();
        });
    }
}

/* ==========================================================================
   OPTION SELECTION
   ========================================================================== */

/**
 * Record the user's selection and update the UI immediately.
 * Also re-evaluates branching in case this answer opens a conditional question.
 * @param {string} optionId
 */
function selectOption(optionId) {
    const currentQId              = state.visibleQuestions[state.currentQIndex];
    state.answers[currentQId]     = optionId;

    // Re-evaluate which questions are visible — this answer may trigger branching
    state.visibleQuestions = computeVisibleQuestions(QUESTIONS, state.answers);

    // Update option selection visually (no full re-render needed)
    updateOptionSelection(optionId);
}

/* ==========================================================================
   LEAD GATE SUBMISSION
   ========================================================================== */

async function submitLeadGate() {
    const name   = $('#inp-name')?.value.trim()   ?? '';
    const gender = $('#inp-gender')?.value         ?? '';
    const wa     = $('#inp-wa')?.value.trim()      ?? '';

    // Validate — show error and stop if invalid
    const error = validateLead(name, gender, wa, t);
    if (error) {
        showLeadError(error.message, $(error.focusSelector));
        return;
    }

    // Persist to state
    state.userName = name;
    state.gender   = gender;
    state.waNumber = wa;

    // Put button in loading state to prevent double-submission
    setLeadSubmitting();

    // --- Compute results (done exactly once, here) ---
    state.scores             = computeScores(state.answers, QUESTIONS);
    state.primaryType        = computePrimaryType(state.scores, RECO_CONFIG.tieBreakingPriority);
    state.secondaryType      = computeSecondaryType(
                                   state.scores,
                                   state.primaryType,
                                   RECO_CONFIG.tieBreakingPriority,
                                   RECO_CONFIG.secondaryTypeThreshold
                               );
    state.recommendedProductId = getRecommendedProductId(state.primaryType, state.answers, RECO_CONFIG);

    // --- Build and fire webhook payload (non-blocking, fire-and-forget) ---
    const product         = PRODUCTS[state.recommendedProductId];
    const skinTypeProfile = RESULTS[state.primaryType];

    const payload = buildPayload({
        name,
        gender,
        whatsapp:     wa,
        skinTypeKey:  state.primaryType,
        skinTypeName: skinTypeProfile?.name?.bn ?? state.primaryType,
        productId:    state.recommendedProductId,
        productName:  product?.name?.bn ?? state.recommendedProductId,
        answers:      state.answers,
    }, QUESTIONS);

    submitToWebhook(WEBHOOK_URL, payload); // intentionally not awaited

    // --- Show results ---
    showResults();
}

/* ==========================================================================
   RESULT RENDERING
   ========================================================================== */

function showResults() {
    const skinTypeProfile  = RESULTS[state.primaryType];
    const secondaryProfile = state.secondaryType ? RESULTS[state.secondaryType] : null;
    const product          = PRODUCTS[state.recommendedProductId];

    if (!skinTypeProfile || !product) {
        console.error('[Eco-Nur] Missing result data:', { skinTypeProfile, product });
        return;
    }

    renderResult(
        skinTypeProfile,
        secondaryProfile,
        product,
        state.userName,
        WHATSAPP_NUMBER,
        RECO_CONFIG
    );

    showSection('#sec-result');
}

/* ==========================================================================
   QUIZ RESET
   ========================================================================== */

function resetQuiz() {
    resetQuizState();
    resetLeadForm();
    showSection('#sec-landing');
}

/* ==========================================================================
   KEYBOARD SHORTCUTS
   ========================================================================== */

/**
 * Keyboard navigation for the quiz section:
 *  → / ↓   : advance to next question (if answered)
 *  ← / ↑   : go back to previous question
 *  1–7     : quickly select option by number
 */
function handleKeyboard(e) {
    const activeSection = document.querySelector('.sec.active');
    if (!activeSection || activeSection.id !== 'sec-quiz') return;

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            e.preventDefault();
            if (!$('#btn-next')?.disabled) goNext();
            break;

        case 'ArrowLeft':
        case 'ArrowUp':
            e.preventDefault();
            goPrev();
            break;

        default: {
            // Numeric shortcut keys (1–7) select the corresponding option
            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= 7) {
                const questionId = state.visibleQuestions[state.currentQIndex];
                const question   = QUESTIONS.find(q => q.id === questionId);
                const target     = question?.options[num - 1];
                if (target) selectOption(target.id);
            }
        }
    }
}

/* ==========================================================================
   PRIVATE HELPERS
   ========================================================================== */

/**
 * Render the question at the current state index.
 */
function _renderCurrentQuestion() {
    const questionId = state.visibleQuestions[state.currentQIndex];
    const question   = QUESTIONS.find(q => q.id === questionId);
    if (!question) return;

    const selectedOptionId = state.answers[questionId] ?? null;
    const isLast = state.currentQIndex === state.visibleQuestions.length - 1;

    renderProgress(state.currentQIndex, state.visibleQuestions.length);

    renderQuestion(
        question,
        state.currentQIndex + 1,
        state.visibleQuestions.length,
        selectedOptionId,
        isLast,
        selectOption        // pass the selectOption callback into the renderer
    );
}

/**
 * Animate the question card out, run a callback to update state,
 * then animate the new card in. Keeps the animation decoupled from navigation logic.
 *
 * @param {Function} callback - State mutation to run during the "invisible" gap
 */
function _transitionCard(callback) {
    const card = $('#q-card');
    if (!card) { callback(); return; }

    card.classList.add('is-exiting');

    setTimeout(() => {
        card.classList.remove('is-exiting');
        callback();

        // Double rAF ensures the 'is-entering' class is applied after the browser
        // has processed the class removal (avoids the browser skipping the transition)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.classList.add('is-entering');
                setTimeout(() => card.classList.remove('is-entering'), TRANSITION_MS);
            });
        });
    }, TRANSITION_MS);
}

/* ==========================================================================
   BOOT ON DOM READY
   ========================================================================== */

document.addEventListener('DOMContentLoaded', boot);
