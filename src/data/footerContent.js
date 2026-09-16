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
    subtitle: 'How Quinto Store handles wholesale fulfillment for merchant orders.',
    sections: [
      {
        heading: 'Self-pickup',
        body: 'Orders can be picked up at Quinto Store Hub in Cavite. Dock gates are open 7:00 AM – 6:00 PM, Monday to Saturday. Pickup is free.',
      },
      {
        heading: 'Courier delivery',
        body: 'Courier delivery is available at checkout for a ₱30 delivery fee. The store books the courier after the order is confirmed.',
      },
      {
        heading: 'Order processing',
        body: 'Once an order is submitted, the store prepares the items and updates the order status as it moves from processing to ready for pickup.',
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
    subtitle: 'Effective Date: September 2026',
    sections: [
      {
        heading: 'Our Commitment to Privacy',
        body: 'Quinto Store respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you use our Platform and Services. By using Quinto Store, you acknowledge that you have read and understood this Privacy Policy.',
      },
      {
        heading: '1. Information We Collect',
        body: 'We may collect the following information: full name, email address, mobile number, delivery address, store or business name, username and password, order history, products and quantities ordered, order status and delivery or pickup details, payment status and transaction reference, and customer inquiries and feedback. Online payments may be processed through PayMongo/QRPH. Quinto Store may receive payment status and transaction reference information but does not intentionally store complete payment card details.',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'We may use your information to create and manage your account, process and manage orders, confirm payments, arrange delivery or store pickup, send order and payment notifications, respond to customer concerns, provide promotions, discounts, coupons, and raffle offers, maintain system security and improve our Services, and comply with applicable laws and regulations.',
      },
      {
        heading: '3. Sharing of Information',
        body: 'Quinto Store does not sell or rent your personal information. Information may be shared when necessary with payment providers to process or confirm payments, delivery providers to complete deliveries, technical providers for hosting, security, maintenance, and system support, and government or legal authorities when required by law. Only information necessary for the specific purpose will be shared.',
      },
      {
        heading: '4. Data Security',
        body: 'Quinto Store uses reasonable security measures to protect personal information from unauthorized access, disclosure, alteration, loss, or misuse. These may include password protection, access controls, secure authentication, database protection, and system monitoring. However, no online system can guarantee complete security.',
      },
      {
        heading: '5. Data Retention and Cookies',
        body: 'Personal information will be kept only as long as necessary for providing Services, maintaining order records, meeting legal requirements, and resolving customer concerns. The Platform may also use cookies to maintain sessions, remember preferences, and improve user experience. Users may manage cookies through their browser settings.',
      },
      {
        heading: '6. Your Privacy Rights',
        body: 'Under Republic Act No. 10173 (Data Privacy Act of 2012), users may have the right to access their personal information, request correction of inaccurate information, request deletion when legally permitted, withdraw consent where applicable, and object to certain processing activities. Requests may be submitted using the contact information below.',
      },
      {
        heading: '7. Changes and Contact Us',
        body: 'Quinto Store may update this Privacy Policy when necessary. Updated versions will be posted on the Platform with the revised effective date. For questions, concerns, or privacy requests, contact Quinto Store Data Privacy Contact at quintostore@gmail.com or visit Ibayo Silangan, Naic, Cavite. By using the Quinto Store Platform, you acknowledge that you have read and understood this Privacy Policy.',
      },
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    subtitle: 'Effective Date: September 2026',
    sections: [
      {
        heading: 'Welcome to Quinto Store',
        body: 'Welcome to Quinto Store, a wholesale online grocery store that allows customers to browse products, place wholesale orders, choose delivery or store pickup, and pay online through PayMongo/QRPH. By using the Quinto Store Platform, you agree to these Terms and Conditions.',
      },
      {
        heading: '1. User Accounts',
        body: 'Customers must provide accurate and updated information when creating an account and placing an order. Customers are responsible for keeping their account credentials secure and for all activities under their account.',
      },
      {
        heading: '2. Products and Orders',
        body: 'Quinto Store provides wholesale grocery products, prices, quantities, and product information through the Platform. Product availability and prices may change. Customers are responsible for checking their order details, quantities, delivery or pickup option, and total amount before placing an order. Quinto Store may cancel or reject an order if products are unavailable, information is incorrect, or a system or payment issue occurs.',
      },
      {
        heading: '3. Payment',
        body: 'Customers may pay online through PayMongo/QRPH, where available. Orders will proceed for processing after payment has been successfully confirmed. Payment processing is handled through the applicable payment provider.',
      },
      {
        heading: '4. Delivery and Store Pickup',
        body: 'Customers may choose delivery or store pickup during checkout. For delivery, customers must provide a complete and accurate address and contact information and ensure that someone is available to receive the order. For pickup, customers must collect their order at the designated Quinto Store location during the available pickup schedule.',
      },
      {
        heading: '5. Order Changes and Cancellation',
        body: 'Customers may request changes or cancellation before an order is processed or prepared, subject to Quinto Store approval. Once an order has been prepared, dispatched, or released for pickup, changes or cancellation may no longer be available.',
      },
      {
        heading: '6. Refund Policy',
        body: 'Customers who believe they are eligible for a refund may report their concern through the Live Chat feature of the Quinto Store Platform. The customer must provide the necessary order details and information regarding the reason for the refund request. Quinto Store will review the request and determine whether it qualifies for a refund. If the refund request is approved, the customer must visit the physical Quinto Store location to complete the refund process. Customers may be required to present their order details, proof of payment, and other information necessary to verify the transaction. Refunds will only be processed after the request has been reviewed and approved by Quinto Store.',
      },
      {
        heading: '7. Acceptable Use',
        body: 'Customers must not use the Platform for unlawful activities, provide false information, abuse promotions or discounts, attempt unauthorized access, or interfere with the operation of the system. Violation of these Terms may result in account suspension or termination.',
      },
      {
        heading: '8. Privacy',
        body: 'Quinto Store collects and processes customer information necessary for account management, order processing, payment confirmation, delivery or pickup, refund requests, notifications, and system security. Personal information is handled in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and the Quinto Store Privacy Policy.',
      },
      {
        heading: '9. Contact Information',
        body: 'Quinto Store Support Team: Email quintostore@gmail.com. Address: Ibayo Silangan, Naic, Cavite. These Terms are governed by the laws of the Republic of the Philippines. By using the Quinto Store Platform, you acknowledge that you have read and agreed to these Terms and Conditions.',
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
