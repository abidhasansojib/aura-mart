export interface DistrictInfo {
  name: string;
  bnName: string;
  division: string;
}

export const BANGLADESH_DISTRICTS: DistrictInfo[] = [
  // Rajshahi Division
  { name: "Bogura", bnName: "বগুড়া", division: "Rajshahi" },
  { name: "Rajshahi", bnName: "রাজশাহী", division: "Rajshahi" },
  { name: "Joypurhat", bnName: "জয়পুরহাট", division: "Rajshahi" },
  { name: "Naogaon", bnName: "নওগাঁ", division: "Rajshahi" },
  { name: "Natore", bnName: "নাটোর", division: "Rajshahi" },
  { name: "Chapai Nawabganj", bnName: "চাঁপাইনবাবগঞ্জ", division: "Rajshahi" },
  { name: "Pabna", bnName: "পাবনা", division: "Rajshahi" },
  { name: "Sirajganj", bnName: "সিরাজগঞ্জ", division: "Rajshahi" },

  // Dhaka Division
  { name: "Dhaka", bnName: "ঢাকা", division: "Dhaka" },
  { name: "Gazipur", bnName: "গাজীপুর", division: "Dhaka" },
  { name: "Narayanganj", bnName: "নারায়ণগঞ্জ", division: "Dhaka" },
  { name: "Tangail", bnName: "টাঙ্গাইল", division: "Dhaka" },
  { name: "Kishoreganj", bnName: "কিশোরগঞ্জ", division: "Dhaka" },
  { name: "Manikganj", bnName: "মানিকগঞ্জ", division: "Dhaka" },
  { name: "Munshiganj", bnName: "মুন্সীগঞ্জ", division: "Dhaka" },
  { name: "Narsingdi", bnName: "নরসিংদী", division: "Dhaka" },
  { name: "Faridpur", bnName: "ফরিদপুর", division: "Dhaka" },
  { name: "Gopalganj", bnName: "গোপালগঞ্জ", division: "Dhaka" },
  { name: "Madaripur", bnName: "মাদারীপুর", division: "Dhaka" },
  { name: "Rajbari", bnName: "রাজবাড়ী", division: "Dhaka" },
  { name: "Shariatpur", bnName: "শরীয়তপুর", division: "Dhaka" },

  // Chittagong Division
  { name: "Chattogram", bnName: "চট্টগ্রাম", division: "Chattogram" },
  { name: "Cox's Bazar", bnName: "কক্সবাজার", division: "Chattogram" },
  { name: "Cumilla", bnName: "কুমিল্লা", division: "Chattogram" },
  { name: "Feni", bnName: "ফেনী", division: "Chattogram" },
  { name: "Brahmanbaria", bnName: "ব্রাহ্মণবাড়িয়া", division: "Chattogram" },
  { name: "Chandpur", bnName: "চাঁদপুর", division: "Chattogram" },
  { name: "Lakshmipur", bnName: "লক্ষ্মীপুর", division: "Chattogram" },
  { name: "Noakhali", bnName: "নোয়াখালী", division: "Chattogram" },
  { name: "Bandarban", bnName: "বান্দরবান", division: "Chattogram" },
  { name: "Khagrachhari", bnName: "খাগড়াছড়ি", division: "Chattogram" },
  { name: "Rangamati", bnName: "রাঙ্গামাটি", division: "Chattogram" },

  // Khulna Division
  { name: "Khulna", bnName: "খুলনা", division: "Khulna" },
  { name: "Bagerhat", bnName: "বাগেরহাট", division: "Khulna" },
  { name: "Chuadanga", bnName: "চুয়াডাঙ্গা", division: "Khulna" },
  { name: "Jashore", bnName: "যশোর", division: "Khulna" },
  { name: "Jhenaidah", bnName: "ঝিনাইদহ", division: "Khulna" },
  { name: "Kushtia", bnName: "কুষ্টিয়া", division: "Khulna" },
  { name: "Magura", bnName: "মাগুরা", division: "Khulna" },
  { name: "Meherpur", bnName: "মেহেরপুর", division: "Khulna" },
  { name: "Narail", bnName: "নড়াইল", division: "Khulna" },
  { name: "Satkhira", bnName: "সাতক্ষীরা", division: "Khulna" },

  // Sylhet Division
  { name: "Sylhet", bnName: "সিলেট", division: "Sylhet" },
  { name: "Moulvibazar", bnName: "মৌলভীবাজার", division: "Sylhet" },
  { name: "Habiganj", bnName: "হবিগঞ্জ", division: "Sylhet" },
  { name: "Sunamganj", bnName: "সুনামগঞ্জ", division: "Sylhet" },

  // Rangpur Division
  { name: "Rangpur", bnName: "রংপুর", division: "Rangpur" },
  { name: "Dinajpur", bnName: "দিনাজপুর", division: "Rangpur" },
  { name: "Gaibandha", bnName: "গাইবান্ধা", division: "Rangpur" },
  { name: "Kurigram", bnName: "কুড়িগ্রাম", division: "Rangpur" },
  { name: "Lalmonirhat", bnName: "লালমনিরহাট", division: "Rangpur" },
  { name: "Nilphamari", bnName: "নীলফামারী", division: "Rangpur" },
  { name: "Panchagarh", bnName: "পঞ্চগড়", division: "Rangpur" },
  { name: "Thakurgaon", bnName: "ঠাকুরগাঁও", division: "Rangpur" },

  // Barishal Division
  { name: "Barishal", bnName: "বরিশাল", division: "Barishal" },
  { name: "Barguna", bnName: "বরগুনা", division: "Barishal" },
  { name: "Bhola", bnName: "ভোলা", division: "Barishal" },
  { name: "Jhalokati", bnName: "ঝালকাঠি", division: "Barishal" },
  { name: "Patuakhali", bnName: "পটুয়াখালী", division: "Barishal" },
  { name: "Pirojpur", bnName: "পিরোজপুর", division: "Barishal" },

  // Mymensingh Division
  { name: "Mymensingh", bnName: "ময়মনসিংহ", division: "Mymensingh" },
  { name: "Jamalpur", bnName: "জামালপুর", division: "Mymensingh" },
  { name: "Netrokona", bnName: "নেত্রকোণা", division: "Mymensingh" },
  { name: "Sherpur", bnName: "শেরপুর", division: "Mymensingh" },
];

// Common Bangladesh city spelling variations & aliases
const DISTRICT_ALIASES: Record<string, string[]> = {
  bogura: ["bogura", "bogra", "বগুড়া"],
  dhaka: ["dhaka", "ঢাকা", "dacca"],
  chattogram: ["chattogram", "chittagong", "চট্টগ্রাম"],
  cumilla: ["cumilla", "comilla", "কুমিল্লা"],
  barishal: ["barishal", "barisal", "বরিশাল"],
  jashore: ["jashore", "jessore", "যশোর"],
};

/**
 * Check whether a chosen district is inside the shop's local city zone
 */
export function isInsideLocalCity(districtName: string, shopCity: string = "Bogura"): boolean {
  if (!districtName || !shopCity) return false;
  const dNorm = districtName.trim().toLowerCase();
  const cNorm = shopCity.trim().toLowerCase();

  if (dNorm === cNorm || dNorm.includes(cNorm) || cNorm.includes(dNorm)) {
    return true;
  }

  // Check alias groups (e.g. Bogra <-> Bogura, Chittagong <-> Chattogram)
  for (const group of Object.values(DISTRICT_ALIASES)) {
    const dMatches = group.some((alias) => dNorm.includes(alias) || alias.includes(dNorm));
    const cMatches = group.some((alias) => cNorm.includes(alias) || alias.includes(cNorm));
    if (dMatches && cMatches) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate realistic delivery turnaround for Bangladesh districts
 */
export function getEstimatedDeliveryTurnaround(
  districtName: string,
  shopCity: string = "Bogura"
): { days: string; badge: string } {
  if (isInsideLocalCity(districtName, shopCity)) {
    return {
      days: "Same Day / 24 Hours",
      badge: "⚡ Fast Local Express",
    };
  }

  const dNorm = districtName.toLowerCase();
  if (dNorm === "dhaka" || dNorm === "gazipur" || dNorm === "narayanganj") {
    return {
      days: "24–48 Hours",
      badge: "🚚 Major Hub Express",
    };
  }

  return {
    days: "48–72 Hours",
    badge: "📦 Nationwide Courier",
  };
}
