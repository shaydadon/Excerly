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

## מכסות AI לכל משתמש (בקרת עלויות ל-SaaS)

כדי למנוע שמשתמש בודד ישרוף את מפתח ה-Anthropic שלכם, ה-Worker סופר בקשות
AI יומיות לכל משתמש מחובר (לפי ה-JWT של Supabase) וחוסם מעל מכסה. משתמש עם
מפתח אישי (BYOK) לא עובר דרך ה-Worker כלל ולכן לא מוגבל.

**1. הריצו ב-Supabase → SQL Editor:**

```sql
create table if not exists ai_usage (
  user_id uuid not null,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
alter table ai_usage enable row level security;
-- אין policy ל-anon: הגישה רק דרך service_role מה-Worker.

-- הגדלה אטומית של המונה, מחזירה את הספירה החדשה
create or replace function increment_ai_usage(p_user uuid, p_day date)
returns int language plpgsql security definer as $$
declare c int;
begin
  insert into ai_usage (user_id, day, count) values (p_user, p_day, 1)
  on conflict (user_id, day) do update set count = ai_usage.count + 1
  returning count into c;
  return c;
end; $$;
```

**2. הגדירו ב-Worker את משתני הסביבה והסודות:**

```bash
wrangler secret put SUPABASE_SERVICE_ROLE   # מפתח service_role מ-Supabase (Settings → API)
```

וב-`wrangler.toml` תחת `[vars]`:

```toml
SUPABASE_URL      = "https://<project>.supabase.co"
SUPABASE_ANON     = "<anon key>"
AI_DAILY_LIMIT    = "25"     # בקשות ליום למשתמש (ברירת מחדל 25)
# AI_REQUIRE_LOGIN = "1"     # אופציונלי: לחייב התחברות לשימוש ב-AI המשותף
```

ואז `wrangler deploy`.

**התנהגות:**
- **ללא `SUPABASE_SERVICE_ROLE`** → המכסה לא נאכפת (כמו קודם).
- נספרות רק בקשות שהצליחו; מעל המכסה מוחזר `429 quota_exceeded`.
- האפליקציה מציגה למשתמש כמה בקשות נותרו היום, ומודיע כשנגמרו (עם הצעה
  להזין מפתח אישי בהגדרות).

## אבטחה

המפתח נשמר כ-Secret של Cloudflare ומוזרק רק בצד השרת בזמן הקריאה
ל-Anthropic. הוא לעולם אינו נשלח לדפדפן ואינו מופיע בקוד המקור.
ה-`service_role` של Supabase גם הוא Secret ולעולם לא נשלח לדפדפן.
