# מדריך מוכר – The Wedding Planner

המוצר מוכן למכירה. המסמך מסביר מה יש בחבילה, מה צריך להשלים לפני ההעלאה ל-Etsy, ואיך מתחזקים אותו.

## מה יש בחבילה

| קובץ | מה זה |
|---|---|
| `dist/Etsy-Upload/` | **חמשת הקבצים שמעלים ל-Etsy** (המגבלה של Etsy: 5 קבצים, עד 20MB לכל אחד): START HERE, דיגיטלי, Letter, A4, ו-zip עם ההזמנות והגיליון |
| `The-Wedding-Planner_Digital-Hyperlinked.pdf` | 117 עמודים, טאבים לחיצים בכל עמוד, לטאבלט (GoodNotes / Notability) |
| `The-Wedding-Planner_Printable_US-Letter.pdf` / `_A4.pdf` | גרסת הדפסה על רקע לבן (חוסכת דיו) |
| `Invitation-Suite/` | 40 עיצובים: 4 סגנונות × 10 פריטים (Garden Rose בצבעי מים, Ivory Classic, Modern Minimal, Botanical Line), בגדלי הדפסה אמיתיים |
| `The-Wedding-Planner_Spreadsheet.xlsx` | תקציב, אורחים, RSVP, מנות, ספקים, הושבה, צ'קליסט ודשבורד עם נוסחאות |
| `00-START-HERE.pdf` | מדריך לקונה עם כל הקישורים (Canva, ספקים) ותנאי שימוש |
| `Etsy-Listing-Images/` | 8 תמונות מודעה ב-2700×2025 (הגודל ש-Etsy ממליצה עליו) |
| `site/` | אתר רשימת הספקים המתעדכנת |
| `site/app/` | **האפליקציה האינטראקטיבית**: אורחים, הושבה בגרירה, תקציב, צ'קליסט וספקים לידך |

**תוכן הפלאנר:** פרטי הזוג, לוח השראה, סדרי עדיפויות, תאריכים ואנשי קשר; צ'קליסט מלא מ-12 חודשים לפני ועד אחרי החתונה; 12 עמודי חודש ותכנון שבועי; מדריך תקציב עם חלוקה באחוזים, טבלת תקציב, לוח תשלומים ויומן הוצאות; רשימת אורחים ל-150 איש, מנות ורגישויות, 24 שולחנות הושבה ולינה לאורחים. יש גם 16 קטגוריות ספקים: אולם, קייטרינג, צלם, וידאו, DJ, אלכוהול, **בר אקטיבי**, פרחים, איפור, לבוש, עורך טקס, עוגה, דפוס, הסעות, עמדת צילום ותאורה. לכל קטגוריה יש שאלות לשאול את הספק, דף "ספק שנסגר" ודף השוואה של 3 הצעות. בנוסף: מחשבון אלכוהול, תכנון עיצוב, פרחים, לבוש, מוזיקה, רשימת צילומים, אירועים (מסיבת אירוסין, רווקים ורווקות, ארוחת חזרה), טקס, כתיבת נדרים, לו"ז יום החתונה, טיפים לספקים, ערכת חירום, רשימות אריזה, ירח דבש, מתנות ותודות, ושינוי שם.

---

## לפני שמעלים ל-Etsy: 4 צעדים

### 1. ערכו את `build/config.js`
שם המותג (כרגע `Ivory & Vow`, שם זמני), אימייל תמיכה וקישור לחנות. המידע הזה מופיע בכל הקבצים.

### 2. העלו את אתר הספקים לאוויר (בחינם)
התיקייה `site/` היא אתר סטטי. הדרך הפשוטה ביותר:
- **Netlify Drop**: נכנסים ל-app.netlify.com/drop וגוררים את התיקייה `site`. מקבלים כתובת, ואפשר לחבר דומיין משלכם.
- או **GitHub Pages**: מאגר חדש, מעלים את תוכן התיקייה, ואז Settings → Pages.

את הכתובת שמקבלים מעתיקים ל-`vendorDirectoryUrl` ב-config. קוד ה-QR נוצר ממנה אוטומטית.

**איך הרשימה מותאמת לכל קונה:**
- האתר מזהה את מדינת הגולש לפי אזור הזמן והשפה של המכשיר. הזיהוי נעשה במכשיר עצמו, בלי שירות חיצוני ובלי לשלוח מידע לשום מקום. הגולש יכול גם לבחור מדינה ולהוסיף עיר.
- **"Find vendors near you":** לכל אחת מ-16 הקטגוריות מופיעים חיפוש ב-Google Maps בשפה המקומית (בישראל: "בר אקטיבי", "צלם חתונות", "מגנטים לחתונה" ועוד), ביקורות, אינסטגרם, ואתרי הספקים המובילים במדינה: Mit4Mit בישראל, The Knot / WeddingWire / Zola בארה"ב, Hitched / Bridebook בבריטניה, Bodas.net בספרד וכו'. כך כל קונה מקבל תוצאות עדכניות בלי שתצטרכו לתחזק רשימה.
- **"Recommended in ...":** ספקים שבחרתם בעצמכם ב-`site/vendors.json`, כל אחד עם קוד מדינה (`"country": "IL"`). גולש רואה רק את הספקים של המדינה שלו. כאן יש מקום להכנסה נוספת: ספקים יכולים לשלם על מיקום `featured`.
- מדינות, מונחי חיפוש ואתרים מוגדרים ב-`site/locales.js`. כרגע יש 26 מדינות, ומדינה חדשה היא שורה אחת.
- קישור למדינה מסוימת: `?country=IL` בסוף הכתובת.

> ⚠️ ב-`vendors.json` יש כרגע 5 ספקים **לדוגמה בלבד** (מסומנים "Sample listing"). מחקו אותם, והוסיפו רק ספקים שבדקתם. החיפוש החי עובד בכל מקרה, גם בלי ספקים מומלצים.

### 3. צרו את תבניות ה-Canva וקבלו קישורים
לכל אחד מ-40 העיצובים (`dist/Invitation-Suite/...`):
1. ב-Canva: **Create a design → Import file**, ומעלים את ה-PDF. Canva הופך אותו לעיצוב שאפשר לערוך.
2. בודקים שהגופנים הם **Cormorant Garamond** ו-**Jost** (שניהם קיימים ב-Canva בחינם) ומתקנים אם צריך.
3. **Share → More → Template link** (בחלק מהחשבונות זה דורש Canva Pro), ומעתיקים את הקישור.
4. מדביקים את הקישור במקום המתאים ב-`canva` בקובץ `config.js`.

אחרי שכל הקישורים נמצאים ב-config, הכפתורים "Edit in Canva" בפלאנר וב-START HERE מובילים לתבניות. כרגע כולם מובילים ל-canva.com.

### 4. בנו מחדש
```bash
cd wedding-planner
npm install
npm run all      # PDFs + גיליון + תמונות מודעה + אריזה ל-dist/Etsy-Upload
```

---

## האפליקציה האינטראקטיבית (`site/app/`)

PDF לא יכול לעשות גרירה ושחרור, ולכן הפלאנר מגיע עם אפליקציית ווב מלווה. האפליקציה עולה לאוויר יחד עם רשימת הספקים, באותו העלאה של התיקייה `site`, והכתובת שלה היא `<כתובת האתר>/app/`. מכניסים את הכתובת ל-`appUrl` בקובץ `build/config.js`. ב-PDF יש אליה כפתורים בעמוד הפתיחה, ברשימת האורחים, בעמודי ההושבה, בעמוד הספקים וב-START HERE.

**מה יש בה:**
- **אורחים:** הוספה מהירה (הדבקת רשימה שלמה), אישורי הגעה, מנות, הערות וחיפוש.
- **הושבה בגרירה ושחרור:**
  - גוררים אורחים לשולחנות. עובד עם עכבר, מגע ועט, גם באייפד ובטלפון.
  - מזיזים שולחנות על המפה.
  - מוסיפים שולחן עגול, אבירים או שולחן חתן-כלה, ומשנים שם ומספר מקומות.
  - האפליקציה מתריעה כששולחן מלא.
  - הדפסה של רשימת הושבה לפי שולחן.
- **תקציב:** הערכה, בפועל, ששולם ויתרה, עם סיכומים אוטומטיים והתראה על חריגה.
- **צ'קליסט:** 80 משימות עם סימון ואחוז התקדמות.
- **ספקים לידך:**
  - האפליקציה מזהה מדינה. מקלידים עיר או משתמשים במיקום.
  - **ספקים אמיתיים מ-OpenStreetMap, אוטומטית:** אולמות, קייטרינג, צלמים, אלכוהול, פרחים, איפור ושיער, עוגות, דפוס, השכרת רכב וציוד, עם מרחק, כתובת, טלפון ואתר.
  - לספקים בלי חנות פיזית (DJ, בר אקטיבי, עורך טקס) מוצגים חיפושים מוכנים בשפה המקומית.
  - "שמור" מעביר ספק לרשימת "My vendors", עם סטטוס (פנייה, הצעה, סגור) והערות.
- **סקירה:** ספירה לאחור ותמונת מצב של אורחים, הושבה, תקציב וצ'קליסט.

**פרטיות ושמירה:**
- כל הנתונים נשמרים במכשיר של הקונה. אין שרת ואין התחברות, אז אין לכם מה לתחזק ואין מידע אישי שאתם אחראים עליו.
- גיבוי ושחזור עושים דרך Export ו-Import (קובץ JSON), למשל כדי לעבור למכשיר אחר.
- אפשר להתקין את האפליקציה למסך הבית, והיא עובדת גם בלי אינטרנט. חיפוש ספקים דורש חיבור.

**חשוב לדעת על נתוני הספקים:**
- המקור הוא OpenStreetMap, מאגר פתוח וחינמי ללא מפתח API. חובה להציג קרדיט ("© OpenStreetMap contributors"), וזה כבר מוצג.
- הכיסוי טוב לעסקים עם חנות, וחלש לנותני שירות שעובדים מהבית.
- השרתים הציבוריים (Overpass) עמוסים לפעמים. האפליקציה מנסה 3 שרתים, ואם כולם עמוסים מציגה "נסו שוב בעוד דקה".
- בדקתי את התצוגה עם נתוני אמת מתל אביב (12 חנויות פרחים, ממוינות לפי מרחק). את החיבור החי לשרת הראשי לא יכולתי לבדוק מסביבת הפיתוח, כי הרשת שלה חוסמת אותו. כדאי לבדוק פעם אחת אחרי שהאתר עולה לאוויר.
- אם בעתיד תרצו תוצאות עשירות יותר (דירוגים, תמונות, שעות פתיחה), אפשר לחבר Google Places API דרך Cloudflare Worker. זה כרוך בעלות לפי שימוש.

---

## טקסט המודעה ב-Etsy (באנגלית, מוכן להעתקה)

**Title**
```
Wedding Planner Printable & Digital Bundle, 117 Page Hyperlinked GoodNotes Planner, Budget Spreadsheet, Canva Invitation Templates
```

**13 Tags** (כל אחד עד 20 תווים)
```
wedding planner, digital planner, wedding checklist, wedding budget, goodnotes planner, printable planner, bride to be gift, engagement gift, wedding organizer, canva invitation, wedding template, guest list tracker, wedding binder
```

**Description**
```
Plan your whole wedding calmly, from yes to ever after.

The Wedding Planner is a complete, beautifully minimal planning system, illustrated with fine-art botanical paintings and a soft color for every section: a 117-page planner in printable and digital versions, 40 invitation templates you edit in Canva, a budget and guest-list spreadsheet that does the math, and access to our regularly updated vendor directory.

WHAT'S INCLUDED
• Digital planner: 117 hyperlinked pages with tabs for GoodNotes, Notability, Noteshelf, Xodo and more
• Printable planner: US Letter and A4 PDFs
• Invitation suite: 40 Canva templates in 4 styles (save the date, invitation, RSVP, details, program, menu, table number, place card, welcome sign, thank-you card)
• Spreadsheet: budget, guest list, RSVPs, meals, vendors, seating and checklist, with an automatic dashboard (Excel, Google Sheets, Numbers)
• Interactive web app: drag-and-drop seating chart, guest list, budget, checklist and real vendors near you (works on phone, tablet and computer)
• Live vendor directory, updated regularly
• Start-here guide with every link

INSIDE THE PLANNER
• About us, vision board, priorities, key dates and contacts
• Month-by-month checklist from 12+ months out
• 12 monthly planners and a weekly planner
• Budget guide, budget overview, payment schedule, expense log
• Guest list for 150 guests, meals and dietary needs, seating charts for 24 tables, guest accommodation
• 16 vendor categories (venue, catering, photographer, videographer, DJ, bar and alcohol, active/mobile bar, florist, hair and makeup, attire, officiant, cake, stationery, transportation, photo booth, rentals): questions to ask, booked-vendor details and a 3-quote comparison
• Alcohol calculator
• Attire, wedding party, flowers, décor and rentals, menu, music and playlist, photo shot list
• Engagement party, shower, bachelor/ette, rehearsal dinner, ceremony planner, vow writing, reception order
• Wedding-day timeline, vendor schedule and tipping guide, final week, emergency kit, packing lists
• Honeymoon planner, gifts and thank-yous, name change checklist, keepsake pages and notes

HOW IT WORKS
1. Purchase and download the files from your Etsy account
2. Open START HERE for links and instructions
3. Import the digital PDF into your note-taking app, or print the pages you need
4. Click the Canva links to edit your invitations (free Canva account)

PLEASE NOTE
• This is a digital product. Nothing will be shipped.
• Colors may vary slightly between screens and printers.
• For personal use only. Please do not share or resell the files.
• Because of the nature of digital files, all sales are final. If anything isn't working, message us and we'll make it right.
```

**מחיר:** זה מוצר "באנדל" (פלאנר, הזמנות, גיליון ומדריך ספקים), כך שהוא יכול להיות בצד העליון של הקטגוריה. לפני שקובעים מחיר, בדקו מחירים של 5–10 מודעות מתחרות ב-Etsy (חפשו "wedding planner bundle digital"). מקובל להשיק עם הנחה זמנית כדי לצבור מכירות וביקורות ראשונות.

**הגדרות המודעה:** Type: Digital. Category: Paper & Party Supplies → Paper → Calendars & Planners. Who made it: I did. What is it: A finished product. תמונה 1 היא `01-cover.png`, ומעלים את שאר התמונות לפי הסדר.

---

## הערות חשובות
- **תמונות:** האיורים הם ציורים בוטניים מהמאות ה-16 עד ה-19 (רדוטה ואחרים), מאוסף Open Access של מוזיאון המטרופוליטן. הרישיון שלהם הוא CC0, נחלת הכלל, ומותר להשתמש בהם מסחרית ללא קרדיט. בכל זאת מצוין קרדיט קטן בעמודי הפתיחה של הפרקים. המקורות והקישורים נמצאים ב-`art/src/CREDITS.json`. הסקריפט `art/cutout.py` מנקה את רקע הנייר ומכין PNG שקופים.
- **צבעים:** לכל פרק צבע משלו (קורל, לילך, משמש, סגול-ורוד, מרווה, ורוד, מנטה, כחול מאובק ושמפניה), שמופיע בטאבים, בכותרות ובתיבות. אפשר לשנות אותם ב-`THEMES` שבקובץ `build/planner.js`.
- **רישוי:** הגופנים (Cormorant Garamond, Jost) הם תחת רישיון SIL Open Font License, שמתיר שימוש מסחרי והטמעה ב-PDF. כל העיצובים והאיורים נוצרו כאן מאפס.
- **מספרים מקומיים:** חלוקת התקציב והטיפים מוצגים במוצר כ"נקודת פתיחה מקובלת". הם מבוססים על מנהגים מארה"ב ואירופה, ובמוצר כתוב במפורש שהם משתנים לפי מדינה.
- **גרסה בעברית:** כל הטקסט נמצא ב-`build/content.js` וב-`build/planner.js`, כך שאפשר להפיק גרסה עברית לשוק הישראלי.
