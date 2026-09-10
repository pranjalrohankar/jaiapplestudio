import fallbackData from "../../data/social.json";

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
};

export type SocialData = {
  socialLinks: SocialLink[];
};

export const defaultSocialLinks: SocialLink[] = (fallbackData.socialLinks as SocialLink[]) || [
  {
    id: "facebook",
    platform: "Facebook",
    url: "https://facebook.com",
    isActive: true,
  },
  {
    id: "instagram",
    platform: "Instagram",
    url: "https://instagram.com",
    isActive: true,
  },
  {
    id: "x",
    platform: "X (Twitter)",
    url: "",
    isActive: false,
  },
  {
    id: "youtube",
    platform: "YouTube",
    url: "",
    isActive: false,
  },
  {
    id: "whatsapp",
    platform: "WhatsApp Channel",
    url: "",
    isActive: false,
  },
  {
    id: "threads",
    platform: "Threads",
    url: "",
    isActive: false,
  },
];

export const defaultSocialData: SocialData = {
  socialLinks: defaultSocialLinks,
};
