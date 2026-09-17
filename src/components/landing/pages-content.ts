export const siteNav = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/contact", label: "Contact" },
] as const;

export const legalNav = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export const aboutPage = {
  title: "About Euro Live",
  eyebrow: "Our story",
  intro:
    "Euro Live is a social live entertainment platform built for creators, fans, and the operators who keep the network healthy. Our tagline — Live more together — is the product brief.",
  sections: [
    {
      title: "What we believe",
      body: "Live video is more than a broadcast. It is a room people enter together. Virtual coins and gifts turn attention into recognition. Frames, entries, and badges make status visible. Behind the scenes, resellers and admins keep the economy fair and fast.",
    },
    {
      title: "From vision to platform",
      body: "Rooted in the King Live technical proposal, Euro Live pairs a consumer live experience with operational portals: Master Admin for governance, and Reseller for coin distribution and VIP catalog assignment. The live consumer app ships on its own track; this site is the public face and the door into ops.",
    },
    {
      title: "Who it is for",
      body: "Creators who want a stage. Fans who want to show up. Resellers who serve local coin demand. Staff who need audit trails, roles, and wallet controls. Everyone shares one network — with clear permissions.",
    },
  ],
} as const;

export const featuresPage = {
  title: "Features",
  eyebrow: "Platform",
  intro:
    "Capabilities inspired by leading live social apps — coins, gifts, cosmetics, and operator tools — tailored for Euro Live’s architecture.",
  groups: [
    {
      title: "For creators & fans",
      items: [
        {
          title: "Live rooms",
          body: "Real-time stages where hosts go live and audiences gather — presence first, content second.",
        },
        {
          title: "Coins & gifts",
          body: "Virtual currency that carries emotion. Fans tip energy; creators feel the room respond.",
        },
        {
          title: "VIP cosmetics",
          body: "Frames, entries, and badges that signal status across the profile and the room.",
        },
        {
          title: "PK & competition",
          body: "Battle-style moments that spike engagement — designed for the live product roadmap.",
        },
      ],
    },
    {
      title: "For resellers",
      items: [
        {
          title: "Coin transfer",
          body: "Look up consumers by public ID and transfer coins with idempotent, ledger-backed safety.",
        },
        {
          title: "Catalog assign",
          body: "Assign frames, entries, and badges from the reseller catalog, with duration rules.",
        },
        {
          title: "Limits & reports",
          body: "Daily limits, sales, and commission views so the edge stays measurable.",
        },
      ],
    },
    {
      title: "For operators",
      items: [
        {
          title: "Master Admin",
          body: "Users, resellers, catalog, wallets, staff RBAC, audit logs, and 2FA security.",
        },
        {
          title: "Wallet controls",
          body: "Manual adjust with integer amounts and idempotency — compensation without chaos.",
        },
        {
          title: "Trust & compliance",
          body: "Ban/unban, role gates, and action history so every sensitive write has a trail.",
        },
      ],
    },
  ],
} as const;

export const contactPage = {
  title: "Contact",
  eyebrow: "Talk to us",
  intro:
    "Whether you are exploring a partnership, need portal access, or have a press question — reach the Euro Live team.",
  channels: [
    {
      title: "General",
      detail: "hello@eurolive.app",
      note: "Partnerships, press, and product questions.",
    },
    {
      title: "Operations",
      detail: "ops@eurolive.app",
      note: "Admin staff onboarding and reseller network support.",
    },
    {
      title: "Security",
      detail: "security@eurolive.app",
      note: "Responsible disclosure and account security.",
    },
  ],
  hours: "Weekdays 10:00–18:00 (PKT). We aim to reply within one business day.",
  formNote:
    "Prefer email for now. Portal logins are separate — use Admin or Reseller if you already have credentials.",
} as const;

export const privacyPage = {
  title: "Privacy Policy",
  eyebrow: "Legal",
  updated: "17 September 2026",
  intro:
    "This policy describes how Euro Live (“we”, “us”) handles information when you visit this website or use our Admin and Reseller portals. It is written in plain language similar to policies used by live entertainment platforms.",
  sections: [
    {
      title: "Information we collect",
      body: "Account data (email, username, display name), authentication tokens and session metadata, operational logs (IP, user agent, audit actions), and wallet/ledger records required to run the coin and catalog economy. Marketing pages may collect basic analytics such as page views.",
    },
    {
      title: "How we use information",
      body: "To authenticate staff and resellers, process coin transfers and catalog assignments, enforce roles and daily limits, prevent fraud and abuse, improve product reliability, and communicate about service or security events.",
    },
    {
      title: "Sharing",
      body: "We do not sell personal data. We may share information with infrastructure providers (hosting, databases, email) under contract, or when required by law. Reseller and admin actions may appear in audit logs visible to authorized staff.",
    },
    {
      title: "Retention & security",
      body: "We retain account and ledger data for as long as needed to operate the service and meet legal obligations. Access tokens expire; refresh tokens rotate. Sensitive actions are permission-gated. No method of transmission is 100% secure.",
    },
    {
      title: "Your choices",
      body: "Staff and resellers can request account updates through operations contacts. Consumers should use in-app settings when the consumer product ships. You may contact security@eurolive.app for privacy questions.",
    },
    {
      title: "Children",
      body: "Euro Live portals are not directed at children under 13 (or the applicable age in your region). We do not knowingly collect data from children.",
    },
  ],
} as const;

export const termsPage = {
  title: "Terms of Service",
  eyebrow: "Legal",
  updated: "17 September 2026",
  intro:
    "These Terms govern use of the Euro Live website and the Master Admin / Reseller portals. By accessing the portals you agree to these Terms.",
  sections: [
    {
      title: "Accounts & access",
      body: "Portal accounts are issued by Euro Live operations. You must keep credentials confidential, enable 2FA when offered, and notify us of unauthorized use. Sharing staff tokens across portals (admin vs reseller) is prohibited.",
    },
    {
      title: "Acceptable use",
      body: "Do not abuse APIs, bypass rate or permission limits, manipulate ledgers, assign catalog items fraudulently, or harass users. Coin and catalog actions must follow your granted permissions and daily limits.",
    },
    {
      title: "Virtual currency",
      body: "Coins and diamonds are virtual items with no cash value outside the platform unless we expressly say otherwise. Transfers and assignments are final once recorded on the ledger, except corrections made by authorized staff.",
    },
    {
      title: "Intellectual property",
      body: "Euro Live branding, logo, software, and catalog assets remain our property or that of our licensors. You may not copy or reverse engineer portal software except as allowed by law.",
    },
    {
      title: "Disclaimer & liability",
      body: "Portals are provided “as is.” We are not liable for indirect damages, lost profits, or downtime beyond what applicable law requires. Some features described on marketing pages (live rooms, PK, consumer app) may still be rolling out.",
    },
    {
      title: "Changes",
      body: "We may update these Terms. Continued use after changes means you accept the revised Terms. Material changes will be noted by updating the date above.",
    },
  ],
} as const;
