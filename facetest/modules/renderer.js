/**
 * @module renderer
 * All DOM rendering for Eco-Nur Skin Quiz.
 *
 * This module owns every write to the DOM. It receives plain data objects
 * as arguments and never reads from global state directly. This keeps it
 * testable, predictable, and easy to reason about.
 *
 * Sections rendered:
 *  - renderProgress()     — quiz progress bar and counter
 *  - renderQuestion()     — question card with options
 *  - updateOptionSelection() — fast selection update without full re-render
 *  - initLeadGate()       — populate lead form labels and gender options once
 *  - showLeadError()      — display validation error on lead form
 *  - setLeadSubmitting()  — put submit button into loading state
 *  - resetLeadForm()      — restore lead form to initial state
 *  - renderResult()       — full result page
 */

'use strict';

import { $, $$, toBnDigits, localize, interpolate } from './utils.js';
import { t, getLocale, getLocaleValue } from './i18n.js';

/* --------------------------------------------------------------------------
   DOM ID Registry
   All HTML element IDs used by this module live here.
   If an ID changes in the HTML, update only this object.
   -------------------------------------------------------------------------- */
const DOM = {
    // Quiz card
    qCard:         '#q-card',
    qBadge:        '#q-badge',
    qHint:         '#q-hint',
    qText:         '#q-text',
    optionsGrid:   '#options-grid',
    btnPrev:       '#btn-prev',
    btnNext:       '#btn-next',
    // Progress
    qCounter:      '#q-counter',
    qPct:          '#q-pct',
    progressFill:  '#progress-fill',
    progressBar:   '[role="progressbar"]',
    // Lead gate
    inpName:       '#inp-name',
    inpGender:     '#inp-gender',
    inpWa:         '#inp-wa',
    leadMsg:       '#lead-msg',
    btnLeadGate:   '#btn-lead-gate',
    // Result
    rEmoji:        '#r-emoji',
    rHeadline:     '#r-headline',
    rBadge:        '#r-badge',
    rSecondBadge:  '#r-second-badge',
    rInsight:      '#r-insight',
    rProblems:     '#r-problems',
    rAdvice:       '#r-advice',
    soapEmoji:     '#soap-emoji',
    soapName:      '#soap-name',
    soapPrice:     '#soap-price',
    soapWhy:       '#soap-why',
    soapOrderBtn:  '#soap-order-btn',
    testimonials:  '#testimonials',
    btnRetake:     '#btn-retake',
};

/* ==========================================================================
   PROGRESS BAR
   ========================================================================== */

/**
 * Render the quiz progress bar and question counter.
 *
 * @param {number} currentIndex - 0-based index of current question in visibleQuestions
 * @param {number} total        - Total number of currently visible questions
 */
export function renderProgress(currentIndex, total) {
    const current = currentIndex + 1;
    const pct     = total > 0 ? Math.round((current / total) * 100) : 0;
    const locale  = getLocale();

    const counterText = locale === 'bn'
        ? `প্রশ্ন ${toBnDigits(current)} / ${toBnDigits(total)}`
        : `Question ${current} / ${total}`;

    const pctText = locale === 'bn' ? `${toBnDigits(pct)}%` : `${pct}%`;

    const counterEl = $(DOM.qCounter);
    const pctEl     = $(DOM.qPct);
    const fillEl    = $(DOM.progressFill);
    const barEl     = $(DOM.progressBar);

    if (counterEl) counterEl.textContent     = counterText;
    if (pctEl)     pctEl.textContent         = pctText;
    if (fillEl)    fillEl.style.width        = `${pct}%`;
    if (barEl)     barEl.setAttribute('aria-valuenow', String(pct));
}

/* ==========================================================================
   QUESTION CARD
   ========================================================================== */

/**
 * Render a full question card including all options and navigation buttons.
 * Replaces the contents of the options grid entirely on each call.
 *
 * @param {Object}      question         - Question config object from questions.json
 * @param {number}      questionNumber   - 1-based display number
 * @param {number}      totalVisible     - Total number of visible questions (for progress)
 * @param {string|null} selectedOptionId - Currently selected option ID, or null if unanswered
 * @param {boolean}     isLast           - True if this is the last visible question
 * @param {Function}    onSelect         - Callback(optionId: string) invoked when an option is picked
 */
export function renderQuestion(question, questionNumber, totalVisible, selectedOptionId, isLast, onSelect) {
    const locale = getLocale();

    // --- Question number badge ---
    const badgeEl = $(DOM.qBadge);
    if (badgeEl) {
        const num = String(questionNumber).padStart(2, '0');
        badgeEl.textContent = locale === 'bn' ? toBnDigits(num) : num;
    }

    // --- Hint ---
    const hintEl   = $(DOM.qHint);
    const hintText = localize(question.hint, locale);
    if (hintEl) hintEl.textContent = hintText ? `(${hintText})` : '';

    // --- Question text ---
    const textEl = $(DOM.qText);
    if (textEl) textEl.textContent = localize(question.text, locale);

    // --- Options ---
    const grid = $(DOM.optionsGrid);
    if (grid) {
        grid.innerHTML = '';

        const LETTERS_BN = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ'];
        const LETTERS_EN = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        const letters = locale === 'bn' ? LETTERS_BN : LETTERS_EN;

        question.options.forEach((opt, idx) => {
            const isSelected = opt.id === selectedOptionId;
            const letter     = letters[idx] ?? String(idx + 1);
            const labelText  = localize(opt.text, locale);

            const div = document.createElement('div');
            div.className = `opt${isSelected ? ' is-selected' : ''}`;
            div.setAttribute('role', 'radio');
            div.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            div.setAttribute('tabindex', '0');
            div.setAttribute('data-option-id', opt.id);
            div.setAttribute('aria-label', `${letter}) ${labelText}`);

            div.innerHTML = `
                <div class="opt-radio" aria-hidden="true">
                    <div class="opt-radio-dot"></div>
                </div>
                <div class="opt-letter" aria-hidden="true">${letter}</div>
                <span class="opt-text">${labelText}</span>
            `;

            div.addEventListener('click', () => onSelect(opt.id));
            div.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(opt.id);
                }
            });

            grid.appendChild(div);
        });
    }

    // --- Navigation buttons ---
    const btnPrev = $(DOM.btnPrev);
    const btnNext = $(DOM.btnNext);

    if (btnPrev) btnPrev.style.visibility = questionNumber === 1 ? 'hidden' : 'visible';

    if (btnNext) {
        btnNext.disabled = selectedOptionId === null;
        btnNext.innerHTML = isLast
            ? `${t('ui.finish')} <span aria-hidden="true">${t('ui.finishCheck')}</span>`
            : `${t('ui.next')} <span aria-hidden="true">${t('ui.nextArrow')}</span>`;
    }
}

/**
 * Update the visual selection state of option elements without a full re-render.
 * Called immediately after the user picks an option for instant feedback.
 *
 * @param {string} selectedOptionId - The newly selected option's ID
 */
export function updateOptionSelection(selectedOptionId) {
    $$(DOM.optionsGrid + ' .opt').forEach(el => {
        const isSelected = el.dataset.optionId === selectedOptionId;
        el.classList.toggle('is-selected', isSelected);
        el.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
    const btnNext = $(DOM.btnNext);
    if (btnNext) btnNext.disabled = false;
}

/* ==========================================================================
   LEAD GATE
   ========================================================================== */

/**
 * Populate the lead gate form with localized labels and gender options.
 * Call once after the locale is loaded (during init).
 */
export function initLeadGate() {
    const genderSelect = $(DOM.inpGender);
    if (!genderSelect) return;

    const genderOptions = getLocaleValue('leadGate.genderOptions') ?? [];

    genderSelect.innerHTML =
        
        genderOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
}

/**
 * Show a validation error message on the lead gate.
 *
 * @param {string}       message  - The error text to display
 * @param {Element|null} focusEl  - Optional element to focus after showing the error
 */
export function showLeadError(message, focusEl = null) {
    const msgEl = $(DOM.leadMsg);
    if (msgEl) {
        msgEl.className   = 'lead-msg is-err';
        msgEl.textContent = message;
    }
    focusEl?.focus();
}

/**
 * Put the lead gate submit button into a loading/disabled state.
 * Prevents double-submission.
 */
export function setLeadSubmitting() {
    const btn = $(DOM.btnLeadGate);
    if (btn) {
        btn.disabled    = true;
        btn.textContent = t('leadGate.submitting');
    }
}

/**
 * Reset the lead gate form to its initial blank state.
 * Called when the user retakes the quiz.
 */
export function resetLeadForm() {
    const nameEl   = $(DOM.inpName);
    const genderEl = $(DOM.inpGender);
    const waEl     = $(DOM.inpWa);
    const msgEl    = $(DOM.leadMsg);
    const btnEl    = $(DOM.btnLeadGate);

    if (nameEl)   nameEl.value        = '';
    if (genderEl) genderEl.value      = '';
    if (waEl)     waEl.value          = '';
    if (msgEl)    { msgEl.className = 'lead-msg'; msgEl.textContent = ''; }
    if (btnEl)    { btnEl.disabled = false; btnEl.textContent = t('leadGate.submitBtn'); }
}

/* ==========================================================================
   RESULT PAGE
   ========================================================================== */

/**
 * Render the full result page with all sections.
 *
 * @param {Object}      skinTypeProfile       - Entry from results.json skinTypes[key]
 * @param {Object|null} secondaryProfile      - Entry for secondary type, or null if none
 * @param {Object}      product               - Product entry from products.json
 * @param {string}      userName              - The user's display name
 * @param {string}      whatsappNumber        - Business WA number (digits only, no +)
 * @param {Object}      recommendationConfig  - Full recommendation.json (for WA message templates)
 */
export function renderResult(skinTypeProfile, secondaryProfile, product, userName, whatsappNumber, recommendationConfig) {
    const locale = getLocale();
    const name   = userName || 'আপনি';

    // --- Emoji & Headline ---
    _setText(DOM.rEmoji,    skinTypeProfile.emoji);
    _setText(DOM.rHeadline, t('result.headline', { name }));

    // --- Primary type badge ---
    _setText(DOM.rBadge, localize(skinTypeProfile.name, locale));

    // --- Secondary type badge ---
    const secondBadgeEl = $(DOM.rSecondBadge);
    if (secondBadgeEl) {
        if (secondaryProfile) {
            secondBadgeEl.style.display = '';
            secondBadgeEl.innerHTML = `
                <span class="secondary-label">${t('result.secondaryBadge')}</span>
                <span class="secondary-name">${localize(secondaryProfile.name, locale)}</span>
            `;
        } else {
            secondBadgeEl.style.display = 'none';
        }
    }

    // --- Personalized insight ---
    const insightEl = $(DOM.rInsight);
    if (insightEl) {
        const template = localize(skinTypeProfile.insightTemplate, locale);

        // Resolve secondary insight snippet (empty string if no secondary type)
        const secondarySnippet = secondaryProfile
            ? localize(skinTypeProfile.secondaryInsights?.[secondaryProfile.key] ?? { bn: '', en: '' }, locale)
            : '';

        insightEl.textContent = interpolate(template, {
            name,
            secondaryInsight: secondarySnippet,
        });
    }

    // --- Problems list ---
    const problemsEl = $(DOM.rProblems);
    if (problemsEl) {
        const problems = localize(skinTypeProfile.problems, locale);
        problemsEl.innerHTML = Array.isArray(problems)
            ? `<ul>${problems.map(p => `<li>${p}</li>`).join('')}</ul>`
            : `<p>${String(problems)}</p>`;
    }

    // --- Advice list ---
    const adviceEl = $(DOM.rAdvice);
    if (adviceEl) {
        const advice = localize(skinTypeProfile.advice, locale);
        adviceEl.innerHTML = Array.isArray(advice)
            ? `<ul>${advice.map(a => `<li>${a}</li>`).join('')}</ul>`
            : `<p>${String(advice)}</p>`;
    }

    // --- Product card ---
    _setText(DOM.soapEmoji, product.emoji);
    _setText(DOM.soapName,  localize(product.name, locale));
    _setText(DOM.soapPrice, localize(product.price, locale));
    _setText(DOM.soapWhy,   localize(product.whyText, locale));

    // --- Order / inquiry button ---
    const orderBtn = $(DOM.soapOrderBtn);
    if (orderBtn) {
        const isCustom   = !!product.isCustom;
        const tmplKey    = isCustom ? 'custom' : 'standard';
        const waTemplate = localize(recommendationConfig.whatsappMessageTemplates[tmplKey], locale);
        const waMsg      = interpolate(waTemplate, {
            skinTypeName: localize(skinTypeProfile.name, locale),
            productName:  localize(product.name, locale),
        });

        orderBtn.href      = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
        orderBtn.innerHTML = isCustom
            ? `<span aria-hidden="true"></span> ${t('result.orderBtnCustom')}`
            : `<span aria-hidden="true"></span> ${t('result.orderBtn')}`;
    }

    // --- Testimonials ---
    _renderTestimonials(product, locale);
}

/* --------------------------------------------------------------------------
   Private helpers
   -------------------------------------------------------------------------- */

/**
 * Safely set textContent of an element found by selector.
 * No-op if the element doesn't exist.
 * @param {string} selector
 * @param {string} text
 */
function _setText(selector, text) {
    const el = $(selector);
    if (el) el.textContent = text ?? '';
}

/**
 * Render the testimonials section for a product.
 * Hides the section if the product has no testimonials.
 * @param {Object} product
 * @param {string} locale
 */
function _renderTestimonials(product, locale) {
    const container = $(DOM.testimonials);
    if (!container) return;

    const testimonials = product.testimonials ?? [];

    if (!testimonials.length) {
        container.style.display = 'none';
        return;
    }

    container.style.display = '';
    container.innerHTML = `
        <h3 class="testimonials-heading">${t('result.testimonialsHeading')}</h3>
        <div class="testimonials-list">
            ${testimonials.map(testimonial => `
                <div class="testimonial-card">
                    <p class="testimonial-text">"${localize(testimonial.text, locale)}"</p>
                    <div class="testimonial-author">
                        <strong class="testimonial-name">${testimonial.name}</strong>
                        <span class="testimonial-location">${localize(testimonial.location, locale)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}
