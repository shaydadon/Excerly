// Country data for the vendor directory.
// - tz: time zones used to guess the visitor's country (nothing is sent anywhere)
// - lang: language of the Google Maps search terms
// - sites: the main wedding-vendor marketplaces in that country
// To add a country: add an entry here. To add curated vendors: add them to vendors.json with its "country" code.

window.CATEGORIES = [
  'Venues', 'Catering', 'Photographers', 'Videographers', 'DJs & Bands', 'Bars & Alcohol',
  'Active / Mobile Bars', 'Florists & Designers', 'Hair & Makeup', 'Cakes & Desserts',
  'Officiants', 'Stationery', 'Transportation', 'Photo Booths & Extras', 'Rentals & Lighting', 'Planners',
];

// Search terms per language, in the same order as CATEGORIES.
window.TERMS = {
  en: ['wedding venue', 'wedding catering', 'wedding photographer', 'wedding videographer', 'wedding DJ', 'wedding bar service', 'mobile cocktail bar hire', 'wedding florist', 'bridal hair and makeup', 'wedding cake', 'wedding officiant', 'wedding invitations printing', 'wedding car hire', 'photo booth hire', 'event rentals', 'wedding planner'],
  he: ['אולם אירועים', 'קייטרינג לאירועים', 'צלם חתונות', 'צלם וידאו לחתונות', 'דיג׳יי לחתונות', 'אלכוהול לאירועים', 'בר אקטיבי', 'עיצוב פרחים לחתונות', 'איפור כלות', 'עוגות חתונה', 'עורך טקס חתונה', 'הזמנות לחתונה', 'הסעות לאירועים', 'מגנטים לחתונה', 'השכרת ציוד לאירועים', 'מפיקת חתונות'],
  es: ['lugar para bodas', 'catering para bodas', 'fotógrafo de bodas', 'videógrafo de bodas', 'DJ para bodas', 'barra libre para bodas', 'barra de cócteles para bodas', 'floristería para bodas', 'maquillaje de novia', 'pastel de boda', 'oficiante de bodas', 'invitaciones de boda', 'coche para bodas', 'fotomatón para bodas', 'alquiler de mobiliario para eventos', 'organizador de bodas'],
  fr: ['lieu de réception mariage', 'traiteur mariage', 'photographe mariage', 'vidéaste mariage', 'DJ mariage', 'bar mariage', 'bar à cocktails mariage', 'fleuriste mariage', 'maquilleuse mariage', 'gâteau de mariage', 'officiant cérémonie laïque', 'faire-part mariage', 'location voiture mariage', 'photobooth mariage', 'location matériel réception', 'wedding planner'],
  it: ['location matrimonio', 'catering matrimonio', 'fotografo matrimonio', 'videomaker matrimonio', 'DJ matrimonio', 'open bar matrimonio', 'cocktail bar matrimonio', 'fiorista matrimonio', 'trucco sposa', 'torta nuziale', 'celebrante matrimonio', 'partecipazioni matrimonio', 'auto per matrimonio', 'photo booth matrimonio', 'noleggio attrezzature eventi', 'wedding planner'],
  pt: ['espaço para casamento', 'buffet para casamento', 'fotógrafo de casamento', 'filmagem de casamento', 'DJ para casamento', 'bebidas para casamento', 'bartender para casamento', 'decoração floral casamento', 'maquiagem de noiva', 'bolo de casamento', 'celebrante de casamento', 'convites de casamento', 'carro para casamento', 'cabine de fotos casamento', 'locação de móveis para eventos', 'assessoria de casamento'],
  de: ['Hochzeitslocation', 'Hochzeitscatering', 'Hochzeitsfotograf', 'Hochzeitsvideograf', 'Hochzeits-DJ', 'Getränke Hochzeit', 'mobile Cocktailbar Hochzeit', 'Hochzeitsfloristik', 'Braut Make-up', 'Hochzeitstorte', 'freier Trauredner', 'Hochzeitseinladungen', 'Hochzeitsauto', 'Fotobox Hochzeit', 'Eventverleih', 'Hochzeitsplaner'],
};

const S = (name, url) => ({ name, url });
window.COUNTRIES = {
  US: { name: 'United States', flag: '🇺🇸', lang: 'en', tz: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Detroit', 'America/Indiana/Indianapolis', 'America/Boise', 'America/Kentucky/Louisville'], sites: [S('The Knot', 'https://www.theknot.com/marketplace'), S('WeddingWire', 'https://www.weddingwire.com/'), S('Zola', 'https://www.zola.com/wedding-vendors')] },
  GB: { name: 'United Kingdom', flag: '🇬🇧', lang: 'en', tz: ['Europe/London', 'Europe/Belfast'], sites: [S('Hitched', 'https://www.hitched.co.uk/'), S('Bridebook', 'https://bridebook.com/uk')] },
  CA: { name: 'Canada', flag: '🇨🇦', lang: 'en', tz: ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Halifax', 'America/St_Johns', 'America/Regina', 'America/Montreal'], sites: [S('WeddingWire Canada', 'https://www.weddingwire.ca/')] },
  AU: { name: 'Australia', flag: '🇦🇺', lang: 'en', tz: ['Australia/'], sites: [S('Easy Weddings', 'https://www.easyweddings.com.au/')] },
  IE: { name: 'Ireland', flag: '🇮🇪', lang: 'en', tz: ['Europe/Dublin'], sites: [S('WeddingsOnline', 'https://www.weddingsonline.ie/')] },
  NZ: { name: 'New Zealand', flag: '🇳🇿', lang: 'en', tz: ['Pacific/Auckland'], sites: [] },
  ZA: { name: 'South Africa', flag: '🇿🇦', lang: 'en', tz: ['Africa/Johannesburg'], sites: [] },
  IN: { name: 'India', flag: '🇮🇳', lang: 'en', tz: ['Asia/Kolkata', 'Asia/Calcutta'], sites: [S('WedMeGood', 'https://www.wedmegood.com/'), S('WeddingWire India', 'https://www.weddingwire.in/')] },
  SG: { name: 'Singapore', flag: '🇸🇬', lang: 'en', tz: ['Asia/Singapore'], sites: [] },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪', lang: 'en', tz: ['Asia/Dubai'], sites: [] },
  IL: { name: 'Israel', flag: '🇮🇱', lang: 'he', tz: ['Asia/Jerusalem', 'Asia/Tel_Aviv'], sites: [S('Mit4Mit', 'https://www.mit4mit.co.il/')] },
  ES: { name: 'Spain', flag: '🇪🇸', lang: 'es', tz: ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'], sites: [S('Bodas.net', 'https://www.bodas.net/')] },
  MX: { name: 'Mexico', flag: '🇲🇽', lang: 'es', tz: ['America/Mexico_City', 'America/Cancun', 'America/Monterrey', 'America/Tijuana', 'America/Merida', 'America/Chihuahua', 'America/Mazatlan', 'America/Hermosillo'], sites: [S('Bodas.com.mx', 'https://www.bodas.com.mx/')] },
  CO: { name: 'Colombia', flag: '🇨🇴', lang: 'es', tz: ['America/Bogota'], sites: [S('Bodas.com.co', 'https://www.bodas.com.co/')] },
  AR: { name: 'Argentina', flag: '🇦🇷', lang: 'es', tz: ['America/Argentina/', 'America/Buenos_Aires'], sites: [] },
  CL: { name: 'Chile', flag: '🇨🇱', lang: 'es', tz: ['America/Santiago'], sites: [] },
  PE: { name: 'Peru', flag: '🇵🇪', lang: 'es', tz: ['America/Lima'], sites: [] },
  FR: { name: 'France', flag: '🇫🇷', lang: 'fr', tz: ['Europe/Paris'], sites: [S('Mariages.net', 'https://www.mariages.net/')] },
  BE: { name: 'Belgium', flag: '🇧🇪', lang: 'fr', tz: ['Europe/Brussels'], sites: [] },
  IT: { name: 'Italy', flag: '🇮🇹', lang: 'it', tz: ['Europe/Rome'], sites: [S('Matrimonio.com', 'https://www.matrimonio.com/')] },
  PT: { name: 'Portugal', flag: '🇵🇹', lang: 'pt', tz: ['Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores'], sites: [] },
  BR: { name: 'Brazil', flag: '🇧🇷', lang: 'pt', tz: ['America/Sao_Paulo', 'America/Fortaleza', 'America/Recife', 'America/Bahia', 'America/Manaus', 'America/Belem', 'America/Cuiaba', 'America/Campo_Grande', 'America/Maceio'], sites: [S('Casamentos.com.br', 'https://www.casamentos.com.br/')] },
  DE: { name: 'Germany', flag: '🇩🇪', lang: 'de', tz: ['Europe/Berlin'], sites: [] },
  AT: { name: 'Austria', flag: '🇦🇹', lang: 'de', tz: ['Europe/Vienna'], sites: [] },
  CH: { name: 'Switzerland', flag: '🇨🇭', lang: 'de', tz: ['Europe/Zurich'], sites: [] },
  NL: { name: 'Netherlands', flag: '🇳🇱', lang: 'en', tz: ['Europe/Amsterdam'], sites: [] },
  OTHER: { name: 'Another country', flag: '🌍', lang: 'en', tz: [], sites: [] },
};
