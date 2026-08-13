export const footerContact = {
  phone: '+63 912 345 6789',
  phoneHref: 'tel:+639123456789',
  email: 'support@quinto.store',
  emailHref: 'mailto:support@quinto.store',
  hours: 'Mon–Sat · 7:00 AM – 6:00 PM',
  address: 'Quinto Store Hub, Cavite Logistics Park',
  mapsHref:
    'https://www.google.com/maps/search/?api=1&query=Cavite+Logistics+Park+Philippines',
  salesEmail: 'wholesale@quinto.store',
  salesEmailHref: 'mailto:wholesale@quinto.store',
}

export const footerSocial = [
  {
    id: 'website',
    label: 'Website',
    href: 'https://retail-elec.vercel.app',
    icon: 'globe',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    icon: 'share',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    icon: 'link',
  },
]

export const resourcePages = {
  shipping: {
    title: 'Shipping Information',
    subtitle: 'How Quinto Store delivers wholesale orders across the region.',
    sections: [
      {
        heading: 'Courier delivery',
        body: 'LTL freight shipping for palletized wholesale orders. Estimated transit is 3–5 business days after your purchase order is confirmed.',
      },
      {
        heading: 'Self-pickup',
        body: 'Orders can be picked up at Quinto Store Hub in Cavite. Dock gates are open 7:00 AM – 6:00 PM, Monday to Saturday.',
      },
      {
        heading: 'Logistics fee',
        body: 'Courier orders include a flat logistics fee shown at checkout. Self-pickup has no logistics fee.',
      },
    ],
  },
  returns: {
    title: 'Returns & Refunds',
    subtitle: 'Clear policies for damaged, incorrect, or incomplete wholesale shipments.',
    sections: [
      {
        heading: 'Damaged goods',
        body: 'Report damaged items within 48 hours of delivery with photos of the packing slip and product condition. Approved claims are replaced or refunded.',
      },
      {
        heading: 'Wrong or incomplete orders',
        body: 'Contact support with your receipt ID. We will arrange a pickup or issue store credit for verified discrepancies.',
      },
      {
        heading: 'Non-returnable items',
        body: 'Opened consumables, custom-cut packs, and clearance lots marked final sale cannot be returned unless defective on arrival.',
      },
    ],
  },
  faq: {
    title: 'Wholesale FAQ',
    subtitle: 'Answers to the questions merchants ask most often.',
    sections: [
      {
        heading: 'Who can open a wholesale account?',
        body: 'Registered businesses with a valid email and contact number can register. Admin approval may be required for high-volume credit terms.',
      },
      {
        heading: 'What payment options are available?',
        body: 'Online payment via PayMongo (card, GCash, Maya, QR Ph) and Cash on Delivery. Online payments receive a small checkout discount.',
      },
      {
        heading: 'How do I track an order?',
        body: 'After checkout, open Notifications for status updates. Admins update orders as Pending, Processing, Shipped, or Delivered.',
      },
    ],
  },
  merchant: {
    title: 'Merchant Portal',
    subtitle: 'Manage catalog browsing, carts, purchase orders, and your business profile.',
    sections: [
      {
        heading: 'What you can do',
        body: 'Browse wholesale categories, submit purchase orders, pay online, update your profile, and receive order notifications.',
      },
      {
        heading: 'Need help?',
        body: 'Email wholesale@quinto.store or call +63 912 345 6789 during business hours for account assistance.',
      },
    ],
    cta: { label: 'Go to shop', to: '/home' },
  },
  locations: {
    title: 'Store Locator',
    subtitle: 'Visit our wholesale hub for self-pickup and merchant support.',
    sections: [
      {
        heading: 'Quinto Store Hub',
        body: 'Cavite Logistics Park · Dock gates open 7:00 AM – 6:00 PM. Bring your receipt ID for faster loading.',
      },
      {
        heading: 'Directions',
        body: 'Use Google Maps for live directions to Cavite Logistics Park. On-site parking is available for vans and light trucks.',
      },
    ],
    showMap: true,
    mapsHref:
      'https://www.google.com/maps/search/?api=1&query=Cavite+Logistics+Park+Philippines',
  },
}

export const legalPages = {
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How Quinto Store collects and uses your account information.',
    sections: [
      {
        heading: 'Information we collect',
        body: 'We collect account details such as name, email, phone, business name, order history, and payment confirmation references needed to fulfill wholesale orders.',
      },
      {
        heading: 'How we use information',
        body: 'Data is used to authenticate users, process orders, send notifications, improve inventory operations, and provide customer support.',
      },
      {
        heading: 'Sharing',
        body: 'Payment processing is handled by PayMongo. We do not sell personal information to third-party marketers.',
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    subtitle: 'Rules for using the Quinto Store wholesale platform.',
    sections: [
      {
        heading: 'Account use',
        body: 'You are responsible for keeping login credentials secure and for all activity under your merchant account.',
      },
      {
        heading: 'Orders and pricing',
        body: 'Listed wholesale prices, discounts, and logistics fees are confirmed at checkout. Orders become binding once submitted or paid online.',
      },
      {
        heading: 'Acceptable use',
        body: 'Do not misuse the platform, attempt unauthorized access, scrape pricing at scale, or place fraudulent purchase orders.',
      },
    ],
  },
  cookies: {
    title: 'Cookie Settings',
    subtitle: 'Control how browsing preferences are stored on this device.',
    sections: [
      {
        heading: 'Essential cookies',
        body: 'Required for sign-in session, cart continuity, and secure checkout. These cannot be turned off while using the store.',
      },
      {
        heading: 'Preference cookies',
        body: 'Remember category selection and cookie consent choices so your next visit feels familiar.',
      },
    ],
    cookieControls: true,
  },
}
