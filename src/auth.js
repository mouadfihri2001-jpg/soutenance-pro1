export function authErrorMessage(error, mode) {
  const messages = {
    invalid_credentials: 'Email ou mot de passe incorrect. Si tu n’as pas encore de compte, choisis « Créer un compte gratuit ».',
    email_not_confirmed: 'Confirme ton adresse email avec le lien reçu, puis reconnecte-toi. Vérifie aussi les courriers indésirables.',
    email_address_invalid: 'Vérifie ton adresse email et réessaie.',
    email_address_not_authorized: 'L’envoi des emails de confirmation n’est pas encore configuré pour cette adresse. Contacte l’assistance.',
    email_provider_disabled: 'La création de comptes par email est actuellement indisponible. Contacte l’assistance.',
    signup_disabled: 'La création de comptes est actuellement indisponible. Contacte l’assistance.',
    user_already_exists: 'Cette adresse est déjà utilisée. Connecte-toi ou utilise « Mot de passe oublié ».',
    email_exists: 'Cette adresse est déjà utilisée. Connecte-toi ou utilise « Mot de passe oublié ».',
    weak_password: 'Choisis un mot de passe plus robuste, avec au moins 8 caractères, des lettres, des chiffres et un symbole.',
    same_password: 'Choisis un mot de passe différent de l’ancien.',
    over_email_send_rate_limit: 'Trop de demandes d’email ont été effectuées. Patiente quelques minutes avant de réessayer.',
    over_request_rate_limit: 'Trop de tentatives. Patiente quelques minutes avant de réessayer.',
    captcha_failed: 'La vérification de sécurité a échoué. Réessaie ou contacte l’assistance.',
    otp_expired: 'Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.',
    session_not_found: 'Ta session a expiré. Reconnecte-toi pour continuer.',
    request_timeout: 'Le service met trop de temps à répondre. Vérifie ta connexion et réessaie.'
  };
  if (Object.hasOwn(messages, error?.code)) return messages[error.code];
  if (error?.status === 429) return messages.over_request_rate_limit;
  if (error?.name === 'AuthRetryableFetchError' || error instanceof TypeError) {
    return 'Impossible de joindre le service. Vérifie ta connexion et réessaie.';
  }
  if (error?.status === 401 || error?.status === 403) {
    return 'Le service de connexion est indisponible. Contacte l’assistance.';
  }
  return mode === 'signup'
    ? 'L’inscription n’a pas pu aboutir. Réessaie dans un instant ou contacte l’assistance.'
    : mode === 'reset'
      ? 'Le lien de réinitialisation n’a pas pu être envoyé. Réessaie dans un instant.'
      : 'La demande n’a pas pu aboutir. Réessaie dans un instant ou contacte l’assistance.';
}

// The submitted form owns its mode; a later screen change cannot turn signup into login.
export async function requestAuth(auth, mode, values, origin) {
  const email = String(values.email || '').trim();
  const password = values.password;
  try {
    let result;
    switch (mode) {
      case 'signup': result = await auth.signUp({ email, password, options: { emailRedirectTo: origin } }); break;
      case 'login': result = await auth.signInWithPassword({ email, password }); break;
      case 'reset': result = await auth.resetPasswordForEmail(email, { redirectTo: origin }); break;
      case 'recovery': result = await auth.updateUser({ password }); break;
      default: throw new Error('Unknown authentication form.');
    }
    if (result.error) throw result.error;
    return result;
  } catch (error) {
    const failure = new Error(authErrorMessage(error, mode));
    // Diagnostics contain neither credentials nor the provider's raw error message.
    failure.authDetails = {
      mode: ['signup', 'login', 'reset', 'recovery'].includes(mode) ? mode : 'unknown',
      code: typeof error?.code === 'string' && /^[a-z_]{1,64}$/.test(error.code) ? error.code : 'unknown',
      status: Number.isInteger(error?.status) ? error.status : null
    };
    throw failure;
  }
}
