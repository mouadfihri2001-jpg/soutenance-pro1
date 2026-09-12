# Liens d’accès temporaires

Le propriétaire a demandé le 12 septembre 2026 une activation immédiate depuis un lien de retour difficile à deviner, sans connexion Stripe supplémentaire. Ce mécanisme accorde un accès par possession du lien. **Il ne vérifie pas le paiement.** Une personne à qui le lien est transmis peut l’utiliser sans achat.

## Parcours

Le lien utilise la forme `https://<origine-du-site>/#acces/<jeton-aléatoire>`. Le fragment ouvre l’espace, demande la connexion si nécessaire, puis appelle l’API authentifiée. La page affiche « Merci. Ton espace est prêt. », l’offre, la date de fin et un bouton pour commencer un projet. Le fragment est retiré de la barre d’adresse après une réponse réussie. Les documents déjà ouverts et les modifications non enregistrées restent intacts.

Le jeton comporte 64 caractères hexadécimaux aléatoires (256 bits). Le serveur conserve uniquement son empreinte SHA-256. Les vrais liens ne figurent ni dans ce dépôt public, ni dans le sitemap, ni dans les boutons d’achat ou les fichiers distribués. Les deux liens sont destinés au propriétaire pour configurer séparément le retour des offres Stripe 19 € et 29 €.

## Limites de cette activation

| Lien | Accès accordé | Durée |
| --- | --- | --- |
| Essentiel | 60 générations, 5 projets | 30 jours |
| Signature | 150 générations, 20 projets | 30 jours |

Une campagne accepte une seule activation par compte, commune aux deux offres. Réouvrir le lien, changer de lien, rafraîchir la page ou attendre l’expiration ne renouvelle pas le quota. Les générations gratuites antérieures au début de l’accès ne consomment pas son allowance. Le serveur conserve le comptage normal et les budgets globaux existants.

Les liens de lancement expirent pour de nouvelles activations 30 jours après leur création et acceptent au maximum 100 comptes par offre. Les accès déjà accordés conservent leur date de fin propre. Un abonnement Stripe déjà lié ou une offre payante encore valide n’est pas remplacé par un lien d’accès.

**Ce mécanisme n’automatise ni les renouvellements, ni les annulations, ni les remboursements Stripe.** Les prélèvements existants dans Stripe ne sont pas modifiés. Avant une deuxième échéance, utiliser l’intégration Stripe vérifiée documentée dans [billing-setup.md](billing-setup.md) ou rapprocher manuellement le paiement et l’accès.

## Configuration par le propriétaire

Appliquer la migration `student_access_passes`, puis créer une campagne et deux empreintes de jetons via une opération serveur autorisée. Ne pas stocker de jetons réels dans une migration Git. Les tables `student_access_campaigns`, `student_access_passes`, `student_access_redemptions` et la fonction `student_redeem_access_pass` sont réservées au serveur, avec RLS et droits publics révoqués.

Après publication de la version sur l’origine retenue, régler le retour après paiement de chaque Payment Link Stripe vers le lien d’accès de l’offre correspondante. Utiliser uniquement une origine où cette version est réellement publiée. Une modification sur la branche Preview ne met pas cette route en service sur le domaine Production. Aucun réglage Stripe distant n’est changé automatiquement par ce code.

Pour arrêter de nouvelles activations, le propriétaire peut désactiver la campagne (`enabled = false`). Pour remplacer un lien divulgué, générer un nouveau jeton et remplacer uniquement `token_hash` de l’offre : conserver la campagne et son historique empêche de nouveaux crédits sur les comptes déjà servis. La rotation du lien n’annule pas les accès existants.

## Validation

Les tests vérifient l’authentification, les entrées autorisées, les quotas 60/150, les refus des rôles navigateur, la limite de 100 comptes, les rejouements, l’expiration, la protection des abonnements existants et l’annulation complète de la transaction si une écriture échoue. Les tests d’interface vérifient l’ouverture depuis le fragment, sa suppression après activation et la conservation des documents. Ces contrôles ne prouvent aucun paiement.

Le 12 septembre 2026 : 146 tests réussis et build Preview réussi. La migration a été appliquée au projet Supabase existant ; les privilèges des trois tables et de la fonction ont été vérifiés. L’Advisor signale uniquement l’absence volontaire de politiques sur ces tables réservées au serveur ([explication Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Les avertissements de l’ancien espace sont déjà décrits dans le README.

La campagne de lancement et les deux empreintes ont été créées, avec zéro activation initiale. Les nouveaux accès peuvent être activés jusqu’au 12 octobre 2026 à 19:10 UTC, dans la limite de 100 comptes par offre. Aucun compte client n’a été activé pour tester et aucun paramètre de retour Stripe distant n’a été modifié. Publication Production et configuration des retours restent distinctes de cette préparation.
