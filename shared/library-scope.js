// The local selection starts in 2016. Extended archive searches can include
// earlier publications without changing the local collection's scope.
export const LIBRARY_SCOPE = Object.freeze({minYear:2016, archiveMinYear:1000, maxYear:2026, queryLength:160, pageSize:24, maxPage:100});
export const LIBRARY_LANGUAGES = Object.freeze(['all', 'fr', 'en', 'ar']);
export const LIBRARY_PERIODS = Object.freeze(['all', 'recent']);
export const HAL_DOCUMENT_TYPES = Object.freeze({
  THESE:'Thèse', MEM:'Mémoire', ART:'Article', REPORT:'Rapport de recherche', HDR:'Habilitation',
  COMM:'Communication de conférence', COUV:'Chapitre d’ouvrage', OUV:'Ouvrage',
  UNDEFINED:'Prépublication ou document de travail', LECTURE:'Cours', POSTER:'Poster'
});
