# Configuration OAuth Riot Games

## Étape 1 : Créer une application Riot Developer

1. Allez sur https://developer.riotgames.com/
2. Connectez-vous avec votre compte Riot
3. Cliquez sur "My Apps" ou "Register Product"
4. Créez une nouvelle application

## Étape 2 : Configurer l'application

Dans les paramètres de votre application :

1. **Redirect URIs** : Ajoutez les URLs suivantes
   - Pour le développement local : `http://localhost:3000/api/auth/riot/callback`
   - Pour la production : `https://votre-domaine.com/api/auth/riot/callback`

2. Notez votre **Client ID** et **Client Secret**

## Étape 3 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# API Key existante
RIOT_API_KEY=votre_api_key

# OAuth Credentials (nouveau)
RIOT_CLIENT_ID=votre_client_id
RIOT_CLIENT_SECRET=votre_client_secret
RIOT_REDIRECT_URI=http://localhost:3000/api/auth/riot/callback
```

## Étape 4 : Redémarrer le serveur

```bash
npm run dev
```

## Comment ça marche ?

### Option 1 : Connexion OAuth (Automatique)
1. L'utilisateur clique sur "Se connecter avec Riot Games"
2. Il est redirigé vers Riot pour s'authentifier
3. Après autorisation, il revient automatiquement sur votre app avec son compte lié
4. Les 20 parties récentes sont affichées automatiquement

### Option 2 : Connexion Manuelle (Sans OAuth)
1. L'utilisateur entre manuellement son Game Name et Tag Line
2. Exemple : `Hide on bush` / `KR1`
3. Les 20 parties récentes sont récupérées via l'API Riot

## Notes importantes

- L'**API Key** est **requise** pour récupérer les matches
- Les **credentials OAuth** sont **optionnels** mais offrent une meilleure expérience utilisateur
- Sans OAuth, l'utilisateur peut toujours entrer manuellement son Game Name#Tag
- Les API keys de développement Riot expirent après 24h, pensez à les renouveler
- Pour la production, demandez une API key permanente sur le Riot Developer Portal
