# הרצה מקומית ב-Docker

מתוך שורש הפרויקט:

```bash
docker compose up -d
```

ואז לפתוח `http://localhost:8080`.

עצירה:

```bash
docker compose down
```

`docker-compose.yml` מריץ nginx שמגיש את הקבצים, ושירות `fdc` שמעביר בקשות אל FoodData Central. הדפדפן פונה רק אל `/api/fdc` באותו אתר.

מפתח פרטי, אם יש:

```bash
export FDC_API_KEY="המפתח של data.gov"
docker compose up -d
```

בלי המשתנה, `tools/fdc-proxy.mjs` משתמש ב-`DEMO_KEY` המתועד ב-[מדריך ה-API](https://fdc.nal.usda.gov/api-guide/). זו מכסה נמוכה לפיתוח, לא מפתח ייצור. המפתח לא נכתב לקבצי הפרויקט.

בסביבה שבה נכתב הקוד לא היה `docker` (`command not found`), ולכן Compose עצמו לא הורץ. הפרוקסי הורץ ישירות עם `node tools/fdc-proxy.mjs` ונבדק מול ה-API.
