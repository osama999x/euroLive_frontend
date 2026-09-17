export const landing = {
  tagline: "LIVE MORE TOGETHER",
  headline: "Where live moments turn into community",
  support:
    "Euro Live is a social live stage — creators go live, fans show up, and energy moves through coins, gifts, and status.",
  story: {
    title: "Built for the live economy",
    body: "From the King Live technical vision: rooms where people gather in real time, virtual currency that carries emotion, and cosmetics that mark presence. Resellers keep coin supply flowing. Master Admin keeps the network trusted.",
  },
  market: {
    title: "The live stage is still accelerating",
    subtitle:
      "Industry context for why coin-powered live entertainment keeps growing — not Euro Live user counts.",
    stats: [
      {
        id: "streaming",
        value: 97,
        suffix: "B",
        prefix: "$",
        label: "Projected global live streaming market, 2026",
        source: "Mordor Intelligence",
        href: "https://www.mordorintelligence.com/industry-reports/live-streaming-market",
      },
      {
        id: "cagr",
        value: 27,
        suffix: "%",
        prefix: "",
        label: "Approx. CAGR for live streaming through 2031",
        source: "Mordor Intelligence",
        href: "https://www.mordorintelligence.com/industry-reports/live-streaming-market",
      },
      {
        id: "rewards",
        value: 49,
        suffix: "B",
        prefix: "$",
        label: "Live-streaming reward / gift platforms, 2025",
        source: "PW Consulting",
        href: "https://pmarketresearch.com/worldwide-live-streaming-reward-platform-market-research/",
      },
    ],
    footnote:
      "Category figures only. TikTok-class coin/gift loops (≈$6B in 2024 purchases, industry coverage) show how virtual currency fuels live engagement — Euro Live builds that loop for its own community.",
  },
  pillars: [
    {
      title: "Live & together",
      body: "Rooms, presence, and shared moments — the heart of “Live more together.” Fans don’t just watch; they arrive.",
    },
    {
      title: "Coin economy",
      body: "Integer coin balances, transfers, and ledgers. Energy becomes currency; currency becomes recognition.",
    },
    {
      title: "VIP catalog",
      body: "Frames, entries, and badges with clear pricing and expiry — status that travels with the profile.",
    },
    {
      title: "Trusted ops",
      body: "Master Admin runs users, resellers, wallets, and audit. Resellers recharge and assign — permissioned and limited.",
    },
  ],
  portals: {
    title: "Two doors into the network",
    subtitle: "Portals for operators and the reseller edge — consumer live app ships separately.",
    items: [
      {
        title: "Master Admin",
        body: "Dashboard, users, resellers, catalog, wallets, staff roles, audit, and security.",
        href: "/admin/login",
        cta: "Admin Portal",
      },
      {
        title: "Reseller",
        body: "Wallet, coin transfer by public ID, catalog assigns, limits, transactions, and reports.",
        href: "/reseller/login",
        cta: "Reseller Portal",
      },
    ],
  },
  sources: [
    {
      name: "Mordor Intelligence — Live Streaming Market",
      href: "https://www.mordorintelligence.com/industry-reports/live-streaming-market",
    },
    {
      name: "PW Consulting — Live Streaming Reward Platforms",
      href: "https://pmarketresearch.com/worldwide-live-streaming-reward-platform-market-research/",
    },
    {
      name: "TTS Vibes — TikTok Coins Statistics 2025",
      href: "https://insights.ttsvibes.com/tiktok-coins/",
    },
  ],
} as const;
