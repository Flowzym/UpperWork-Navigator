import { Program } from '../types';

export const samplePrograms: Program[] = [
  {
    id: '1',
    name: 'Bildungskonto OÖ',
    status: 'aktiv',
    teaser: 'Förderung beruflicher Weiterbildung für Beschäftigte und Arbeitsuchende in Oberösterreich. Bis zu 80% der Kurskosten werden übernommen.',
    zielgruppe: ['Beschäftigte', 'Arbeitsuchende', 'Lehrlinge'],
    foerderart: ['kurskosten'],
    foerderhoehe: [
      { label: 'Standardförderung', quote: 50, max: 2000, note: 'pro Jahr' },
      { label: 'Erhöhte Förderung', quote: 80, max: 3000, note: 'bei Arbeitslosigkeit' }
    ],
    voraussetzungen: [
      'Hauptwohnsitz in Oberösterreich',
      'Mindestalter 18 Jahre',
      'Kurs bei anerkanntem Bildungsträger',
      'Mindestdauer 16 Unterrichtseinheiten'
    ],
    antragsweg: 'land_ooe_portal',
    frist: { typ: 'laufend' },
    region: 'Oberösterreich',
    themen: ['Berufliche Weiterbildung', 'Digitalisierung', 'Sprachen'],
    passt_wenn: [
      'Sie wohnen in Oberösterreich',
      'Sie möchten sich beruflich weiterbilden',
      'Der Kurs dauert mindestens 16 UE',
      'Sie können Eigenanteil finanzieren'
    ],
    passt_nicht_wenn: [
      'Hauptwohnsitz außerhalb OÖ',
      'Kurs unter 16 Unterrichtseinheiten',
      'Nicht anerkannter Bildungsträger',
      'Bereits 3 Förderungen im Jahr erhalten'
    ],
    quelle: { seite: 12, stand: '09/2025' },
    // Legacy compatibility
    tags: ['Weiterbildung', 'OÖ', 'Kurskosten'],
    portal: 'Land OÖ',
    description: 'Förderung beruflicher Weiterbildung für Beschäftigte und Arbeitsuchende in Oberösterreich.',
    budget: 'bis 3.000€',
    targetGroup: ['Beschäftigte', 'Arbeitsuchende'],
    fundingType: 'Zuschuss',
    requirements: ['Hauptwohnsitz in OÖ', 'Min. 18 Jahre'],
    themeField: 'Bildung & Qualifikation',
    deadline: 'laufend'
  },
  {
    id: '2',
    name: 'QBN - Qualifizierungsförderung für Beschäftigte',
    status: 'aktiv',
    teaser: 'Unterstützung für Unternehmen bei der Weiterbildung ihrer Mitarbeiter. Förderung von Kurskosten und Personalkosten während der Bildungszeit.',
    zielgruppe: ['Unternehmen', 'Beschäftigte'],
    foerderart: ['kurskosten', 'personalkosten'],
    foerderhoehe: [
      { label: 'Kurskosten', quote: 75, note: 'bei anerkannten Anbietern' },
      { label: 'Personalkosten', quote: 50, deckel: 10000, note: 'während Bildungszeit' }
    ],
    voraussetzungen: [
      'Unternehmenssitz in Österreich',
      'Sozialversicherungspflichtige Beschäftigung',
      'Mindestens 75% Anwesenheit',
      'Kurs bei anerkanntem Anbieter'
    ],
    antragsweg: 'eams',
    frist: { typ: 'stichtag', datum: '31.12.2025' },
    region: 'Österreich',
    themen: ['Qualifizierung', 'Beschäftigte', 'Unternehmen'],
    passt_wenn: [
      'Ihr Unternehmen hat Sitz in Österreich',
      'Mitarbeiter sind sozialversicherungspflichtig beschäftigt',
      'Weiterbildung ist beruflich relevant',
      'Mindestens 75% Anwesenheit möglich'
    ],
    passt_nicht_wenn: [
      'Unternehmen außerhalb Österreichs',
      'Geringfügige Beschäftigung',
      'Weniger als 75% Anwesenheit',
      'Nicht anerkannter Bildungsanbieter'
    ],
    quelle: { seite: 8, stand: '10/2025' },
    // Legacy compatibility
    tags: ['QBN', 'Beschäftigte', 'Unternehmen'],
    portal: 'AMS',
    description: 'Unterstützung für Unternehmen bei der Weiterbildung ihrer Mitarbeiter.',
    budget: 'bis 10.000€',
    targetGroup: ['Unternehmen', 'Beschäftigte'],
    fundingType: 'Zuschuss',
    requirements: ['Unternehmenssitz in AT', '75% Anwesenheit'],
    themeField: 'Qualifizierung',
    deadline: '31.12.2025'
  },
  {
    id: '3',
    name: 'Innovative Skills - Land OÖ',
    status: 'endet_am',
    teaser: 'Förderung innovativer Weiterbildungsprojekte mit Fokus auf Zukunftskompetenzen. Besonders für digitale und nachhaltige Qualifikationen.',
    zielgruppe: ['KMU', 'Bildungsträger', 'Einzelpersonen'],
    foerderart: ['kurskosten', 'beratung'],
    foerderhoehe: [
      { label: 'Projektförderung', quote: 60, max: 25000, note: 'für innovative Konzepte' },
      { label: 'Individualförderung', quote: 70, max: 5000, note: 'für Einzelpersonen' }
    ],
    voraussetzungen: [
      'Bezug zu Oberösterreich',
      'Innovativer Charakter der Weiterbildung',
      'Nachweis der Nachhaltigkeit',
      'Detailliertes Projektkonzept'
    ],
    antragsweg: 'land_ooe_portal',
    frist: { typ: 'stichtag', datum: '15.03.2026' },
    region: 'Oberösterreich',
    themen: ['Innovation', 'Digitalisierung', 'Nachhaltigkeit', 'Zukunftskompetenzen'],
    passt_wenn: [
      'Sie haben einen Bezug zu Oberösterreich',
      'Ihr Projekt ist innovativ und zukunftsorientiert',
      'Fokus auf digitale oder nachhaltige Kompetenzen',
      'Detailliertes Konzept vorhanden'
    ],
    passt_nicht_wenn: [
      'Kein Bezug zu Oberösterreich',
      'Standardweiterbildung ohne Innovation',
      'Fehlende Nachhaltigkeitskriterien',
      'Unvollständiges Projektkonzept'
    ],
    quelle: { seite: 24, stand: '11/2025' },
    // Legacy compatibility
    tags: ['Innovation', 'OÖ', 'Zukunft'],
    portal: 'Land OÖ',
    description: 'Förderung innovativer Weiterbildungsprojekte mit Fokus auf Zukunftskompetenzen.',
    budget: 'bis 25.000€',
    targetGroup: ['KMU', 'Bildungsträger'],
    fundingType: 'Zuschuss',
    requirements: ['Bezug zu OÖ', 'Innovativer Charakter'],
    themeField: 'Innovation',
    deadline: '15.03.2026'
  },
  {
    id: '4',
    name: 'Qualifizierungsverbund - Digitale Kompetenz & Nachhaltigkeit',
    status: 'aktiv',
    teaser: 'Verbundprojekte für digitale und nachhaltige Kompetenzen. Unternehmen schließen sich zusammen für gemeinsame Weiterbildungsmaßnahmen.',
    zielgruppe: ['Unternehmensverbünde', 'KMU', 'Beschäftigte'],
    foerderart: ['kurskosten', 'personalkosten', 'beratung'],
    foerderhoehe: [
      { label: 'Verbundförderung', quote: 80, max: 50000, note: 'für Verbundprojekte' },
      { label: 'Beratungsförderung', quote: 100, max: 5000, note: 'für Konzepterstellung' }
    ],
    voraussetzungen: [
      'Mindestens 3 Unternehmen im Verbund',
      'Gemeinsames Weiterbildungskonzept',
      'Fokus auf Digitalisierung oder Nachhaltigkeit',
      'Verbindliche Teilnahmezusagen'
    ],
    antragsweg: 'wko_verbund',
    frist: { typ: 'laufend' },
    region: 'Oberösterreich',
    themen: ['Digitalisierung', 'Nachhaltigkeit', 'Verbundprojekte', 'KMU'],
    passt_wenn: [
      'Sie können einen Verbund mit min. 3 Unternehmen bilden',
      'Fokus auf digitale oder nachhaltige Kompetenzen',
      'Gemeinsames Weiterbildungskonzept möglich',
      'Langfristige Zusammenarbeit geplant'
    ],
    passt_nicht_wenn: [
      'Weniger als 3 Unternehmen beteiligt',
      'Kein gemeinsames Konzept möglich',
      'Fehlender Digitalisierungs-/Nachhaltigkeitsbezug',
      'Nur kurzfristige Zusammenarbeit'
    ],
    quelle: { seite: 18, stand: '09/2025' },
    // Legacy compatibility
    tags: ['Verbund', 'Digital', 'Nachhaltigkeit'],
    portal: 'WKO',
    description: 'Verbundprojekte für digitale und nachhaltige Kompetenzen.',
    budget: 'bis 50.000€',
    targetGroup: ['Unternehmensverbünde', 'KMU'],
    fundingType: 'Zuschuss',
    requirements: ['Min. 3 Unternehmen', 'Gemeinsames Konzept'],
    themeField: 'Digitalisierung',
    deadline: 'laufend'
  },
  {
    id: '5',
    name: 'AQUA - Arbeitsplatznahe Qualifizierung',
    status: 'aktiv',
    teaser: 'Förderung arbeitsplatznaher Qualifizierung für gering qualifizierte Beschäftigte. Lernen direkt am Arbeitsplatz mit externer Begleitung.',
    zielgruppe: ['Gering qualifizierte Beschäftigte', 'Unternehmen'],
    foerderart: ['personalkosten', 'beratung'],
    foerderhoehe: [
      { label: 'Personalkosten', quote: 75, max: 15000, note: 'während Qualifizierung' },
      { label: 'Begleitkosten', quote: 100, max: 8000, note: 'für externe Begleitung' }
    ],
    voraussetzungen: [
      'Höchstens Pflichtschulabschluss',
      'Sozialversicherungspflichtige Beschäftigung',
      'Arbeitsplatznahe Qualifizierung',
      'Externe Begleitung durch Bildungsträger'
    ],
    antragsweg: 'eams',
    frist: { typ: 'laufend' },
    region: 'Österreich',
    themen: ['Arbeitsplatznahe Qualifizierung', 'Gering Qualifizierte', 'Basisbildung'],
    passt_wenn: [
      'Beschäftigte haben max. Pflichtschulabschluss',
      'Sozialversicherungspflichtige Beschäftigung',
      'Qualifizierung direkt am Arbeitsplatz möglich',
      'Externe Begleitung organisierbar'
    ],
    passt_nicht_wenn: [
      'Höhere Qualifikation als Pflichtschule',
      'Geringfügige Beschäftigung',
      'Keine arbeitsplatznahe Umsetzung möglich',
      'Fehlende externe Begleitung'
    ],
    quelle: { seite: 32, stand: '10/2025' },
    // Legacy compatibility
    tags: ['AQUA', 'Arbeitsplatz', 'Basisbildung'],
    portal: 'AMS',
    description: 'Förderung arbeitsplatznaher Qualifizierung für gering qualifizierte Beschäftigte.',
    budget: 'bis 15.000€',
    targetGroup: ['Gering Qualifizierte', 'Unternehmen'],
    fundingType: 'Zuschuss',
    requirements: ['Max. Pflichtschule', 'SV-pflichtig beschäftigt'],
    themeField: 'Basisbildung',
    deadline: 'laufend'
  },
  {
    id: '6',
    name: 'FiT - Frauen in Handwerk und Technik',
    status: 'aktiv',
    teaser: 'Spezielle Förderung für Frauen beim Einstieg in handwerkliche und technische Berufe. Umfassende Unterstützung von der Orientierung bis zum Jobeinstieg.',
    zielgruppe: ['Frauen', 'Arbeitsuchende', 'Wiedereinsteigerinnen'],
    foerderart: ['kurskosten', 'beihilfe'],
    foerderhoehe: [
      { label: 'Kurskosten', quote: 100, note: 'vollständige Übernahme' },
      { label: 'Lebensunterhalt', min: 800, max: 1200, note: 'monatliche Beihilfe' }
    ],
    voraussetzungen: [
      'Weibliches Geschlecht',
      'Arbeitsuchend oder wiedereinstiegswillig',
      'Interesse an Handwerk/Technik',
      'Beratungsgespräch beim AMS'
    ],
    antragsweg: 'eams',
    frist: { typ: 'laufend' },
    region: 'Österreich',
    themen: ['Frauen', 'Handwerk', 'Technik', 'Wiedereinstieg'],
    passt_wenn: [
      'Sie sind eine Frau',
      'Sie sind arbeitsuchend oder möchten wiedereinsteigen',
      'Sie interessieren sich für Handwerk oder Technik',
      'Sie können an Vollzeitmaßnahmen teilnehmen'
    ],
    passt_nicht_wenn: [
      'Männliches Geschlecht',
      'Bereits in Vollzeitbeschäftigung',
      'Kein Interesse an handwerklich-technischen Berufen',
      'Keine Zeit für Vollzeitmaßnahmen'
    ],
    quelle: { seite: 45, stand: '11/2025' },
    // Legacy compatibility
    tags: ['FiT', 'Frauen', 'Technik'],
    portal: 'AMS',
    description: 'Spezielle Förderung für Frauen beim Einstieg in handwerkliche und technische Berufe.',
    budget: 'bis 1.200€/Monat',
    targetGroup: ['Frauen', 'Arbeitsuchende'],
    fundingType: 'Zuschuss + Beihilfe',
    requirements: ['Weiblich', 'Arbeitsuchend'],
    themeField: 'Frauen & Technik',
    deadline: 'laufend'
  }
];