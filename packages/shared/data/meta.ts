import { Lang } from "shared/index";

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

  stats: {
    en: {
      title: "Stats",
      description:
        "View your statistics and track your progress in conversations, tasks, and other activities.",
    },
    "fi-FI": {
      title: "Tilastot",
      description:
        "Katso tilastosi ja seuraa keskustelujasi, tehtäviäsi ja muita toimintoja.",
    },
    "sv-FI": {
      title: "Statistik",
      description:
        "Visa dina statistik och räkna upp din progress i konversationer, uppgifter och andra aktiviteter.",
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
      title: "Hjälp",
      description:
        "Få hjälp med ditt konto, konversationer, uppgifter eller andra funktioner.",
    },
  },
};
