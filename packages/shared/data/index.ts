import {
  BankItem,
  TaskStatus,
  Tag,
  Lang,
  TaskSort,
  TaskFilters,
  TasksTab,
  FilterType,
} from "shared/index";

export const MESSAGE_MAX_LENGTH = 1000;

export const RESEND_COOLDOWN_SECONDS = 60;

export const RESET_LINK_TTL_MINUTES = 15;

export const COUNTRY_CODES_LIST = ["fi"];

export const COUNTRY_PREFIX_IBAN = "FI";

export const IBAN_DIGIT_LENGTH = 16;

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const APP_NAME = "Taskly";

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Find Taskers", href: "/users" },
  { label: "Browse Tasks", href: "/tasks" },
  { label: "Top Taskers", href: "/top" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Statistics", href: "/stats" },
];

export const CHAT_PAGE_META: Record<
  Lang,
  { title: (name: string) => string; description: (name: string) => string }
> = {
  en: {
    title: (name) => `${name}'s chat`,
    description: (name) => `Your conversation with ${name}`,
  },
  "fi-FI": {
    title: (name) => `Keskustelu: ${name}`,
    description: (name) => `Keskustelusi: ${name}`,
  },
  "sv-FI": {
    title: (name) => `${name}s chatt`,
    description: (name) => `Din konversation med ${name}`,
  },
};

export const PAGES_META: Record<
  string,
  Record<Lang, { title: string; description: string }>
> = {
  "": {
    en: {
      title: "Home",
      description:
        "Stay connected, manage your conversations, organize your tasks, and keep everything you need in one place.",
    },
    "fi-FI": {
      title: "Etusivu",
      description:
        "Pidä yhteyttä, hallitse keskustelujasi, järjestä tehtäväsi ja pidä kaikki tarvitsemasi yhdessä paikassa.",
    },
    "sv-FI": {
      title: "Hem",
      description:
        "Håll kontakten, hantera dina konversationer, organisera dina uppgifter och samla allt du behöver på ett ställe.",
    },
  },

  account: {
    en: {
      title: "Account",
      description:
        "Manage your account information, personal preferences, and other settings connected to your account.",
    },
    "fi-FI": {
      title: "Tili",
      description:
        "Hallitse tilisi tietoja, henkilökohtaisia asetuksiasi ja muita tiliisi liittyviä asetuksia.",
    },
    "sv-FI": {
      title: "Konto",
      description:
        "Hantera din kontoinformation, personliga inställningar och andra inställningar som hör till ditt konto.",
    },
  },

  chats: {
    en: {
      title: "Chats",
      description:
        "View and manage your conversations, keep in touch with others, and easily find your recent messages.",
    },
    "fi-FI": {
      title: "Keskustelut",
      description:
        "Katso ja hallitse keskustelujasi, pidä yhteyttä muihin ja löydä viimeisimmät viestisi helposti.",
    },
    "sv-FI": {
      title: "Chattar",
      description:
        "Visa och hantera dina konversationer, håll kontakten med andra och hitta enkelt dina senaste meddelanden.",
    },
  },

  dashboard: {
    en: {
      title: "Dashboard",
      description:
        "Get an overview of your activity and quickly access the tools, information, and features you use most.",
    },
    "fi-FI": {
      title: "Hallintapaneeli",
      description:
        "Saat yleiskuvan toiminnastasi ja pääset nopeasti käyttämiisi työkaluihin, tietoihin ja ominaisuuksiin.",
    },
    "sv-FI": {
      title: "Instrumentpanel",
      description:
        "Få en överblick över din aktivitet och snabb åtkomst till de verktyg, den information och de funktioner du använder mest.",
    },
  },

  "forgot-password": {
    en: {
      title: "Forgot Password",
      description:
        "Reset your password securely and regain access to your account in just a few steps.",
    },
    "fi-FI": {
      title: "Unohtunut salasana",
      description:
        "Nollaa salasanasi turvallisesti ja palauta pääsy tilillesi muutamassa vaiheessa.",
    },
    "sv-FI": {
      title: "Glömt lösenord",
      description:
        "Återställ ditt lösenord på ett säkert sätt och få tillbaka åtkomsten till ditt konto på några enkla steg.",
    },
  },

  login: {
    en: {
      title: "Log In",
      description:
        "Log in to your account to access your conversations, tasks, profile, and personalized settings.",
    },
    "fi-FI": {
      title: "Kirjaudu sisään",
      description:
        "Kirjaudu tilillesi käyttääksesi keskustelujasi, tehtäviäsi, profiiliasi ja henkilökohtaisia asetuksiasi.",
    },
    "sv-FI": {
      title: "Logga in",
      description:
        "Logga in på ditt konto för att komma åt dina konversationer, uppgifter, profil och personliga inställningar.",
    },
  },

  privacy: {
    en: {
      title: "Privacy Policy",
      description:
        "Learn how your information is collected, used, stored, and protected, and understand your privacy choices.",
    },
    "fi-FI": {
      title: "Tietosuojakäytäntö",
      description:
        "Lue, miten tietojasi kerätään, käytetään, säilytetään ja suojataan sekä millaisia tietosuojaan liittyviä valintoja sinulla on.",
    },
    "sv-FI": {
      title: "Integritetspolicy",
      description:
        "Läs om hur dina uppgifter samlas in, används, lagras och skyddas samt vilka val du har när det gäller din integritet.",
    },
  },

  profile: {
    en: {
      title: "Profile",
      description:
        "View and manage your profile, personal information, and the details you choose to share with others.",
    },
    "fi-FI": {
      title: "Profiili",
      description:
        "Katso ja hallitse profiiliasi, henkilötietojasi ja tietoja, jotka haluat jakaa muiden kanssa.",
    },
    "sv-FI": {
      title: "Profil",
      description:
        "Visa och hantera din profil, personliga information och de uppgifter du väljer att dela med andra.",
    },
  },

  register: {
    en: {
      title: "Create an Account",
      description:
        "Create your account and get started with conversations, tasks, personalized settings, and more.",
    },
    "fi-FI": {
      title: "Luo tili",
      description:
        "Luo oma tilisi ja aloita keskustelujen, tehtävien, henkilökohtaisten asetusten ja muiden ominaisuuksien käyttö.",
    },
    "sv-FI": {
      title: "Skapa ett konto",
      description:
        "Skapa ditt konto och kom igång med konversationer, uppgifter, personliga inställningar och mer.",
    },
  },

  settings: {
    en: {
      title: "Settings",
      description:
        "Customize your experience, manage your preferences, and control the settings connected to your account.",
    },
    "fi-FI": {
      title: "Asetukset",
      description:
        "Mukauta käyttökokemustasi, hallitse asetuksiasi ja säädä tiliisi liittyviä toimintoja.",
    },
    "sv-FI": {
      title: "Inställningar",
      description:
        "Anpassa din upplevelse, hantera dina inställningar och kontrollera funktionerna som är kopplade till ditt konto.",
    },
  },

  tasks: {
    en: {
      title: "Tasks",
      description:
        "Create, organize, and manage your tasks so you can keep track of what needs to be done.",
    },
    "fi-FI": {
      title: "Tehtävät",
      description:
        "Luo, järjestä ja hallitse tehtäviäsi, jotta pysyt helposti ajan tasalla siitä, mitä pitää tehdä.",
    },
    "sv-FI": {
      title: "Uppgifter",
      description:
        "Skapa, organisera och hantera dina uppgifter så att du enkelt kan hålla koll på det som behöver göras.",
    },
  },

  error: {
    en: {
      title: "Something Went Wrong",
      description: "An unexpected error occurred. Please try again.",
    },
    "fi-FI": {
      title: "Jokin meni pieleen",
      description: "Tapahtui odottamaton virhe. Yritä uudelleen.",
    },
    "sv-FI": {
      title: "Något gick fel",
      description: "Ett oväntat fel inträffade. Försök igen.",
    },
  },

  "not-found": {
    en: {
      title: "Page Not Found",
      description:
        "The page you're looking for doesn't exist or may have been moved.",
    },
    "fi-FI": {
      title: "Sivua ei löytynyt",
      description: "Etsimääsi sivua ei ole olemassa tai se on ehkä siirretty.",
    },
    "sv-FI": {
      title: "Sidan hittades inte",
      description: "Sidan du söker finns inte eller kan ha flyttats.",
    },
  },

  help: {
    en: {
      title: "Help",
      description:
        "Get help with your account, conversations, tasks, or other features.",
    },
    "fi-FI": {
      title: "Ohje",
      description:
        "Ota apua tilisi, keskusteluista, tehtävistä tai muista ominaisuuksista.",
    },
    "sv-FI": {
      title: "Hjalp",
      description:
        "Få hjalp med ditt konto, konversationer, uppgifter eller andra funktioner.",
    },
  },
};

export const FINNISH_BANKS: BankItem[] = [
  { value: "op", label: "OP", src: "/banks/fi-op.svg" },
  { value: "nordea", label: "Nordea", src: "/banks/fi-nordea.svg" },
  { value: "s-pankki", label: "S-Pankki", src: "/banks/fi-spankki.svg" },
  {
    value: "danskebank",
    label: "Danske Bank",
    src: "/banks/fi-danskebank.svg",
  },
  {
    value: "saastopankki",
    label: "Säästöpankki",
    src: "/banks/fi-saastopankki.svg",
  },
  { value: "pop", label: "POP Pankki", src: "/banks/fi-pop.svg" },
  { value: "aktia", label: "Aktia", src: "/banks/fi-aktia.svg" },
  { value: "omasp", label: "OmaSp", src: "/banks/fi-omasp.svg" },
  {
    value: "alandsbanken",
    label: "Ålandsbanken",
    src: "/banks/fi-alandsbanken.svg",
  },
];

export const FINNISH_BANKS_VALUES: BankItem["value"][] = FINNISH_BANKS.map(
  (b) => b.value,
);

export const LANGS: Tag[] = [
  { value: "en", label: "general.english" },
  { value: "fi-FI", label: "general.finnish" },
  { value: "sv-FI", label: "general.swedish" },
];

export const WORLD_LANGUAGES: Tag[] = [
  { value: "fi", label: "general.finnish" },
  { value: "sv", label: "general.swedish" },
  { value: "en", label: "general.english" },
  { value: "ru", label: "general.russian" },
  { value: "et", label: "general.estonian" },
  { value: "ar", label: "general.arabic" },
  { value: "so", label: "general.somali" },
  { value: "fr", label: "general.french" },
  { value: "de", label: "general.german" },
  { value: "es", label: "general.spanish" },
  { value: "it", label: "general.italian" },
  { value: "pt", label: "general.portuguese" },
  { value: "pl", label: "general.polish" },
  { value: "uk", label: "general.ukrainian" },
  { value: "zh", label: "general.chinese" },
  { value: "ja", label: "general.japanese" },
  { value: "ko", label: "general.korean" },
  { value: "tr", label: "general.turkish" },
  { value: "fa", label: "general.persian" },
  { value: "hi", label: "general.hindi" },
  { value: "bn", label: "general.bengali" },
  { value: "ur", label: "general.urdu" },
  { value: "vi", label: "general.vietnamese" },
  { value: "th", label: "general.thai" },
  { value: "nl", label: "general.dutch" },
  { value: "ro", label: "general.romanian" },
  { value: "hu", label: "general.hungarian" },
  { value: "cs", label: "general.czech" },
  { value: "sk", label: "general.slovak" },
  { value: "bg", label: "general.bulgarian" },
  { value: "hr", label: "general.croatian" },
  { value: "sr", label: "general.serbian" },
  { value: "da", label: "general.danish" },
  { value: "no", label: "general.norwegian" },
  { value: "lt", label: "general.lithuanian" },
  { value: "lv", label: "general.latvian" },
  { value: "el", label: "general.greek" },
  { value: "he", label: "general.hebrew" },
  { value: "id", label: "general.indonesian" },
  { value: "ms", label: "general.malay" },
  { value: "tl", label: "general.filipino" },
  { value: "sw", label: "general.swahili" },
  { value: "am", label: "general.amharic" },
  { value: "ku", label: "general.kurdish" },
  { value: "az", label: "general.azerbaijani" },
  { value: "ka", label: "general.georgian" },
  { value: "hy", label: "general.armenian" },
  { value: "mn", label: "general.mongolian" },
  { value: "kk", label: "general.kazakh" },
  { value: "uz", label: "general.uzbek" },
];

export const CERF_LEVELS: {
  value: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  label: string;
}[] = [
  { value: "A1", label: "general.cerfA1" },
  { value: "A2", label: "general.cerfA2" },
  { value: "B1", label: "general.cerfB1" },
  { value: "B2", label: "general.cerfB2" },
  { value: "C1", label: "general.cerfC1" },
  { value: "C2", label: "general.cerfC2" },
];

export const CERF = CERF_LEVELS.map((l) => l.value);

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export const EMOJI = ["👀", "😢", "👍", "🔥", "❤️"];

export const TASK_STATUSES: TaskStatus[] = [
  "open",
  "assigned",
  "completed",
  "cancelled",
];

export const TASK_SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1, _id: -1 },
  deadline: { deadline: 1, _id: 1 },
  budget_desc: { "budget.amount": -1, _id: -1 },
  budget_asc: { "budget.amount": 1, _id: 1 },
  distance: { distanceMeters: 1, _id: 1 },
};

export const EARTH_RADIUS_M = 6378100;

export const MAX_FILES_PER_UPLOAD = 25;

export const FILTERS: { value: FilterType; labelKey: string }[] = [
  { value: "all", labelKey: "filters.all" },
  { value: "image", labelKey: "filters.image" },
  { value: "video", labelKey: "filters.video" },
  { value: "audio", labelKey: "filters.audio" },
  { value: "document", labelKey: "filters.document" },
  { value: "other", labelKey: "filters.other" },
];

export const TASK_DEFAULT_FILTERS: TaskFilters = {
  status: "all",
  sort: "newest",
  minBudget: 0,
  maxBudget: 0,
  onlyNegotiable: false,
  skills: [],
  certificates: [],
  near: null,
  radiusKm: 20,
};

export const TASK_RADIUS_OPTIONS = [5, 10, 20, 50, 100];

export const TASK_SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "deadline", label: "Deadline: soonest first" },
  { value: "budget_desc", label: "Budget: high to low" },
  { value: "budget_asc", label: "Budget: low to high" },
  { value: "distance", label: "Nearest first" },
];

export const TASK_STATUS_LABELS: Record<string, string> = {
  all: "All",
  open: "Open",
  assigned: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TABS: TasksTab[] = ["all", "my"];

export const TAB_LABELS = {
  all: "general.allTasks",
  my: "general.myTasks",
};
