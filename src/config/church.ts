// ============================================================
// CHURCH CONFIG — Edit here to customize for any church
// ============================================================
// This is the single source of truth for all church content.
// Change these values to rebrand for a different church.
// ============================================================

export const churchConfig = {
  // --- Identity ---
  name: "God's Sign of Calling Revival Ministries",
  tagline: 'Reviving lives. Serving communities. Proclaiming the Kingdom.',
  scripture: {
    text: 'The Lord is my light and my salvation—whom shall I fear?',
    reference: 'Psalm 27:1',
  },

  // --- Contact ---
  address: 'Entebbe–Bwebajja, Uganda',
  phone: '0705538564',
  email: '',

  // --- Service Times ---
  serviceTimes: [
    { day: 'Sunday', time: '8:00 AM – 10:00 AM', label: 'Morning Service', location: '' },
    { day: 'Sunday', time: '10:00 AM – 3:00 PM', label: 'Main Service', location: '' },
    { day: 'Sunday', time: '4:00 PM – 6:00 PM', label: "Ministers' Service", location: '' },
    { day: 'Tuesday', time: '5:00 PM – 9:30 PM', label: 'Financial Breakthrough', location: '' },
    { day: 'Thursday', time: '5:00 PM – 9:30 PM', label: 'Deliverance Service', location: '' },
    { day: 'Saturday', time: '2:00 PM', label: 'Counselling', location: '' },
    { day: '2nd Friday of every month', time: 'Overnight', label: 'Overnight Prayer', location: '' },
  ],

  // --- Social Media ---
  social: {
    facebook: '#',
    instagram: '#',
    youtube: '#',
    twitter: '#',
  },

  // --- Live Stream ---
  // Set isLive: true to show the "Live Now" badge in the hero
  isLive: false,
  liveStreamUrl: '#',

  // --- Hero ---
  hero: {
    preHeading: 'Psalm 27:1',
    heading: 'A Place to Belong, A Calling to Serve.',
    subheading:
      'A born-again Christian ministry based in Entebbe–Bwebajja, Uganda. We follow Jesus by serving people, strengthening communities, and sharing the good news of the Kingdom.',
    ctaPrimary: { label: 'Join Us Sunday', href: '#service-times' },
    ctaSecondary: { label: 'Explore Our Ministries', href: '/ministries' },
  },

  // --- About ---
  about: {
    heading: 'Called to Revival. Rooted in Service.',
    scriptureQuote: {
      text: 'The Lord is my light and my salvation—whom shall I fear?',
      reference: 'Psalm 27:1',
    },
    mission:
      'To follow our Lord and Savior Jesus Christ in working with the poor, promoting human transformation, and bearing witness to the good news of the Kingdom of God.',
    vision:
      'Establishing the Kingdom of God locally, nationally, and globally.',
  },
};

export type ChurchConfig = typeof churchConfig;
