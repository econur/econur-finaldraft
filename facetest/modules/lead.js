/**
 * @module lead
 * Lead capture: field validation and webhook submission.
 *
 * This module knows nothing about the DOM or rendering — it only handles
 * data validation and the network request. All UI feedback (showing errors,
 * disabling buttons) is handled by the caller in script.js.
 *
 * To add a new lead field:
 *  1. Add its HTML input to the lead gate section in index.html
 *  2. Read its value in submitLeadGate() in script.js
 *  3. Add a validation rule to validateLead() below
 *  4. Add it to buildPayload() below
 *
 * The webhook URL lives in script.js (top-level config constant), not here.
 */

'use strict';

/* --------------------------------------------------------------------------
   Validation
   -------------------------------------------------------------------------- */

/**
 * Validate the three required lead fields.
 *
 * Returns null if all fields pass.
 * Returns an error descriptor object if any field fails.
 *
 * @param {string} name    - User's name
 * @param {string} gender  - Gender selection value ('female'|'male'|'other'|'')
 * @param {string} wa      - WhatsApp number string
 * @returns {{ message: string, focusSelector: string }|null}
 */
export function validateLead(name, gender, wa, i18nT) {
    // name is required
    if (!name.trim()) {
        return {
            message:       i18nT('leadGate.errors.nameRequired'),
            focusSelector: '#inp-name',
        };
    }

    // gender selection is required
    if (!gender) {
        return {
            message:       i18nT('leadGate.errors.genderRequired'),
            focusSelector: '#inp-gender',
        };
    }

    // WhatsApp: strip non-digits and check minimum length
    const digits = wa.replace(/\D/g, '');
    if (!wa.trim() || digits.length < 10) {
        return {
            message:       i18nT('leadGate.errors.waRequired'),
            focusSelector: '#inp-wa',
        };
    }

    return null; // all valid
}

/* --------------------------------------------------------------------------
   Payload Builder
   -------------------------------------------------------------------------- */

/**
 * Build a clean JSON payload from quiz results and lead data.
 * The answers map stores human-readable Bengali text (not IDs) for easy
 * reading in Google Sheets.
 *
 * @param {Object} leadData
 * @param {string} leadData.name
 * @param {string} leadData.gender
 * @param {string} leadData.whatsapp
 * @param {string} leadData.skinTypeKey
 * @param {string} leadData.skinTypeName
 * @param {string} leadData.productId
 * @param {string} leadData.productName
 * @param {Record<string, string>} leadData.answers - { questionId: selectedOptionId }
 * @param {Object[]} questions - Full question config array (for readable text lookup)
 * @returns {Object} JSON-serializable webhook payload
 */
export function buildPayload(leadData, questions) {
    const { name, gender, whatsapp, skinTypeKey, skinTypeName, productId, productName, answers } = leadData;

    // Build a human-readable answers map: { q1: { question: '...', answer: '...' } }
    const readableAnswers = {};
    for (const [questionId, optionId] of Object.entries(answers)) {
        const question = questions.find(q => q.id === questionId);
        if (!question) continue;

        const option = question.options.find(o => o.id === optionId);
        if (!option) continue;

        readableAnswers[questionId] = {
            question: question.text?.bn ?? questionId,
            answer:   option.text?.bn  ?? optionId,
        };
    }

    return {
        submitted_at:  new Date().toISOString(),
        name,
        gender,
        whatsapp,
        skin_type_key: skinTypeKey,
        skin_type:     skinTypeName,
        product_id:    productId,
        product_name:  productName,
        answers:       readableAnswers,
    };
}

/* --------------------------------------------------------------------------
   Webhook Submission
   -------------------------------------------------------------------------- */

/**
 * POST the lead payload to the webhook. Fire-and-forget.
 *
 * Errors are swallowed intentionally — webhook submission must never
 * block or break the user experience. The result page should show
 * regardless of whether the submission succeeded.
 *
 * @param {string} webhookUrl
 * @param {Object} payload - Output of buildPayload()
 * @returns {Promise<void>}
 */
export async function submitToWebhook(webhookUrl, payload) {
    try {
        await fetch(webhookUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });
    } catch {
        // Silent fail — do NOT show an error to the user for a tracking request
    }
}
