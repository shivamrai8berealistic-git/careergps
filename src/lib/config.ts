export const SITE_CONFIG = {
  name: "CareerPilot AI",
  description: "Landing your next dream job with smart match analysis.",
  supportEmail: "support@careerpilotai.com",
  adminEmail: "admin@careerpilotai.com", // Change to official admin email
  socials: {
    discord: "https://discord.gg/careerpilotai",
    twitter: "https://twitter.com/careerpilotai",
    linkedin: "https://linkedin.com/company/careerpilotai",
  },
  plans: {
    monthly: {
      id: "plan_1m",
      name: "1 Month",
      price: 299,
      duration: 1,
      savings: null,
    },
    quarterly: {
      id: "plan_3m",
      name: "3 Months",
      price: 799,
      duration: 3,
      savings: "11%",
    },
    halfYearly: {
      id: "plan_6m",
      name: "6 Months",
      price: 1499,
      duration: 6,
      savings: "16%",
    },
  },
  security: {
    recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "",
  }
};
