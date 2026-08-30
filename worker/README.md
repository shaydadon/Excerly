# Excerly AI Proxy (Cloudflare Worker)

פרוקסי קטן שמחזיק את מפתח ה-Anthropic **בצד השרת**, כדי שאפליקציית Excerly
הסטטית תוכל להשתמש ב-Claude לניתוח טקסט חופשי — בלי לחשוף את המפתח בדפדפן.

האפליקציה שולחת ל-Worker בקשת `POST` עם `{ action, text/target }`, וה-Worker
מוסיף את המפתח, קורא ל-Claude, ומחזיר JSON נקי.

## פריסה (חד-פעמי, ~5 דקות)

דרוש חשבון Cloudflare (חינמי) ומפתח Anthropic API.

```bash
cd worker
npm install -g wrangler        # כלי הפריסה של Cloudflare
wrangler login                 # פותח דפדפן להתחברות לחשבון Cloudflare

# שמירת המפתח כסוד (לא נשמר בקוד ולא נחשף בדפדפן):
wrangler secret put ANTHROPIC_API_KEY
#   → הדביקו את המפתח sk-ant-... ואשרו

wrangler deploy
```

בסיום הפריסה תקבלו כתובת כמו:

```
https://excerly-proxy.<השם-שלכם>.workers.dev
```

## חיבור לאפליקציה

1. פתחו את Excerly → כרטיס **"מעקב תזונה יומי"** → **⚙️ הגדרות AI**.
2. הדביקו את כתובת ה-Worker בשדה **"כתובת שרת ה-AI (Proxy URL)"**.
3. זהו — מעכשיו החישוב ובניית התפריט משתמשים ב-Claude אוטומטית, לכל מי
   שנכנס לאתר. אם ה-AI לא זמין, האפליקציה נופלת חזרה למנוע המקומי.

## הגדרות

- **מודל:** ברירת המחדל היא `claude-opus-5` (דיוק מרבי). לחיסכון ותגובה
  מהירה יותר, שנו את `MODEL` בקובץ `wrangler.toml` ל-`claude-haiku-4-5`
  והריצו שוב `wrangler deploy`.
- **דומיינים מורשים (CORS):** ערכו את `ALLOWED_ORIGINS` בראש
  `excerly-proxy.js` אם האתר מתארח בכתובת אחרת מ-`shaydadon.github.io`.
- **עלות:** כל בקשה משתמשת במפתח שלכם ומחויבת בחשבון Anthropic שלכם.
  שקלו להוסיף Rate Limiting של Cloudflare אם האתר ציבורי.

## אבטחה

המפתח נשמר כ-Secret של Cloudflare ומוזרק רק בצד השרת בזמן הקריאה
ל-Anthropic. הוא לעולם אינו נשלח לדפדפן ואינו מופיע בקוד המקור.
