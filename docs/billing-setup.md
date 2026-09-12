# Abonnements Soutenance Pro

Le propriétaire a ensuite demandé un accès provisoire par lien de retour sans vérification Stripe. Ce parcours séparé est décrit dans [temporary-access-links.md](temporary-access-links.md). Il ne remplace pas la vérification des abonnements ci-dessous et ne renouvelle pas automatiquement les droits.

## État au 12 septembre 2026

Le code de paiement automatique est préparé. La migration `20260912175718_student_billing.sql` a été appliquée au projet Supabase existant sous le nom `student_billing`. Aucun paiement, remboursement, abonnement réel ou changement de configuration Stripe n’a été effectué dans cette session. La connexion Stripe disponible pointe vers un environnement de test différent du compte Live du propriétaire ; elle n’a pas été utilisée pour créer des produits.

Les liens du propriétaire sont bien déclarés comme réels :

| Offre | Lien existant | Quota |
| --- | --- | --- |
| Essentiel · 19 €/mois | https://buy.stripe.com/4gM00k6ssetLeGr4TzbII0d | 60 générations, 5 projets |
| Signature · 29 €/mois | https://buy.stripe.com/aFa9AU9EE3P741NbhXbII0c | 150 générations, 20 projets |

Le parcours automatique utilise les **Price IDs mensuels de ces offres**, dans une session Checkout créée par le serveur pour le compte connecté. Un achat effectué directement sur les anciens liens reste à rapprocher manuellement : un email ou un paramètre d’URL ne suffit pas à attribuer des droits.

## Configuration du compte Live

Dans le compte Stripe qui possède ces offres, relever leurs deux identifiants `price_…`. Le serveur vérifie EUR, 19/29 €, récurrence mensuelle, quantité 1 et mode Live. Les essais payants différés, remises, paiements partiels et changements de formule avec proratisation ne sont pas pris en charge par cette première intégration.

Créer un endpoint Stripe vers `https://soutenancepro.com/api/stripe-webhook`, avec l’API `2026-07-29.dahlia`. Sélectionner :

- `checkout.session.completed`, `checkout.session.async_payment_succeeded` ;
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `invoice.voided`, `invoice.marked_uncollectible` ;
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed` ;
- `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`.

Renseigner les valeurs dans les variables **serveur** Vercel du bon environnement. Ne pas les mettre dans Git, une page publique ou une conversation.

| Variable | Valeur attendue |
| --- | --- |
| `SITE_URL` | `https://soutenancepro.com` |
| `STRIPE_MODE` | `live` |
| `STRIPE_SECRET_KEY` | Clé du compte Live, idéalement restreinte aux opérations nécessaires |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature de cet endpoint, `whsec_…` |
| `STRIPE_PRICE_ESSENTIEL` | Price ID de l’offre 19 €/mois |
| `STRIPE_PRICE_SIGNATURE` | Price ID de l’offre 29 €/mois |
| `STRIPE_BILLING_ENABLED` | `true`, uniquement après configuration et recette |

Les opérations requises couvrent la lecture des prix, abonnements, factures, paiements de facture, PaymentIntents et charges ; la création/lecture des clients et sessions Checkout ; et la création de sessions du portail client. Configurer ce portail pour les factures, le moyen de paiement et l’annulation. Laisser le changement de formule et de quantité désactivé tant que son parcours et ses proratisations ne sont pas implémentés.

Une preview de test doit avoir son propre projet Supabase, ses prix et clés de test, son endpoint et son `SITE_URL`. Ne pas activer le mode test sur le projet Supabase Live partagé. Un build Production refuse le mode test pour le paiement automatique.

## Comportement

1. Le visiteur choisit une offre et crée ou retrouve son compte.
2. Le serveur crée une session Stripe liée à ce compte et à une tentative unique. Les doubles clics ne créent pas un second abonnement.
3. Stripe renvoie le client dans son espace. Le serveur vérifie indépendamment client, session, abonnement, facture intégralement payée et paiement capturé. Le webhook assure aussi la mise à jour si le client ferme l’onglet.
4. Le compte reçoit 60 ou 150 générations pour la période de cette facture. Une notification répétée ne remet pas le compteur à zéro. Le paiement du renouvellement ouvre la période suivante.
5. Une confirmation en cours affiche un état d’attente avec relance automatique limitée et bouton de vérification. Les documents en cours d’édition sont conservés.

Le compte gratuit conserve ses trois générations par mois civil UTC. Les anciens abonnements activés manuellement sans date de début conservent aussi le comptage civil. Pour les nouveaux abonnements automatiques, les générations antérieures au début de la période payée ne consomment pas son quota.

Un renouvellement non payé n’ouvre aucune période supplémentaire. Une annulation à échéance garde l’accès jusqu’à la fin de la période payée ; une résiliation effective le retire. Le remboursement, même partiel, ou une contestation du paiement courant retire les droits payants ; une contestation gagnée peut nécessiter un examen du propriétaire avant réactivation. Aucun document n’est supprimé.

Tant que la configuration est incomplète, `GET /api/billing` renvoie `ready: false`. Les offres de l’espace utilisent alors les liens réels fournis et expliquent l’activation manuelle après vérification. L’interface ne promet pas une activation automatique indisponible.

## Validation et exploitation

Les tests hors réseau couvrent les signatures Stripe réelles sur fixtures, l’isolation des comptes, les prix, les factures, les remboursements, les reprises après perte de réponse, les doublons et les quotas PostgreSQL. Ils ne prouvent pas qu’un événement Live est livré ni que le portail du compte est configuré.

Avant activation, exécuter une recette autorisée dans un environnement de test isolé : paiement réussi, retour interrompu, notification répétée, renouvellement, échec de paiement, annulation et remboursement. Contrôler ensuite la configuration Live dans le compte propriétaire. Aucun paiement réel ne doit être effectué par surprise pour vérifier le site.

Les trois tables `student_billing_*` et leurs fonctions sont réservées au serveur. Elles conservent le lien client/abonnement, les tentatives et le journal des événements, sans données de carte. Les erreurs de traitement du webhook renvoient une erreur réessayable ; surveiller les livraisons échouées dans Stripe.

Références : [Checkout et abonnements](https://docs.stripe.com/billing/subscriptions/build-subscriptions), [webhooks](https://docs.stripe.com/webhooks), [événements d’abonnement](https://docs.stripe.com/billing/subscriptions/webhooks).
