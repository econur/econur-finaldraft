/* ==========================================
   PRODUCT DATA — edit this file to add/remove products.
   Each object must have: id, name, tag, badge, img, imgAlt,
   desc, ingredients (array), price, category, waLink
========================================== */
const PRODUCTS = [
  {
    id: 'p1',
    name: 'Active Defense Bar',
    tag: 'Acne &amp; Oily',
    badge: '⭐ Best Seller',
    img: 'images/PVADBd.webp',
    imgAlt: 'Active Defense Bar — Neem and Activated Charcoal natural soap',
    desc: 'Deep-cleansing bar for oily, acne-prone skin. Controls oil &amp; breakouts without over-drying — powered by nature\'s most potent purifiers.',
    ingredients: ['Neem', 'Activated Charcoal', 'Tea Tree EO'],
    price: 229,
    category: 'face',
    pageUrl: 'active-defense.html',
    waLink: 'https://wa.me/8801410753555?text=Hello%20Econur%2C%20I%20would%20like%20to%20buy%20Active%20Defense%20Bar'
  },
  {
    id: 'p2',
    name: 'Licorice Brightening Bar',
    tag: 'Brightening',
    badge: '',
    img: 'images/PVLBBd.webp',
    imgAlt: 'Licorice Brightening Bar — Wild Turmeric and Honey natural soap',
    desc: 'Brightening bar for normal &amp; combination skin. Fades tanning, dark spots and pigmentation while soothing redness — with licorice, wild turmeric and honey.',
    ingredients: ['Licorice', 'Wild Turmeric', 'Honey'],
    price: 229,
    category: 'face',
    pageUrl: 'licorice-brightening.html',
    waLink: 'https://wa.me/8801410753555?text=Hello%20Econur%2C%20I%20would%20like%20to%20buy%20Licorice%20Brightening%20Bar'
  },
  {
    id: 'p3',
    name: 'Herbifresh Bar',
    tag: 'Normal &amp; Combination',
    badge: '',
    img: 'images/PVHBd.webp',
    imgAlt: 'Herbifresh Bar — Moringa, Neem and Green Tea natural soap',
    desc: 'Herbal antibacterial bar for normal &amp; combination skin. Moringa and neem cleanse deeply while oats gently exfoliate for fresh, calm skin.',
    ingredients: ['Moringa', 'Neem', 'Green Tea'],
    price: 229,
    category: 'face',
    pageUrl: 'herbifresh.html',
    waLink: 'https://wa.me/8801410753555?text=Hello%20Econur%2C%20I%20would%20like%20to%20buy%20Herbifresh%20Bar'
  },
  {
    id: 'p4',
    name: 'Olivelle Bar',
    tag: 'Baby Care',
    badge: '⭐ Most Premium',
    img: 'images/PVOBd.webp',
    imgAlt: 'Olivelle Bar — Olive Oil and Oat Milk natural soap for babies',
    desc: 'Ultra-mild bar for babies &amp; sensitive skin. Rich olive oil deeply nourishes and soothes — gentle enough for the most delicate skin.',
    ingredients: ['Olive Oil', 'Kaolin Clay', 'Oat Milk'],
    price: 259,
    category: 'baby',
    pageUrl: 'olivelle.html',
    waLink: 'https://wa.me/8801410753555?text=Hello%20Econur%2C%20I%20would%20like%20to%20buy%20Olivelle%20Bar'
  },
  {
    id: 'p5',
    name: 'Caffiend Bar',
    tag: 'Combination &amp; Oily',
    badge: '',
    img: 'images/PVCBd.webp',
    imgAlt: 'Caffiend Bar — Ground Coffee and Almond Oil natural soap',
    desc: 'Energizing scrub bar for combination &amp; mildly oily skin. Ground coffee lifts away oil and impurities while gently exfoliating for fresh, revitalized skin.',
    ingredients: ['Ground Coffee', 'Almond Oil', 'Milk'],
    price: 229,
    category: 'body',
    pageUrl: 'caffiend.html',
    waLink: 'https://wa.me/8801410753555?text=Hello%20Econur%2C%20I%20would%20like%20to%20buy%20Caffiend%20Bar'
  }
];


  // {
  //   id: 'p6',
  //   name: 'Himalayan Pink Salt Soap',
  //   tag: 'All Skin Types',
  //   badge: '',
  //   img: 'images/himalayan-salt.webp',
  //   imgAlt: 'Himalayan Pink Salt Soap — mineral-rich natural soap bar',
  //   desc: 'Mineral-rich bar for all skin types. Himalayan pink salt deep-cleans and balances oil while gently exfoliating, leaving skin smooth, fresh and odor-free.',
  //   ingredients: ['Himalayan Pink Salt', 'Almond Oil', 'Olive Oil'],
  //   price: 299,
  //   category: 'body',
  //   waLink: 'https://wa.me/8801410753555?text=Hello%20Econur%2C%20I%20would%20like%20to%20buy%20Himalayan%20Pink%20Salt%20Soap'
  // }