// Flag emoji per country name (uppercase key, matching how the journal
// databases store country names). Falls back to a globe icon for anything
// not in this list rather than guessing.
export const COUNTRY_FLAGS: Record<string, string> = {
  INDIA: "🇮🇳", INDONESIA: "🇮🇩", NIGERIA: "🇳🇬", IRAN: "🇮🇷", "IRAN, ISLAMIC REPUBLIC OF": "🇮🇷",
  MALAYSIA: "🇲🇾", PAKISTAN: "🇵🇰", BANGLADESH: "🇧🇩", "UNITED STATES": "🇺🇸", "UNITED STATES OF AMERICA": "🇺🇸",
  "UNITED KINGDOM": "🇬🇧", CHINA: "🇨🇳", PHILIPPINES: "🇵🇭", EGYPT: "🇪🇬", "SAUDI ARABIA": "🇸🇦",
  "UNITED ARAB EMIRATES": "🇦🇪", "SOUTH AFRICA": "🇿🇦", KENYA: "🇰🇪", GHANA: "🇬🇭", ETHIOPIA: "🇪🇹",
  IRAQ: "🇮🇶", TURKEY: "🇹🇷", VIETNAM: "🇻🇳", THAILAND: "🇹🇭", "SRI LANKA": "🇱🇰", NEPAL: "🇳🇵",
  MOROCCO: "🇲🇦", ALGERIA: "🇩🇿", TUNISIA: "🇹🇳", JORDAN: "🇯🇴", YEMEN: "🇾🇪", SUDAN: "🇸🇩",
  UGANDA: "🇺🇬", TANZANIA: "🇹🇿", CAMEROON: "🇨🇲", "IVORY COAST": "🇨🇮", ZIMBABWE: "🇿🇼", ZAMBIA: "🇿🇲",
  CANADA: "🇨🇦", AUSTRALIA: "🇦🇺", GERMANY: "🇩🇪", FRANCE: "🇫🇷", ITALY: "🇮🇹", SPAIN: "🇪🇸",
  BRAZIL: "🇧🇷", MEXICO: "🇲🇽", RUSSIA: "🇷🇺", "SOUTH KOREA": "🇰🇷", JAPAN: "🇯🇵", SINGAPORE: "🇸🇬",
  AFGHANISTAN: "🇦🇫", MYANMAR: "🇲🇲", CAMBODIA: "🇰🇭", "SOUTH SUDAN": "🇸🇸", LIBYA: "🇱🇾", SYRIA: "🇸🇾",
  LEBANON: "🇱🇧", OMAN: "🇴🇲", QATAR: "🇶🇦", KUWAIT: "🇰🇼", BAHRAIN: "🇧🇭", ISRAEL: "🇮🇱",
  POLAND: "🇵🇱", NETHERLANDS: "🇳🇱", BELGIUM: "🇧🇪", SWEDEN: "🇸🇪", NORWAY: "🇳🇴", DENMARK: "🇩🇰",
  "NEW ZEALAND": "🇳🇿", ARGENTINA: "🇦🇷", COLOMBIA: "🇨🇴", PERU: "🇵🇪", CHILE: "🇨🇱",
};

export function countryFlag(name: string): string {
  return COUNTRY_FLAGS[name.toUpperCase()] || "🌐";
}

export function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
