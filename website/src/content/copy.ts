/**
 * Marketing copy — Mentismint page rhythm, Mframapa product truth.
 * Plain language. No long dashes. No leading dots on labels.
 * Say “air quality”, not vague “air”.
 */

export const copy = {
  nav: {
    cta: 'Open the app',
  },

  hero: {
    title: 'Know the quality of your air.',
    sub: 'Mframapa shows today’s air quality for your city, the next few days, and warns you when dust is coming. Free on your phone and in the browser.',
    cta: 'Open the app',
  },

  story: {
    body: 'Air quality, but finally understandable. Open any African city and see if the air is good or bad today, what the next few days look like, and get a phone alert when dusty harmattan air is on the way. Built for people who do not have a sensor on their street.',
  },

  helps: {
    title: 'Mframapa helps you…',
    items: [
      {
        title: 'See today’s air quality',
        body: 'A clear reading for cities across Africa, even where there is no local air sensor.',
      },
      {
        title: 'Plan the next few days',
        body: 'Day by day outlook, so you know when outdoor time is a bad idea.',
      },
      {
        title: 'Catch dust early',
        body: 'A notification when dusty or smoky air is coming. Not daily spam.',
      },
      {
        title: 'Stay ready offline',
        body: 'Cities you save stay readable when mobile data drops.',
      },
    ],
  },

  how: {
    steps: [
      {
        id: 'check' as const,
        screen: 'home' as const,
        step: 'Step 1',
        title: 'Open a city',
        body: 'Pick Accra, Kumasi, or search another place. You see today’s air quality and a short note on what to do.',
      },
      {
        id: 'map' as const,
        screen: 'map' as const,
        step: 'Step 2',
        title: 'Browse the map',
        body: 'Move across Africa, search a city, or tap a place to open its air quality reading.',
      },
      {
        id: 'alerts' as const,
        screen: 'alerts' as const,
        step: 'Step 3',
        title: 'Turn on dust alerts',
        body: 'We send a phone notification when dusty air is coming to your city.',
      },
    ],
  },

  locations: {
    label: 'Locations',
    title: 'Team in Accra, Ghana. Cities covered across Africa.',
  },

  closing: {
    title:
      'Use Mframapa to check air quality, plan the week, and get warned when dust is coming.',
    cta: 'Open the app',
  },

  about: {
    label: 'Company',
    title: 'Air quality readings people can use today.',
    left: [
      'Mframapa is built in Accra, Ghana. Most people here have no air sensor nearby, but dusty harmattan days and smoke still affect school, work, and health.',
      'We use satellite and weather data to show how clean or dirty the air is in a city, in words anyone can read.',
    ],
    right: [
      'The app is free for everyone. Schools, clinics, and other organisations can pay for wider access for their teams.',
      'We are starting with people in Ghana, then covering more African cities.',
    ],
    cta: 'Email the team →',
    tryTitle: 'Use the app now',
    tryBody:
      'The live app is at mframapa.live. Store buttons on the home page will work when those listings publish.',
    tryLink: 'Open the app →',
  },

  support: {
    label: 'Support',
    title: 'Support',
    sub: 'Email support@mframapa.live. We reply to every message.',
    cards: [
      {
        title: 'General',
        body: 'How the app works, which cities we cover, or whether it fits your school or clinic.',
        cta: 'Ask a question →',
      },
      {
        title: 'Help',
        body: 'Something broken, a wrong reading, login trouble, or alert problems.',
        cta: 'Report a problem →',
      },
    ],
  },

  floats: {
    citiesLabel: 'Saved cities',
    trendLabel: 'This week',
    askTitle: 'Dust alert',
    askSub: 'Kumasi, next 2 days',
  },
} as const
