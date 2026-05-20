/**
 * Eco-Nur Skin Type Quiz — script.js
 * Mobile-first · Production-ready · Bengali UI
 * =========================================
 * CONFIGURE: replace WEBHOOK_URL and WHATSAPP_NUMBER below.
 */

'use strict';

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */
// Generate a fresh random endpoint ID on every request — nothing is stored.
const _ENDPOINT_ID = Array.from(crypto.getRandomValues(new Uint8Array(8)),
    b => b.toString(16).padStart(2, '0')).join('');
const WEBHOOK_URL = `https://webhook-receiver.sf56787-0d4.workers.dev/hook/facetest-submission-${_ENDPOINT_ID}`;
const WHATSAPP_NUMBER = '8801XXXXXXXXX';              // ← replace with Eco-Nur number (country code, no +)

/* ==========================================================================
   1. QUIZ DATA — Questions with options and scoring weights
   ========================================================================== */

/**
 * Skin type keys:
 *   O = Oily (তৈলাক্ত)
 *   D = Dry (শুষ্ক)
 *   C = Combination (মিশ্র)
 *   S = Sensitive (সংবেদনশীল)
 *   A = Acne-Prone (ব্রণপ্রবণ)
 *   N = Normal (স্বাভাবিক)
 *   X = Dull / Hyperpigmented (নিস্তেজ)
 */

const QUESTIONS = [
    {
        num: 1,
        text: 'মুখ ধোয়ার ১ ঘণ্টা পরে আপনার ত্বক কেমন লাগে?',
        hint: 'fresh হয়ে মুখ ধোয়ার এক ঘণ্টা পর অনুভূতি কেমন হয় ?',
        options: [
            { letter: 'ক', text: 'টানটান ও শুষ্ক মনে হয়',          scores: { D: 2 } },
            { letter: 'খ', text: 'তেলতেলে ও চকচকে হয়ে যায়',        scores: { O: 2 } },
            { letter: 'গ', text: 'কপাল-নাকে তেল, গালে শুষ্ক',       scores: { C: 2 } },
            { letter: 'ঘ', text: 'আরামদায়ক ও স্বাভাবিক লাগে',       scores: { N: 2 } },
        ],
    },
    {
        num: 2,
        text: 'দুপুরবেলা মুখে তেলের পরিমাণ কেমন থাকে?',
        hint: 'বাইরে থাকলে বা অফিসে — দুপুরে আপনার ত্বক কেমন দেখায়?',
        options: [
            { letter: 'ক', text: 'একদম তেল নেই, বরং শুষ্ক লাগে',    scores: { D: 2 } },
            { letter: 'খ', text: 'পুরো মুখ তেলে চকচক করে',          scores: { O: 2 } },
            { letter: 'গ', text: 'শুধু নাক-কপালে কিছুটা তেল',       scores: { C: 2 } },
            { letter: 'ঘ', text: 'তেমন কোনো তেল নেই, স্বাভাবিক',    scores: { N: 2 } },
        ],
    },
    {
        num: 3,
        text: 'আয়নার সামনে গেলে মুখের লোমকূপ (pores) কেমন দেখায়?',
        hint: 'ভালো আলোতে আয়নায় নাক ও গালের দিকে মনোযোগ দিন',
        options: [
            { letter: 'ক', text: 'খুব ছোট, প্রায় দেখাই যায় না',     scores: { D: 1, N: 1 } },
            { letter: 'খ', text: 'বড় ও স্পষ্ট, বিশেষত নাকের কাছে', scores: { O: 2 } },
            { letter: 'গ', text: 'T-Zone (কপাল, নাক, থুতনি)-তে  বড়, গালে ছোট বা স্বাভাবিক', scores: { C: 2 } },
            { letter: 'ঘ', text: 'লালচে ও স্ফীত (ফোলা) দেখায়',     scores: { S: 2 } },
        ],
    },
    {
        num: 4,
        text: 'ব্রণ বা ফুসকুড়ি কতটা ঘন ঘন হয়?',
        hint: 'গত ৩ মাসে আপনার মুখে ব্রণের চিত্র মনে করুন',
        options: [
            { letter: 'ক', text: 'প্রায়ই হয়, অনেক জায়গায় একসাথে',  scores: { A: 3, O: 1 } },
            { letter: 'খ', text: 'মাঝেমাঝে দু-একটা হয়',              scores: { C: 1, N: 1 } },
            { letter: 'গ', text: 'খুব কমই হয়',                       scores: { D: 1, N: 1 } },
            { letter: 'ঘ', text: 'ব্রণ হয় না, তবে লালভাব বা জ্বালা হয়', scores: { S: 3 } },
        ],
    },
    {
        num: 5,
        text: 'নতুন সাবান বা ক্রিম লাগালে সাধারণত কী হয়?',
        hint: 'নতুন প্রোডাক্ট ব্যবহারের পর আপনার ত্বকের প্রথম reaction কী?',
        options: [
            { letter: 'ক', text: 'জ্বালাপোড়া বা চুলকানি শুরু হয়',   scores: { S: 3 } },
            { letter: 'খ', text: 'ব্রণ বা র‍্যাশ বেরিয়ে আসে',        scores: { A: 3 } },
            { letter: 'গ', text: 'ত্বক আরও শুষ্ক ও টানটান হয়',       scores: { D: 2 } },
            { letter: 'ঘ', text: 'সাধারণত কোনো সমস্যা হয় না',        scores: { N: 2, O: 1 } },
        ],
    },
    {
        num: 6,
        text: 'আয়নায় দেখলে আপনার ত্বকের রং ও চেহারা কেমন দেখায়?',
        hint: 'সকালে ঘুম থেকে উঠে আয়নায় দেখুন — প্রথম দৃষ্টিতে কী মনে হয়?',
        options: [
            { letter: 'ক', text: 'নিস্তেজ, কালচে ও অনুজ্জ্বল',       scores: { X: 3, D: 1 } },
            { letter: 'খ', text: 'চকচকে ও তৈলাক্ত',                  scores: { O: 2 } },
            { letter: 'গ', text: 'মসৃণ ও সুস্থ দেখায়',               scores: { N: 2 } },
            { letter: 'ঘ', text: 'লালচে বা অসমান রং',                 scores: { S: 2, A: 1 } },
        ],
    },
    {
        num: 7,
        text: 'রোদে বের হলে সাধারণত কী হয়?',
        hint: 'গরমের দিনে বাইরে কিছুক্ষণ থাকলে ত্বকের কী হয়?',
        options: [
            { letter: 'ক', text: 'দ্রুত পুড়ে যায় বা লাল হয়ে যায়',   scores: { S: 3 } },
            { letter: 'খ', text: 'আরও বেশি তেলতেলে হয়ে যায়',         scores: { O: 2 } },
            { letter: 'গ', text: 'টানটান ও শুষ্ক অনুভব হয়',           scores: { D: 2 } },
            { letter: 'ঘ', text: 'তেমন কোনো সমস্যা হয় না',            scores: { N: 2 } },
        ],
    },
    {
        num: 8,
        text: 'শীতকালে আপনার ত্বকে কী ধরনের পরিবর্তন আসে?',
        hint: 'প্রতি শীতে আপনার ত্বক যেভাবে বদলে যায় সেটা মনে করুন',
        options: [
            { letter: 'ক', text: 'খুব শুষ্ক হয়, মাঝে মাঝে ফাটে',      scores: { D: 3 } },
            { letter: 'খ', text: 'সংবেদনশীল হয়ে পড়ে, জ্বালা করে',   scores: { S: 2 } },
            { letter: 'গ', text: 'কিছুটা কম তেলতেলে হয়, মোটামুটি ঠিক', scores: { C: 1, O: 1 } },
            { letter: 'ঘ', text: 'তেমন কোনো পরিবর্তন হয় না',          scores: { N: 2 } },
        ],
    },
    {
        num: 9,
        text: 'এখন আপনার ত্বকের সবচেয়ে বড় সমস্যা কোনটি?',
        hint: 'ভেবে উত্তর দিন - ',
        options: [
            { letter: 'ক', text: 'শুষ্কতা ও টানটান অনুভব',             scores: { D: 3 } },
            { letter: 'খ', text: 'অতিরিক্ত তেল ও চকচকে চেহারা',        scores: { O: 3 } },
            { letter: 'গ', text: 'ব্রণ ও ব্ল্যাকহেড',                  scores: { A: 3 } },
            { letter: 'ঘ', text: 'লালভাব, জ্বালাপোড়া বা র‍্যাশ',      scores: { S: 3 } },
            { letter: 'ঙ', text: 'T-Zone (কপাল, নাক, থুতনি)-তে তেল, বাকিটায় শুষ্ক',        scores: { C: 3 } },
            { letter: 'চ', text: 'নিস্তেজ ত্বক বা বয়সের ছাপ',          scores: { X: 3 } },
        ],
    },
];

/* ==========================================================================
   2. RESULT CONTENT
   ========================================================================== */

const RESULTS = {
    O: {
        name:      'তৈলাক্ত ত্বক',
        emoji:     '✨',
        meaning:   'আপনার ত্বকের সেবাসিয়াস গ্রন্থি প্রয়োজনের চেয়ে বেশি সিবাম (তেল) তৈরি করে। বাংলাদেশের আর্দ্র ও গরম আবহাওয়ায় এই ত্বকের ধরন খুবই সাধারণ। এটি ত্বকের প্রাকৃতিক সুরক্ষা ব্যবস্থা — তবে অতিরিক্ত হলে সমস্যা তৈরি হয়।',
        problems:  'সারাদিন মুখ চকচকে থাকে, লোমকূপ বড় দেখায়, ব্ল্যাকহেড জমে, মেকআপ দ্রুত উঠে যায় এবং ধুলো-ঘাম তাড়াতাড়ি জমে।',
        advice:    'দিনে দুইবার মুখ ধুন (বেশি নয়), হালকা অয়েল-ফ্রি ময়েশ্চারাইজার ব্যবহার করুন, মুখে বারবার হাত দেবেন না এবং সপ্তাহে একবার মাটির মাস্ক ব্যবহার করুন।',
        soap:      'Active Defence Bar',
        soapEmoji: '🖤',
        soapPrice: '৳৪৫০/বার',
        soapWhy:   'অ্যাক্টিভেটেড চারকোল লোমকূপের গভীর থেকে তেল ও ময়লা শোষণ করে। মধু ব্যাকটেরিয়া রোধ করে কিন্তু আর্দ্রতা ধরে রাখে। পুদিনা তেল উৎপাদন নিয়ন্ত্রণ করে ও সতেজ ঠান্ডা অনুভূতি দেয়।',
        isCustom:  false,
    },
    D: {
        name:      'শুষ্ক ত্বক',
        emoji:     '💧',
        meaning:   'আপনার ত্বক পর্যাপ্ত প্রাকৃতিক তেল তৈরি করতে পারে না এবং আর্দ্রতা ধরে রাখার ক্ষমতা কম। ত্বকের প্রতিরক্ষা স্তর (skin barrier) দুর্বল, যা বাইরের ক্ষতিকর উপাদান থেকে ঠিকমতো রক্ষা করতে পারে না।',
        problems:  'মুখ ধোয়ার পর টানটান অনুভব, ফ্লেকি ও খসখসে ত্বক, অকালে বলিরেখা পড়া এবং শীতকালে অতিরিক্ত কষ্ট হয়।',
        advice:    'ভেজা ত্বকে ময়েশ্চারাইজার লাগান, কুসুম গরম পানি ব্যবহার করুন, ফোমিং ক্লেনজার এড়িয়ে চলুন এবং দিনে অন্তত ৮ গ্লাস পানি পান করুন।',
        soap:      'Calm & Repair Bar',
        soapEmoji: '🌿',
        soapPrice: '৳৪৭০/বার',
        soapWhy:   'ক্যাস্টর অয়েল গভীর আর্দ্রতা দেয় ও skin barrier শক্তিশালী করে। লিকোরিস ত্বকের প্রতিরক্ষা স্তর পুনরুদ্ধার করে। ক্যালেন্ডুলা শতাব্দী-প্রমাণিত শুষ্ক ত্বকের নিরাময়কারী এবং ওট এক্সট্র্যাক্ট জলশূন্যতা রোধ করে।',
        isCustom:  false,
    },
    C: {
        name:      'মিশ্র ত্বক',
        emoji:     '⚖️',
        meaning:   'আপনার টি-জোন (কপাল, নাক, চিবুক) তৈলাক্ত কিন্তু গাল স্বাভাবিক বা শুষ্ক। এটি সবচেয়ে সাধারণ ত্বকের ধরন। মৌসুম পরিবর্তনে ত্বকের অবস্থা পরিবর্তিত হতে পারে।',
        problems:  'একই পণ্য পুরো মুখে সমানভাবে কাজ করে না, টি-জোনে বড় লোমকূপ দেখা যায়, ঋতু পরিবর্তনে বেশি সমস্যা হয়।',
        advice:    'মৃদু ক্লেনজার ব্যবহার করুন, টি-জোনে কম ও গালে বেশি ময়েশ্চারাইজার লাগান এবং সপ্তাহে একবার মৃদু এক্সফোলিয়েশন করুন।',
        soap:      'Equilibrium Bar',
        soapEmoji: '🍃',
        soapPrice: '৳৪৫০/বার',
        soapWhy:   'অলিভ অয়েল শুষ্ক গালে প্রয়োজনীয় আর্দ্রতা দেয়। নিম টি-জোনের অতিরিক্ত তেল নিয়ন্ত্রণ করে। গ্রিন টি পুরো ত্বকের ভারসাম্য রক্ষা করে — মিশ্র ত্বকের জন্য আদর্শ।',
        isCustom:  false,
    },
    S: {
        name:      'সংবেদনশীল ত্বক',
        emoji:     '🌸',
        meaning:   'আপনার ত্বকের প্রতিরক্ষা স্তর পাতলা বা দুর্বল, তাই পরিবেশ বা উপাদানে দ্রুত প্রতিক্রিয়া দেখায়। রোদ, ঠান্ডা বা নতুন পণ্যে সহজেই জ্বালা বা লালভাব হয়।',
        problems:  'নতুন পণ্যে জ্বালা বা র্যাশ, রোদ-ঠান্ডায় লালভাব, সুগন্ধিতে অ্যালার্জি, ত্বক সহজেই উত্তেজিত হয়ে পড়ে।',
        advice:    'যেকোনো নতুন পণ্য প্যাচ টেস্ট করুন, সুগন্ধিমুক্ত পণ্য বেছে নিন, মুখ কখনো ঘষবেন না, পর্যাপ্ত ঘুম ও পানি নিশ্চিত করুন।',
        soap:      'Calm & Repair Bar',
        soapEmoji: '🌿',
        soapPrice: '৳৪৭০/বার',
        soapWhy:   'ক্যালেন্ডুলা সবচেয়ে মৃদু প্রদাহরোধী উদ্ভিজ্জ উপাদান। Oat এক্সট্র্যাক্ট FDA-স্বীকৃত skin protectant যা চুলকানি ও লালভাব কমায়। লিকোরিস প্রদাহ নিয়ন্ত্রণ করে। ক্যাস্টর অয়েল barrier শক্তিশালী করে — সংবেদনশীল ত্বকের জন্য নিখুঁত।',
        isCustom:  false,
    },
    A: {
        name:      'ব্রণপ্রবণ ত্বক',
        emoji:     '🛡️',
        meaning:   'আপনার লোমকূপ সহজেই তেল, মৃত কোষ ও ব্যাকটেরিয়া দিয়ে বন্ধ হয়ে যায়। হরমোনের প্রভাব, খাদ্যাভ্যাস ও পরিবেশ এই ত্বকের ধরনে বড় ভূমিকা রাখে।',
        problems:  'বারবার পিম্পল ও ব্ল্যাকহেড, ব্রণের পরে কালো দাগ, হরমোন-সম্পর্কিত breakout, সারাদিন তৈলাক্ততা।',
        advice:    'ব্রণ কখনো ফাটাবেন না, দিনে দুইবার মুখ ধুয়ে ময়েশ্চারাইজার করুন, প্রতিদিন বালিশের কভার পরিষ্কার রাখুন এবং প্রচুর পানি পান করুন।',
        soap:      'Active Defence Bar',
        soapEmoji: '🖤',
        soapPrice: '৳৪৫০/বার',
        soapWhy:   'অ্যাক্টিভেটেড চারকোল লোমকূপের গভীরে ব্যাকটেরিয়া ও ময়লা শোষণ করে। মধুর হাইড্রোজেন পারঅক্সাইড ব্রণের মূল জীবাণু C. acnes ধ্বংস করে। পুদিনার antiseptic গুণ বিদ্যমান ব্রণ দ্রুত শুকাতে সাহায্য করে।',
        isCustom:  false,
    },
    N: {
        name:      'স্বাভাবিক ত্বক',
        emoji:     '✅',
        meaning:   'আপনার ত্বক সুষম — সিবাম উৎপাদন, আর্দ্রতা ও pH সবকিছু মোটামুটি সঠিক। এটি ত্বকের সবচেয়ে সুস্থ ধরন। তবে সঠিক যত্ন না নিলে ভবিষ্যতে পরিবর্তন হতে পারে।',
        problems:  'ঋতু পরিবর্তনে মাঝে মাঝে তারতম্য হতে পারে এবং বয়সের সাথে ত্বকের ধরন বদলে যেতে পারে।',
        advice:    'ভারসাম্য বজায় রাখুন, প্রতিদিন সানস্ক্রিন ব্যবহার করুন, হালকা ময়েশ্চারাইজার এবং প্রচুর পানি পান করুন।',
        soap:      'Equilibrium Bar',
        soapEmoji: '🍃',
        soapPrice: '৳৪৫০/বার',
        soapWhy:   'অলিভ অয়েল ত্বকের প্রাকৃতিক আর্দ্রতা বজায় রাখে। গ্রিন টি বার্ধক্য রোধ করে ও ত্বক তারুণ্যময় রাখে। নিম ত্বক পরিষ্কার ও সুস্থ রাখে — স্বাভাবিক ত্বকের রক্ষণাবেক্ষণে আদর্শ।',
        isCustom:  false,
    },
    X: {
        name:      'নিস্তেজ / পিগমেন্টেশন-প্রবণ ত্বক',
        emoji:     '🌟',
        meaning:   'আপনার ত্বক উজ্জ্বলতা হারিয়েছে এবং কালো দাগ বা অসমান রং দেখা দিচ্ছে। সূর্যের UV রশ্মি, হরমোন বা পুষ্টির অভাবে এটি হয়। সঠিক যত্নে ত্বক পুনরায় উজ্জ্বল হতে পারে।',
        problems:  'হাইপারপিগমেন্টেশন, অসমান রং, বলিরেখা, পুরনো ব্রণের কালো দাগ।',
        advice:    'প্রতিদিন সানস্ক্রিন ব্যবহার করুন, ভিটামিন C সিরাম, মৃদু exfoliation এবং প্রচুর সবুজ সবজি ও পানি পান করুন।',
        soap:      'কাস্টম ব্রাইটেনিং সাবান',
        soapEmoji: '✨',
        soapPrice: 'WhatsApp এ জানুন',
        soapWhy:   'আপনার ত্বকের জন্য বিশেষ হলুদ (কারকিউমিন), জাফরান ও রোজহিপ অয়েল সমৃদ্ধ কাস্টম ব্রাইটেনিং সাবান সবচেয়ে কার্যকর হবে। Eco-Nur আপনার জন্য বিশেষভাবে তৈরি করতে পারে — WhatsApp করুন।',
        isCustom:  true,
    },
};

/* ==========================================================================
   3. APP STATE
   ========================================================================== */
const state = {
    userName:        '',
    currentQ:        0,
    answers:         Array(QUESTIONS.length).fill(null), // index of chosen option or null
    skinType:        null,
};

/* ==========================================================================
   4. DOM HELPERS
   ========================================================================== */
const $  = (sel)       => document.querySelector(sel);
const $$ = (sel)       => document.querySelectorAll(sel);

/**
 * Convert ASCII digit string to Bengali numerals.
 * e.g. "12" → "১২"
 */
function toBnDigits(n) {
    const BN = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(n).replace(/\d/g, d => BN[+d]);
}

/**
 * Switch which <section> is visible.
 * Scrolls to top automatically.
 */
function showSection(id) {
    $$('.sec').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   5. SCORING ENGINE
   ========================================================================== */

/**
 * Sum scores from all answered questions.
 * Returns the winning skin-type key using priority tie-breaking.
 * Priority order: A > S > O > C > D > X > N
 */
function computeSkinType() {
    const scores = { O: 0, D: 0, C: 0, S: 0, A: 0, N: 0, X: 0 };

    state.answers.forEach((chosen, qIdx) => {
        if (chosen === null) return;
        const opt = QUESTIONS[qIdx].options[chosen];
        Object.entries(opt.scores).forEach(([key, val]) => {
            scores[key] += val;
        });
    });

    // Tie-breaking: highest priority wins ties
    const PRIORITY = ['A', 'S', 'O', 'C', 'D', 'X', 'N'];
    const max = Math.max(...Object.values(scores));
    const winners = PRIORITY.filter(k => scores[k] === max);
    return winners[0]; // highest-priority winner
}

/* ==========================================================================
   6. QUIZ RENDERING
   ========================================================================== */

function updateProgress() {
    const total   = QUESTIONS.length;
    const current = state.currentQ + 1;
    const pct     = Math.round((current / total) * 100);

    $('#q-counter').textContent    = `প্রশ্ন ${toBnDigits(current)} / ${toBnDigits(total)}`;
    $('#q-pct').textContent        = `${toBnDigits(pct)}%`;
    $('#progress-fill').style.width = `${pct}%`;
    $('#progress-fill').closest('[role="progressbar"]').setAttribute('aria-valuenow', pct);
}

function renderQuestion() {
    const q       = QUESTIONS[state.currentQ];
    const isLast  = state.currentQ === QUESTIONS.length - 1;
    const chosen  = state.answers[state.currentQ];

    updateProgress();

    // Badge
    const badgeNum = String(state.currentQ + 1).padStart(2, '0');
    $('#q-badge').textContent = toBnDigits(badgeNum);

    // Hint & text
    $('#q-hint').textContent = q.hint ? `(${q.hint})` : '';
    $('#q-text').textContent = q.text;

    // Options
    const grid = $('#options-grid');
    grid.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'opt' + (chosen === idx ? ' is-selected' : '');
        div.setAttribute('role', 'radio');
        div.setAttribute('aria-checked', chosen === idx ? 'true' : 'false');
        div.setAttribute('tabindex', '0');
        div.setAttribute('aria-label', `${opt.letter}) ${opt.text}`);

        div.innerHTML = `
            <div class="opt-radio" aria-hidden="true">
                <div class="opt-radio-dot"></div>
            </div>
            <div class="opt-letter" aria-hidden="true">${opt.letter}</div>
            <span class="opt-text">${opt.text}</span>
        `;

        div.addEventListener('click', () => selectOption(idx));
        div.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectOption(idx);
            }
        });

        grid.appendChild(div);
    });

    // Navigation buttons
    const btnPrev = $('#btn-prev');
    const btnNext = $('#btn-next');

    btnPrev.style.visibility = state.currentQ === 0 ? 'hidden' : 'visible';
    btnNext.disabled = (chosen === null);

    btnNext.innerHTML = isLast
        ? 'ফলাফল দেখুন <span aria-hidden="true">✓</span>'
        : 'পরবর্তী <span aria-hidden="true">→</span>';
}

function selectOption(idx) {
    state.answers[state.currentQ] = idx;

    $$('.opt').forEach((el, i) => {
        const selected = i === idx;
        el.classList.toggle('is-selected', selected);
        el.setAttribute('aria-checked', selected ? 'true' : 'false');
    });

    $('#btn-next').disabled = false;
}

/* ==========================================================================
   7. QUESTION TRANSITION ANIMATION
   ========================================================================== */

function transitionTo(callback) {
    const card = $('#q-card');

    card.classList.add('is-exiting');
    setTimeout(() => {
        card.classList.remove('is-exiting');
        callback();
        card.classList.add('is-entering');
        // Allow paint before removing, so animation triggers
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.classList.remove('is-entering');
            });
        });
    }, 220);
}

function goNext() {
    if (state.answers[state.currentQ] === null) return;

    if (state.currentQ < QUESTIONS.length - 1) {
        transitionTo(() => {
            state.currentQ++;
            renderQuestion();
        });
    } else {
        showSection('#sec-lead-gate');
        }
}

function goPrev() {
    if (state.currentQ > 0) {
        transitionTo(() => {
            state.currentQ--;
            renderQuestion();
        });
    }
}

/* ==========================================================================
   8. RESULT RENDERING
   ========================================================================== */

function showResults() {
    state.skinType = computeSkinType();
    const r     = RESULTS[state.skinType];
    const name  = state.userName || 'আপনার';

    // Header
    $('#r-emoji').textContent    = r.emoji;
    $('#r-headline').textContent = `${name}, আপনার ত্বকের ফলাফল প্রস্তুত`;
    $('#r-badge').textContent    = r.name;

    // Info blocks
    $('#r-meaning').textContent  = r.meaning;
    $('#r-problems').textContent = r.problems;
    $('#r-advice').textContent   = r.advice;

    // Soap card
    $('#soap-emoji').textContent  = r.soapEmoji;
    $('#soap-name').textContent   = r.soap;
    $('#soap-price').textContent  = r.soapPrice;
    $('#soap-why').textContent    = r.soapWhy;

    // WhatsApp order button
    const orderBtn = $('#soap-order-btn');
    const waMsg    = r.isCustom
        ? `হ্যালো! আমার ত্বক "${r.name}"। কাস্টম সাবান সম্পর্কে জানতে চাই।`
        : `হ্যালো! আমার ত্বক "${r.name}"। আমি ${r.soap} (${r.soapPrice}) অর্ডার করতে চাই।`;

    orderBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;

    if (r.isCustom) {
        orderBtn.innerHTML = '<span aria-hidden="true">📲</span> কাস্টম সাবানের জন্য WhatsApp করুন';
    } else {
        orderBtn.innerHTML = '<span aria-hidden="true">📲</span> WhatsApp এ অর্ডার করুন';
    }

    showSection('#sec-result');
}

/* ==========================================================================
   9. LEAD CAPTURE — Webhook Submission
   ========================================================================== */

async function submitLeadGate() {
    const nameInput = $('#inp-name');
    const waInput   = $('#inp-wa');
    const msgEl     = $('#lead-gate-msg');
    const btn       = $('#btn-lead-gate');
    const nameVal   = nameInput.value.trim();
    const waVal     = waInput.value.trim();

    if (!nameVal) {
        msgEl.className   = 'lead-msg is-err';
        msgEl.textContent = '⚠️ অনুগ্রহ করে আপনার নাম লিখুন।';
        nameInput.focus();
        return;
    }
    if (!waVal || waVal.replace(/\D/g, '').length < 10) {
        msgEl.className   = 'lead-msg is-err';
        msgEl.textContent = '⚠️ অনুগ্রহ করে সঠিক WhatsApp নম্বর দিন।';
        waInput.focus();
        return;
    }

    state.userName = nameVal;
    btn.disabled   = true;
    btn.textContent = 'অপেক্ষা করুন…';

    // Fire-and-forget webhook — never blocks result
    const skinTypeKey = computeSkinType();
    const r = RESULTS[skinTypeKey] || {};

    // Build a readable answers map: Q text → chosen option text
    const answersMap = {};
    state.answers.forEach((chosen, qIdx) => {
        if (chosen !== null) {
            const q = QUESTIONS[qIdx];
            answersMap[`Q${qIdx + 1}`] = {
                question: q.text,
                answer:   q.options[chosen].text,
            };
        }
    });

    fetch(WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            submitted_at:     new Date().toISOString(),
            name:             nameVal,
            whatsapp:         waVal,
            skin_type_key:    skinTypeKey,
            skin_type:        r.name || '',
            recommended_soap: r.soap || '',
            soap_price:       r.soapPrice || '',
            answers:          answersMap,
        }),
    }).catch(() => {}); // silent fail

    showResults();
}
function onLeadSuccess(btn, msgEl) {
    btn.style.display   = 'none';
    msgEl.className     = 'lead-msg is-ok';
    msgEl.textContent   = '✓ আপনার তথ্য পাওয়া গেছে! 🌿';
}

/* ==========================================================================
   10. QUIZ RESET
   ========================================================================== */

function resetQuiz() {
    state.currentQ = 0;
    state.answers  = Array(QUESTIONS.length).fill(null);
    state.skinType = null;

    // Reset gate form
    const nameInput = $('#inp-name');
    const waInput   = $('#inp-wa');
    const gateMsg   = $('#lead-gate-msg');
    const gateBtn   = $('#btn-lead-gate');

    if (nameInput) nameInput.value = '';
    if (waInput)   waInput.value   = '';
    if (gateMsg)  { gateMsg.className = 'lead-msg'; gateMsg.textContent = ''; }
    if (gateBtn)  { gateBtn.disabled = false; gateBtn.innerHTML = 'ফলাফল দেখুন <span aria-hidden="true">→</span>'; }

    showSection('#sec-landing');
}

/* ==========================================================================
   11. KEYBOARD SHORTCUTS (accessibility)
   ========================================================================== */
function handleKeyboard(e) {
    const active = document.querySelector('.sec.active');
    if (!active) return;

    if (active.id === 'sec-quiz') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (!$('#btn-next').disabled) goNext();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            goPrev();
        }
        // Number / letter shortcuts for quick selection
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
        if (keyMap[e.key] !== undefined) {
            const q = QUESTIONS[state.currentQ];
            if (q.options[keyMap[e.key]]) selectOption(keyMap[e.key]);
        }
    }
}

/* ==========================================================================
   12. INIT
   ========================================================================== */
function init() {
    /* ── Clear any browser-autofilled / cached values on every load ── */
    $('#inp-name').value = '';
    $('#inp-wa').value   = '';

    /* ── Landing ── */
    $('#btn-start').addEventListener('click', startQuiz);
    $('#inp-name').addEventListener('keydown', e => {
        if (e.key === 'Enter') startQuiz();
    });

    /* ── Quiz navigation ── */
    $('#btn-next').addEventListener('click', goNext);
    $('#btn-prev').addEventListener('click', goPrev);

    /* ── Lead capture ── */
    $('#btn-lead-gate').addEventListener('click', submitLeadGate);
    $('#inp-wa').addEventListener('keydown', e => {
        if (e.key === 'Enter') submitLeadGate();
        });

    /* ── Retake ── */
    $('#btn-retake').addEventListener('click', resetQuiz);

    /* ── Global keyboard shortcuts ── */
    document.addEventListener('keydown', handleKeyboard);
}

function startQuiz() {
    const nameVal = $('#inp-name').value.trim();
    state.userName = nameVal || 'আপনি';
    state.currentQ = 0;
    state.answers  = Array(QUESTIONS.length).fill(null);

    renderQuestion();
    showSection('#sec-quiz');
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', init);
