/**
 * Regional / native-language greeting data.
 *
 * Used to greet visitors in their native language based on Cloudflare IP
 * geolocation (country + region/state). Always resolves to a valid pack;
 * English is the guaranteed fallback when a location is unknown or unmapped.
 */

export type TextDirection = 'ltr' | 'rtl';

export type DayPart = 'morning' | 'afternoon' | 'evening';

export interface GreetingPack {
    /** Stable language key, e.g. 'telugu'. */
    langCode: string;
    /** Human-readable language name in English, e.g. 'Telugu'. */
    langName: string;
    /** Text direction for rendering the native greeting. */
    dir: TextDirection;
    /** Emoji / unicode icon shown alongside the greeting. */
    icon: string;
    /** Native time-based greetings. */
    morning: string;
    afternoon: string;
    evening: string;
    /** Short native "Welcome to Zumasia" subtext. */
    welcome: string;
}

export const DEFAULT_GREETING_PACK: GreetingPack = {
    langCode: 'english',
    langName: 'English',
    dir: 'ltr',
    icon: '👋',
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    welcome: 'Welcome to Zumasia',
};

/**
 * Native greeting packs keyed by language code.
 *
 * Strings are time-based (good morning / afternoon / evening). They should be
 * validated by native speakers before launch; English remains the safe default.
 */
export const LANGUAGE_PACKS: Record<string, GreetingPack> = {
    english: DEFAULT_GREETING_PACK,
    hindi: {
        langCode: 'hindi',
        langName: 'Hindi',
        dir: 'ltr',
        icon: '🙏',
        morning: 'सुप्रभात',
        afternoon: 'नमस्ते',
        evening: 'शुभ संध्या',
        welcome: 'ज़ुमेसिया में आपका स्वागत है',
    },
    telugu: {
        langCode: 'telugu',
        langName: 'Telugu',
        dir: 'ltr',
        icon: '🙏',
        morning: 'శుభోదయం',
        afternoon: 'నమస్కారం',
        evening: 'శుభ సాయంత్రం',
        welcome: 'జుమేసియాకు స్వాగతం',
    },
    kannada: {
        langCode: 'kannada',
        langName: 'Kannada',
        dir: 'ltr',
        icon: '🙏',
        morning: 'ಶುಭೋದಯ',
        afternoon: 'ನಮಸ್ಕಾರ',
        evening: 'ಶುಭ ಸಂಜೆ',
        welcome: 'ಜುಮೇಸಿಯಾಗೆ ಸ್ವಾಗತ',
    },
    marathi: {
        langCode: 'marathi',
        langName: 'Marathi',
        dir: 'ltr',
        icon: '🙏',
        morning: 'सुप्रभात',
        afternoon: 'नमस्कार',
        evening: 'शुभ संध्याकाळ',
        welcome: 'झुमेसियामध्ये आपले स्वागत आहे',
    },
    tamil: {
        langCode: 'tamil',
        langName: 'Tamil',
        dir: 'ltr',
        icon: '🙏',
        morning: 'காலை வணக்கம்',
        afternoon: 'மதிய வணக்கம்',
        evening: 'மாலை வணக்கம்',
        welcome: 'ஜுமேசியாவிற்கு வரவேற்கிறோம்',
    },
    malayalam: {
        langCode: 'malayalam',
        langName: 'Malayalam',
        dir: 'ltr',
        icon: '🙏',
        morning: 'സുപ്രഭാതം',
        afternoon: 'നമസ്കാരം',
        evening: 'ശുഭ സന്ധ്യ',
        welcome: 'സുമേസിയയിലേക്ക് സ്വാഗതം',
    },
    bengali: {
        langCode: 'bengali',
        langName: 'Bengali',
        dir: 'ltr',
        icon: '🙏',
        morning: 'সুপ্রভাত',
        afternoon: 'নমস্কার',
        evening: 'শুভ সন্ধ্যা',
        welcome: 'জুমেসিয়াতে স্বাগতম',
    },
    gujarati: {
        langCode: 'gujarati',
        langName: 'Gujarati',
        dir: 'ltr',
        icon: '🙏',
        morning: 'સુપ્રભાત',
        afternoon: 'નમસ્તે',
        evening: 'શુભ સાંજ',
        welcome: 'ઝુમેસિયામાં આપનું સ્વાગત છે',
    },
    punjabi: {
        langCode: 'punjabi',
        langName: 'Punjabi',
        dir: 'ltr',
        icon: '🙏',
        morning: 'ਸ਼ੁਭ ਸਵੇਰ',
        afternoon: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
        evening: 'ਸ਼ੁਭ ਸ਼ਾਮ',
        welcome: 'ਜ਼ੁਮੇਸੀਆ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ',
    },
    odia: {
        langCode: 'odia',
        langName: 'Odia',
        dir: 'ltr',
        icon: '🙏',
        morning: 'ସୁପ୍ରଭାତ',
        afternoon: 'ନମସ୍କାର',
        evening: 'ଶୁଭ ସନ୍ଧ୍ୟା',
        welcome: 'ଜୁମେସିଆକୁ ସ୍ୱାଗତ',
    },
    assamese: {
        langCode: 'assamese',
        langName: 'Assamese',
        dir: 'ltr',
        icon: '🙏',
        morning: 'শুভ ৰাতিপুৱা',
        afternoon: 'নমস্কাৰ',
        evening: 'শুভ সন্ধিয়া',
        welcome: 'জুমেছিয়ালৈ স্বাগতম',
    },
    french: {
        langCode: 'french',
        langName: 'French',
        dir: 'ltr',
        icon: '👋',
        morning: 'Bonjour',
        afternoon: 'Bon après-midi',
        evening: 'Bonsoir',
        welcome: 'Bienvenue sur Zumasia',
    },
    spanish: {
        langCode: 'spanish',
        langName: 'Spanish',
        dir: 'ltr',
        icon: '👋',
        morning: 'Buenos días',
        afternoon: 'Buenas tardes',
        evening: 'Buenas noches',
        welcome: 'Bienvenido a Zumasia',
    },
    german: {
        langCode: 'german',
        langName: 'German',
        dir: 'ltr',
        icon: '👋',
        morning: 'Guten Morgen',
        afternoon: 'Guten Tag',
        evening: 'Guten Abend',
        welcome: 'Willkommen bei Zumasia',
    },
    portuguese: {
        langCode: 'portuguese',
        langName: 'Portuguese',
        dir: 'ltr',
        icon: '👋',
        morning: 'Bom dia',
        afternoon: 'Boa tarde',
        evening: 'Boa noite',
        welcome: 'Bem-vindo à Zumasia',
    },
    italian: {
        langCode: 'italian',
        langName: 'Italian',
        dir: 'ltr',
        icon: '👋',
        morning: 'Buongiorno',
        afternoon: 'Buon pomeriggio',
        evening: 'Buonasera',
        welcome: 'Benvenuto su Zumasia',
    },
    dutch: {
        langCode: 'dutch',
        langName: 'Dutch',
        dir: 'ltr',
        icon: '👋',
        morning: 'Goedemorgen',
        afternoon: 'Goedemiddag',
        evening: 'Goedenavond',
        welcome: 'Welkom bij Zumasia',
    },
    russian: {
        langCode: 'russian',
        langName: 'Russian',
        dir: 'ltr',
        icon: '👋',
        morning: 'Доброе утро',
        afternoon: 'Добрый день',
        evening: 'Добрый вечер',
        welcome: 'Добро пожаловать в Zumasia',
    },
    turkish: {
        langCode: 'turkish',
        langName: 'Turkish',
        dir: 'ltr',
        icon: '👋',
        morning: 'Günaydın',
        afternoon: 'İyi günler',
        evening: 'İyi akşamlar',
        welcome: "Zumasia'ya hoş geldiniz",
    },
    arabic: {
        langCode: 'arabic',
        langName: 'Arabic',
        dir: 'rtl',
        icon: '👋',
        morning: 'صباح الخير',
        afternoon: 'مساء الخير',
        evening: 'مساء الخير',
        welcome: 'مرحبًا بك في Zumasia',
    },
    japanese: {
        langCode: 'japanese',
        langName: 'Japanese',
        dir: 'ltr',
        icon: '🙇',
        morning: 'おはようございます',
        afternoon: 'こんにちは',
        evening: 'こんばんは',
        welcome: 'Zumasia へようこそ',
    },
    chinese: {
        langCode: 'chinese',
        langName: 'Chinese',
        dir: 'ltr',
        icon: '👋',
        morning: '早上好',
        afternoon: '下午好',
        evening: '晚上好',
        welcome: '欢迎来到 Zumasia',
    },
    korean: {
        langCode: 'korean',
        langName: 'Korean',
        dir: 'ltr',
        icon: '👋',
        morning: '좋은 아침입니다',
        afternoon: '안녕하세요',
        evening: '좋은 저녁입니다',
        welcome: 'Zumasia에 오신 것을 환영합니다',
    },
    indonesian: {
        langCode: 'indonesian',
        langName: 'Indonesian',
        dir: 'ltr',
        icon: '👋',
        morning: 'Selamat pagi',
        afternoon: 'Selamat siang',
        evening: 'Selamat malam',
        welcome: 'Selamat datang di Zumasia',
    },
    thai: {
        langCode: 'thai',
        langName: 'Thai',
        dir: 'ltr',
        icon: '🙏',
        morning: 'สวัสดีตอนเช้า',
        afternoon: 'สวัสดีตอนบ่าย',
        evening: 'สวัสดีตอนเย็น',
        welcome: 'ยินดีต้อนรับสู่ Zumasia',
    },
    vietnamese: {
        langCode: 'vietnamese',
        langName: 'Vietnamese',
        dir: 'ltr',
        icon: '👋',
        morning: 'Chào buổi sáng',
        afternoon: 'Chào buổi chiều',
        evening: 'Chào buổi tối',
        welcome: 'Chào mừng đến với Zumasia',
    },
};

/**
 * Indian state / region name (lowercased) -> language code.
 *
 * Cloudflare's region value is typically the full state name, e.g. "Karnataka".
 * Keys are lowercased for case-insensitive lookup. Hindi-belt states map to Hindi.
 */
export const INDIA_REGION_TO_LANG: Record<string, string> = {
    telangana: 'telugu',
    'andhra pradesh': 'telugu',
    karnataka: 'kannada',
    maharashtra: 'marathi',
    goa: 'marathi',
    'tamil nadu': 'tamil',
    puducherry: 'tamil',
    kerala: 'malayalam',
    lakshadweep: 'malayalam',
    'west bengal': 'bengali',
    tripura: 'bengali',
    gujarat: 'gujarati',
    'dadra and nagar haveli and daman and diu': 'gujarati',
    punjab: 'punjabi',
    chandigarh: 'punjabi',
    odisha: 'odia',
    assam: 'assamese',
    // Hindi-belt states / union territories.
    delhi: 'hindi',
    'national capital territory of delhi': 'hindi',
    'uttar pradesh': 'hindi',
    'madhya pradesh': 'hindi',
    rajasthan: 'hindi',
    bihar: 'hindi',
    jharkhand: 'hindi',
    haryana: 'hindi',
    uttarakhand: 'hindi',
    'himachal pradesh': 'hindi',
    chhattisgarh: 'hindi',
};

/**
 * ISO 3166-1 alpha-2 country code -> language code.
 *
 * India (IN) maps to Hindi as the country-level default; region-level mapping
 * (above) refines it to a state language when region data is available.
 */
export const COUNTRY_TO_LANG: Record<string, string> = {
    IN: 'hindi',
    // English-speaking.
    US: 'english',
    GB: 'english',
    AU: 'english',
    CA: 'english',
    NZ: 'english',
    IE: 'english',
    // French.
    FR: 'french',
    BE: 'french',
    // Spanish.
    ES: 'spanish',
    MX: 'spanish',
    AR: 'spanish',
    CO: 'spanish',
    CL: 'spanish',
    PE: 'spanish',
    // German.
    DE: 'german',
    AT: 'german',
    CH: 'german',
    // Portuguese.
    BR: 'portuguese',
    PT: 'portuguese',
    // Italian.
    IT: 'italian',
    // Dutch.
    NL: 'dutch',
    // Russian.
    RU: 'russian',
    BY: 'russian',
    // Turkish.
    TR: 'turkish',
    // Arabic.
    SA: 'arabic',
    AE: 'arabic',
    EG: 'arabic',
    QA: 'arabic',
    KW: 'arabic',
    // East Asian.
    JP: 'japanese',
    CN: 'chinese',
    TW: 'chinese',
    HK: 'chinese',
    KR: 'korean',
    // Southeast Asian.
    ID: 'indonesian',
    TH: 'thai',
    VN: 'vietnamese',
};

export interface GeoInput {
    /** ISO 3166-1 alpha-2 country code, e.g. 'IN'. May be undefined/empty. */
    country?: string | null;
    /** Region / state name, e.g. 'Karnataka'. May be undefined/empty. */
    region?: string | null;
}

/**
 * Resolve the best greeting pack for a visitor's location.
 *
 * Priority: India + known state -> regional language; else country mapping;
 * else English. Always returns a valid pack.
 */
export function resolveGreeting(geo: GeoInput): GreetingPack {
    const country = geo.country?.trim().toUpperCase();
    const region = geo.region?.trim().toLowerCase();

    if (country === 'IN' && region) {
        const regional = INDIA_REGION_TO_LANG[region];
        if (regional && LANGUAGE_PACKS[regional]) {
            return LANGUAGE_PACKS[regional];
        }
    }

    if (country) {
        const byCountry = COUNTRY_TO_LANG[country];
        if (byCountry && LANGUAGE_PACKS[byCountry]) {
            return LANGUAGE_PACKS[byCountry];
        }
    }

    return DEFAULT_GREETING_PACK;
}

/**
 * Pick a day-part from an hour (0-23) in the visitor's local time.
 * morning: 5-11, afternoon: 12-16, evening: 17-4.
 */
export function dayPartForHour(hour: number): DayPart {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
}

/** Return the native greeting for a pack at a given local hour. */
export function greetingForHour(pack: GreetingPack, hour: number): string {
    return pack[dayPartForHour(hour)];
}
