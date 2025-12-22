# Deployment-Anleitung: Render + Vercel

Diese Anleitung zeigt, wie du die Kartenspiel-Turnierverwaltung mit Render (Backend) und Vercel (Frontend) im Internet veröffentlichst.

## Schritt 1: GitHub-Repository vorbereiten

### 1.1 GitHub-Account erstellen (falls nicht vorhanden)
- Gehe zu https://github.com
- Melde dich an oder erstelle einen Account

### 1.2 Repository erstellen
```bash
cd /Users/rmitter_dev/projects/ai-app

# Git initialisieren
git init
git add .
git commit -m "Initial commit: Kartenspiel-Turnierverwaltung"

# Neuen Branch erstellen
git branch -M main

# Remote Repository hinzufügen (ersetze USERNAME)
git remote add origin https://github.com/USERNAME/ai-app.git

# Hochladen
git push -u origin main
```

## Schritt 2: Backend auf Render deployen

### 2.1 Render-Account erstellen
1. Gehe zu https://render.com
2. Melde dich mit GitHub an (Sign up with GitHub)
3. GitHub-Zugriff erlauben

### 2.2 Web Service erstellen
1. Dashboard → "New +" → "Web Service"
2. GitHub-Repository wählen: `ai-app`
3. Folgende Einstellungen:
   - **Name**: `ai-app-backend`
   - **Runtime**: Python 3.11
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - **Region**: Frankfurt (oder deine Region)
   - **Plan**: Free (oder Paid für bessere Performance)

### 2.3 Umgebungsvariablen setzen
1. Im Render Dashboard → Service → Environment
2. Folgende hinzufügen:
   - `CORS_ORIGINS`: `https://your-vercel-domain.vercel.app` (später aktualisieren)
   - `DATABASE_URL`: `sqlite:///./app.db` (oder PostgreSQL URL)

### 2.4 Deployen
1. Render deployt automatisch
2. Nach dem Deploy: **Backend-URL kopieren** (z.B. `https://ai-app-backend-xyz.onrender.com`)

**Hinweis**: Der erste Request dauert ~1 Minute, da Render den Server hochfährt.

---

## Schritt 3: Frontend auf Vercel deployen

### 3.1 Vercel-Account erstellen
1. Gehe zu https://vercel.com
2. Melde dich mit GitHub an (Sign up with GitHub)
3. GitHub-Zugriff erlauben

### 3.2 Projekt erstellen
1. Dashboard → "Add New" → "Project"
2. GitHub-Repository wählen: `ai-app`
3. Folgende Einstellungen:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Umgebungsvariablen setzen
1. Im Vercel Dashboard → Settings → Environment Variables
2. Neue Variable hinzufügen:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://ai-app-backend-xyz.onrender.com` (Backend-URL aus Schritt 2.4)
   - **Environments**: Production, Preview, Development

### 3.4 Deployen
1. Vercel deployt automatisch
2. Nach dem Deploy: **Frontend-URL kopieren** (z.B. `https://ai-app.vercel.app`)

---

## Schritt 4: CORS-Konfiguration aktualisieren

### 4.1 Backend-CORS aktualisieren
1. GitHub Editor oder lokal:
   ```bash
   # Lokal: backend/app/main.py anpassen
   # CORS_ORIGINS-Umgebungsvariable auf Render aktualisieren
   ```

2. Render Dashboard → ai-app-backend → Environment
   - `CORS_ORIGINS` ändern zu: `https://ai-app.vercel.app` (deine Vercel-Domain)
   - Speichern → Auto-Redeploy

---

## Schritt 5: Testen

1. Öffne die Vercel-URL im Browser: `https://ai-app.vercel.app`
2. Stelle sicher, dass:
   - ✅ Spieler hinzufügen funktioniert
   - ✅ Turniere erstellen funktioniert
   - ✅ Spiele erfassen funktioniert
   - ✅ Statistiken laden funktioniert

---

## Schritt 6: Domain verbinden (Optional)

### 6.1 Domain registrieren
- Namecheap, GoDaddy, oder dein Hoster

### 6.2 Domain auf Vercel verbinden
1. Vercel Dashboard → Project Settings → Domains
2. Custom Domain hinzufügen
3. DNS-Einstellungen bei deinem Registrar aktualisieren (Vercel zeigt die Schritte)

---

## Problembehebung

### Backend antwortet nicht
- **Problem**: "Cannot reach backend" oder 502-Fehler
- **Lösung**: 
  1. Render Dashboard → Logs prüfen
  2. CORS_ORIGINS in Render korrekt gesetzt?
  3. Backend-URL in Frontend-Umgebungsvariable korrekt?

### Frontend lädt nicht
- **Problem**: "404 Not Found"
- **Lösung**:
  1. Vercel Dashboard → Deployments → Logs prüfen
  2. `vercel.json` existiert?
  3. `npm run build` funktioniert lokal?

### Spiele können nicht gespeichert werden
- **Problem**: API-Fehler beim Spiel-Update
- **Lösung**:
  1. Backend-Logs auf Render prüfen
  2. Database korrekt initialisiert?

---

## Performance-Tipps

1. **Free-Tier Limits beachten**:
   - Render: Server schläft nach 15 Min Inaktivität ein
   - Vercel: 100GB Bandwidth/Monat

2. **Für Production**:
   - Upgrade zu Render Pro ($7/Monat)
   - Database zu PostgreSQL (statt SQLite)
   - CDN für Static Files nutzen

3. **Database-Migration zu PostgreSQL**:
   ```bash
   # Render → Create Database → PostgreSQL
   # DATABASE_URL kopieren
   # In Render Environment Variable setzen
   # Backend deployt neu und migriert automatisch
   ```

---

## Nächste Schritte

1. **Backup**: `git push` immer vor Deployments
2. **Monitoring**: Render/Vercel Logs regelmäßig prüfen
3. **Updates**: Code ändern → `git push` → Auto-Deploy
4. **Zusammenarbeit**: GitHub Branch-Schutz einrichten

---

**Viel Erfolg beim Deployment! 🚀**
