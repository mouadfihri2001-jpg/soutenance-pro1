export function authModeFromHash(hash) {
  return hash === '#inscription' ? 'signup' : hash === '#connexion' || hash === '#workspace' ? 'login' : null;
}

export function projectPreset(search) {
  const intent = new URLSearchParams(search || '').get('parcours');
  if (intent === 'ispits') return {type:'PFE',level:'Licence',language:'Français'};
  if (intent === 'medecine') return {type:'Thèse',level:'Doctorat en médecine',field:'Médecine',language:'Français',citation:'Vancouver'};
  return {};
}
