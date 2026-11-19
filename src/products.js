// Photos: Unsplash (free licence). Shapes drive the 3D hero morph.
export const unsplash = (id, w = 900, h) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`;

export const srcset = (id, ratio = 1.25) =>
  [480, 720, 1000, 1400]
    .map((w) => `${unsplash(id, w, Math.round(w * ratio))} ${w}w`)
    .join(', ');

export const PRODUCTS = [
  {
    id: 'tidepool-carafe',
    name: 'Tidepool carafe',
    price: 148,
    tint: 'seafoam',
    maker: 'Blown by Ines Varga',
    size: '29 cm tall, holds 1.8 L',
    note: 'A round-bellied carafe in pale green glass. It looks best half full, on a sunny table.',
    stock: 7,
    photo: '1599225073716-57d6508221ca',
    span: 'lg',
    shape: { h: 2.3, base: 0.42, belly: 0.82, bellyPos: 0.3, neck: 0.3, lip: 0.4 },
  },
  {
    id: 'ember-bottle',
    name: 'Ember bottle',
    price: 64,
    tint: 'amber',
    maker: 'Blown by Tomás Reyes',
    size: '18 cm tall, for dried stems',
    note: 'Heavy-bottomed amber glass with a short neck. Steady on a shelf, warm in low light.',
    stock: 22,
    photo: '1618674622469-d7fd1a22fcf8',
    span: 'md',
    shape: { h: 1.45, base: 0.36, belly: 0.5, bellyPos: 0.3, neck: 0.12, lip: 0.2 },
  },
  {
    id: 'cobalt-loop',
    name: 'Cobalt loop',
    price: 210,
    tint: 'cobalt',
    maker: 'Blown by Ines Varga',
    size: '31 cm tall, sculptural',
    note: 'A single gather pulled into an open loop while hot. No two curves are the same.',
    stock: 3,
    photo: '1645429045555-b52eaf878999',
    span: 'sm',
    shape: { h: 2.9, base: 0.6, belly: 0.72, bellyPos: 0.22, neck: 0.32, lip: 0.62 },
  },
  {
    id: 'mist-tumblers',
    name: 'Mist tumblers, pair',
    price: 58,
    tint: 'clear',
    maker: 'Blown by the whole studio',
    size: '10 cm tall, holds 320 ml each',
    note: 'Thin, ribbed everyday glasses that throw lines of light across the table.',
    stock: 40,
    photo: '1610821165540-80c084d50fd3',
    span: 'sm',
    shape: { h: 0.95, base: 0.5, belly: 0.56, bellyPos: 0.45, neck: 0.6, lip: 0.64 },
  },
  {
    id: 'rosewater-fluted',
    name: 'Rosewater fluted vase',
    price: 96,
    tint: 'rose',
    maker: 'Blown by Mira Okafor',
    size: '24 cm tall, holds 1.2 L',
    note: 'Blown into a ribbed mould, then opened by hand. Magenta in daylight, deep plum at night.',
    stock: 11,
    photo: '1789989998556-252e5df669a3',
    span: 'sm',
    shape: { h: 1.95, base: 0.44, belly: 0.56, bellyPos: 0.24, neck: 0.13, lip: 0.17 },
  },
  {
    id: 'prism-decanter',
    name: 'Prism decanter',
    price: 265,
    tint: 'smoke',
    maker: 'Blown by Tomás Reyes, cut by Mira Okafor',
    size: '26 cm tall, holds 900 ml',
    note: 'Blown thick, then hand-cut on a stone wheel into a diamond lattice. Three days of work for one piece.',
    stock: 2,
    photo: '1712245833868-752590cb07e1',
    span: 'banner',
    shape: { h: 2.65, base: 0.34, belly: 0.92, bellyPos: 0.5, neck: 0.26, lip: 0.46 },
  },
];

export const PROCESS = [
  { temp: '1,150 °C', name: 'Gather', photo: '1773125465949-67e8f5c1d04e', text: 'We dip the blowpipe into the furnace and turn it to collect a honey-thick glob of molten glass.' },
  { temp: '1,000 °C', name: 'Marver', photo: '1703633417409-66123be7afec', text: 'The gather is rolled and turned to centre it and cool its skin, so it can hold a bubble.' },
  { temp: '900 °C', name: 'Blow', photo: '1489430142561-89522706dc20', text: 'One long breath opens the bubble. Colour goes in here, rolled on as powdered glass.' },
  { temp: '750 °C', name: 'Shape', photo: '1630691650857-a6860db7012f', text: 'Jacks, wooden paddles and wet newspaper pull out the neck and open the lip.' },
  { temp: '480 °C to room', name: 'Anneal', photo: '1683045970616-2499fa6c2834', text: 'Pieces cool slowly in a kiln overnight so they never crack from stress. Then we sign them.' },
];

export const TESTIMONIALS = [
  {
    quote: 'The carafe arrived wrapped in actual wool, with a note from Ines. It lives on our breakfast table and catches the sun every morning.',
    name: 'Hana Sato',
    place: 'Kyoto',
    bought: 'Tidepool carafe',
    photo: '1735378013887-ed4c7d46030f',
  },
  {
    quote: 'I bought one tumbler to try them. Now we own eight. They are thinner than anything from a shop and somehow none have broken yet.',
    name: 'Daniel Brooks',
    place: 'Leeds',
    bought: 'Mist tumblers',
    photo: '1694255565757-516cfbf5020d',
  },
  {
    quote: 'I shaped my own vase on the site, low belly, wide lip, and three weeks later the real thing matched the preview almost exactly.',
    name: 'Amara Diallo',
    place: 'Lisbon',
    bought: 'A made-to-order vessel',
    photo: '1778409499256-9c921a5f819b',
  },
  {
    quote: 'There is a tiny bubble trapped near the base of mine. I have decided it is my favourite part.',
    name: 'Leo Fischer',
    place: 'Berlin',
    bought: 'Rosewater fluted vase',
    photo: '1585312231361-f7fc3ed720ee',
  },
  {
    quote: 'Writing to them felt like writing to a friend. They sent a photo of my piece cooling in the kiln before it shipped.',
    name: 'Priya Raman',
    place: 'Toronto',
    bought: 'Ember bottle',
    photo: '1710143955354-ee1679036f38',
  },
];
