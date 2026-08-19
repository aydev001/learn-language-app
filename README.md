# Rus tili — Telegram Mini App

Telegram bot ichida ishlaydigan, rus tilini o'rganish uchun uy vazifasi ilovasi.
O'quvchi matnni ovoz chiqarib o'qiydi, ilova talaffuzni tahlil qilib xatolarni
ovoz bilan tushuntiradi; so'zlarni esa tezlik testlari orqali yodlaydi.

## Uch modul

**1. Matn ustida ishlash.** Ikki bosqichdan iborat.

*Tinglash* — butun matn abzatsma-abzats ketma-ket o'qib beriladi, joriy
abzats ajratib ko'rsatiladi. Bu yerda ovoz yozish yo'q: maqsad hikoyani
bir butun holda eshitib, umumiy tasavvur olish.

*Urg'u mashqi* — matn `CHUNK_SIZE` (8) tadan qismlarga bo'linadi, chunki bitta
darsda 20-40 gap bo'ladi va hammasini bir o'tirishda o'qish charchatadi.
O'quvchi gapni eshitadi, istalgan so'zni bosib alohida tinglaydi, keyin o'zi
o'qib mikrofonga yozadi. Server yozuvni matnga aylantiradi, kutilgan matn
bilan so'zma-so'z solishtiradi (Needleman–Wunsch), so'ng model xatolarni
o'zbek tilida izohlaydi. Izoh ovoz bilan yangraydi, har bir xato so'z ustida
esa "urg'u qaysi bo'g'inda?" mashqi ochiladi.

Ovoz har doim **tabiiy tezlikda** yangraydi va so'zlar bo'g'inlarga bo'lib
o'qilmaydi. Sun'iy sekinlashtirish urg'u naqshini buzadi va o'quvchi keyin
haqiqiy nutqni tanimay qoladi — u so'zni qanday aytilsa, shundayligicha
eshitishi kerak. Bo'g'inlar faqat ekranda, urg'uni tanlash mashqida ko'rinadi.

**2. So'zlarni yodlash.** Har darsda ~20 so'z. Uch rejim: kartochkalar
(bosimsiz tanishuv), tezlik testi (so'zga 10 soniya) va gapda ishlatish
(gapga 20 soniya — o'qish uchun ko'proq vaqt kerak). Tezlik bonusi vaqt
chegarasining 60% ida tugaydi, ya'ni ikkala rejimda "tez javob berdim"
bir xil ma'noni bildiradi. Ballar reytingga tushadi.

**3. Birga kino ko'rish.** O'quvchi YouTube havolasini berib "uy" (room)
yaratadi va do'stini taklif qiladi. Do'st havolani bosganda uy egasiga kirish
so'rovi boradi; u tasdiqlagach kino ikkalasida **bir vaqtda** ketadi —
play, pauza va vaqt chizig'ini surish hammaga uzatiladi. Yonida matnli chat
ishlaydi. Video hech qayerda saqlanmaydi: bazada faqat 11 belgilik
`videoId` turadi, ko'rsatishni YouTube'ning o'z pleeri bajaradi.

### Nega WebSocket emas

Ilova Vercel'da serverless funksiya sifatida ishlaydi — u yerda doimiy
ulanish ham, instansiyalar orasidagi umumiy xotira ham yo'q. Socket.io
alohida server (Railway/Fly) talab qilardi: yangi hosting, yangi xarajat,
ikkita alohida deploy.

Shuning uchun haqiqat manbai — MongoDB, mijoz esa uy ichida turganda
1,5–2,5 soniyada bir marta `sync` so'raydi. Bitta kod lokalda ham,
Vercel'da ham bir xil ishlaydi.

Videoning "hozirgi joyi" bazada saqlanmaydi — u har soniyada o'zgaradi.
Saqlanadigani: `positionSec` (belgilangan lahzadagi joy) va `stateAt`
(o'sha lahza). Hozirgi joyni mijoz hisoblaydi. Telefon soati adashishi
mumkin, shuning uchun server har javobda `serverNow` ni ham yuboradi va
mijoz farqni to'g'rilab oladi. Og'ish 1,5 soniyadan oshsa video
avtomatik tenglashtiriladi.

## Texnologiyalar

| Qism | Nima ishlatilgan |
|---|---|
| Frontend | Vite 8, React 19, TypeScript, Tailwind v4, shadcn/ui (base-vega) |
| Backend | Hono (Vercel serverless funksiyasi sifatida) |
| Baza | MongoDB Atlas (yo'q bo'lsa — xotirada ishlaydi) |
| Ovoz | OpenAI `gpt-4o-mini-tts` (o'qish), `gpt-4o-mini-transcribe` (eshitish), `gpt-4.1-mini` (tahlil) |
| Kontent importi | `gpt-4.1` — urg'u va tarjima sifati uchun |
| Auth | Telegram `initData` HMAC-SHA256 tekshiruvi |

Bitta Hono ilovasi (`server/app.ts`) ham lokal dev'da, ham Vercel'da ishlaydi —
`vercel dev` yoki ikkinchi terminal kerak emas.

## Ishga tushirish

```bash
npm install
cp .env.example .env    # keyin .env ni to'ldiring
npm run dev             # http://localhost:5173
```

`.env` da hech narsa bo'lmasa ham ilova ochiladi (`ALLOW_DEV_USER=1` bilan),
lekin ovoz bilan bog'liq funksiyalar `OPENAI_API_KEY` talab qiladi.

### Ikki foydalanuvchi bo'lib sinash

Kino uyini bir kompyuterda sinash uchun ilovani `?devUser=<raqam>` bilan
oching — server so'rovni o'sha id'li soxta foydalanuvchi deb qabul qiladi:

```
http://localhost:5173/rooms?devUser=1     # uy egasi
http://localhost:5173/rooms?devUser=2     # mehmon (boshqa oynada)
```

Qiymat `sessionStorage` da saqlanadi, ya'ni ilova ichida yurganda ham
o'zgarmaydi, lekin **har oyna o'zinikini saqlaydi** — shuning uchun ikkinchi
foydalanuvchini alohida oynada (yoki incognito'da) oching.

Videoni brauzer faqat **faol** oynada o'ynatadi, shuning uchun sinxronni
ko'rish uchun ikkita alohida oyna kerak (bir oynadagi ikki tab emas).

Production'da bu butunlay o'chiq: `env.allowDevUser` ishlab chiqarish
muhitida `ALLOW_DEV_USER` qiymatidan qat'i nazar `false` qaytaradi.

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Dev server (frontend + API bitta portda) |
| `npm run build` | Tiplarni tekshirib, production build |
| `npm run typecheck` | Faqat tip tekshiruvi |
| `npm run lint` | ESLint |
| `npm run prewarm` | Dars audiosini oldindan tayyorlash rejasi va narxi |
| `npm run prewarm -- --yes` | Haqiqatan tayyorlaydi |
| `npm run usage` | Shu oygi sarf va kesh hajmi |
| `npm run cache:prune` | Keshdagi keraksiz audioni ko'rsatadi |
| `npm run cache:prune -- --yes` | O'chiradi |
| `npm run import -- <fayl>` | txt darsni bazaga qo'shadi |
| `npm run tg:setup -- <url>` | Botni shu manzilga ulaydi |
| `npm run tg:status` | Webhook holati va oxirgi xato |
| `npm run test:rooms` | Kino uyi API'sining uchidan-uchiga sinovi (bazasiz) |

## Telegram'ga ulash

Bot bitta ish qiladi: o'quvchini ilovaga kiritadi. Butun ta'lim jarayoni
Mini App ichida bo'lgani uchun murakkab dialog kerak emas.

Ilova HTTPS manzilda turishi shart. Lokal sinov uchun tunnel:

```bash
npx cloudflared tunnel --url http://localhost:5173
npm run tg:setup -- https://xxx.trycloudflare.com
```

Skript uch ishni bajaradi: webhook o'rnatadi, chat menyusidagi tugmani
ilovaga bog'laydi va `/start` bilan `/help` buyruqlarini ro'yxatga oladi.
`PUBLIC_APP_URL` ni `.env` ga ham yozib qo'yadi.

Tunnel manzili har qayta ishga tushirilganda o'zgaradi — o'shanda skriptni
yangi manzil bilan qayta yuriting va dev serverni restart qiling
(Vite `.env` ni faqat startda o'qiydi).

BotFather'da qo'lda hech narsa sozlash shart emas.

### Webhook xavfsizligi

`setWebhook` da maxfiy kalit beriladi, Telegram uni har so'rovda
`X-Telegram-Bot-Api-Secret-Token` sarlavhasida qaytaradi. Kalit bot
tokenidan hosil qilinadi — alohida o'zgaruvchi saqlash shart emas, sozlash
skripti va server bir xil qiymatni mustaqil hisoblaydi. Noto'g'ri kalit —
403.

## Xarajatni boshqarish

Ovoz sintezi — yagona sezilarli xarajat. Uni ushlab turadigan uch mexanizm bor.

**1. Uch qavatli kesh.** Bir marta sintez qilingan audio qayta so'ralmaydi:
brauzer → server xotirasi → MongoDB. Dars matnlari hamma o'quvchi uchun bir
xil, shuning uchun ular umri davomida bir marta to'lanadi.

**2. Oldindan tayyorlash.** `npm run prewarm -- --yes` barcha gaplar, so'zlar,
misollar va alohida so'zlarni bir yo'la tayyorlaydi (2 dars ≈ $0.15). Shundan
keyin interfeysni istagancha sinash mumkin — ovoz keshdan chiqadi, pul ketmaydi.
Kontentni o'zgartirsangiz qayta ishga tushiring; mavjudlari qayta sintez qilinmaydi.

```bash
npm run prewarm                      # rejani ko'rish (hech narsa qilmaydi)
npm run prewarm -- --yes             # tayyorlash
npm run prewarm -- --yes --core      # alohida so'zlarsiz, arzonroq
npm run prewarm -- --yes --lesson=lesson-01
npm run prewarm -- --yes --jobs=8    # parallellik
```

OpenAI so'rovlar chegarasi to'ldiriladigan chelak (daqiqasiga ~7 ta). Ko'p
klipni birdan yuborsangiz chelak bo'shaydi — skript buni sezib, kutib turadi
va qayta uradi, xato deb hisoblamaydi.

**3. Oylik chegara.** `.env` dagi `MONTHLY_BUDGET_USD` oshib ketsa yangi sintez
to'xtaydi, keshdagi audio esa ishlayveradi — o'quvchi farqni sezmaydi.
`npm run usage` bilan holatni ko'rasiz.

### Kontent o'zgarganda

Dars matnlarini almashtirsangiz eski audio keshda qolib ketadi. Tartib:

```bash
npm run cache:prune          # nima ortiqcha qolganini ko'rish
npm run cache:prune -- --yes # o'chirish
npm run prewarm -- --yes     # yangi matnlarni tayyorlash
```

Kerakli kliplar ro'yxati `server/content/clips.ts` da — prewarm ham,
tozalash ham shu bitta manbadan o'qiydi, shuning uchun tozalash hech qachon
kerakli audioni o'chirib yubormaydi.

### Tahlil ekranini bepul sozlash

Talaffuz tahlili keshlanmaydi — har bir yozuv noyob. Interfeys ustida
ishlayotganda `.env` da:

```
MOCK_PRONUNCIATION=1
```

Shunda ilova modelga umuman murojaat qilmaydi, lekin haqiqiy ko'rinishdagi
hisobot qaytaradi — barcha holatlar bilan (to'g'ri, urg'u xatosi, tovush
xatosi, tushib qolgan so'z). Matnlar oldida `[MOCK]` yozuvi turadi.

## Loyiha tuzilishi

```
api/[[...route]].ts   Vercel kirish nuqtasi — barcha /api/* shu yerga tushadi
server/
  app.ts              Hono marshrutlari (barcha endpointlar)
  content/
    lessons.json      Darslar (import natijasi, qo'lda tahrirlash mumkin)
    lessons.ts        JSON'ni tiplangan holda eksport qiladi
    clips.ts          Audio kerak bo'ladigan matnlar ro'yxati
  lib/
    auth.ts           Telegram initData tekshiruvi
    db.ts             MongoDB + xotiradagi zaxira
    rooms.ts          Kino uyi: a'zolar, holat, chat, taklif havolasi
    youtube.ts        Video sarlavhasi va ko'rish mumkinligi (oEmbed)
    repo.ts           Progress, ball, reyting mantiqи
    openai.ts         TTS / STT / tahlil
    align.ts          So'zlarni tekislash algoritmi
    pronunciation.ts  Talaffuz hisobotini yig'ish
scripts/
  import-lessons.ts   txt -> lessons.json
  room-smoke.ts       Kino uyi oqimining sinovi
  lib/parseLessons.ts Matnni gaplarga ajratish
  lib/stressDict.ts   Urg'u lug'ati
  lib/enrich.ts       Tarjima, misollar, sarlavha
shared/               Frontend va server o'rtasidagi umumiy kod
  types.ts            API shartnomasi + gaplarni qismlarga bo'lish
  stress.ts           Urg'u, bo'g'inlarga ajratish, tokenizatsiya
  scoring.ts          Ball formulasi (serverda qayta hisoblanadi)
  youtube.ts          Havoladan video id ajratish
src/
  screens/            Ekranlar (shu jumladan RoomsScreen, RoomScreen)
  components/
    room/             Sinxron pleer, chat, a'zolar
  lib/                telegram.ts, api.ts, audio.ts, format.ts
                      rooms.ts (polling), youtube.ts (IFrame API)
```

## Kontent qo'shish

Darslar `lesson-data.txt` dan import qilinadi. Fayl formati:

```
LESSON 1

[ixtiyoriy sarlavha, masalan: ТРИ РОЗЫ]

birinchi abzats...

ikkinchi abzats...

СЛОВА

1. слово — tarjima
2. ...
```

```bash
npm run import -- "D:/My Files/lesson-data.txt" --dry-run   # tahlilni ko'rish
npm run import -- "D:/My Files/lesson-data.txt"             # bazaga qo'shish
npm run import -- <fayl> --lesson=2                         # faqat bittasini
```

Skript matnni gaplarga ajratadi va model yordamida to'ldiradi: **urg'u
belgilari**, **o'zbekcha tarjimalar**, **misol gaplar** va dars sarlavhasi.
Natija — `server/content/lessons.json` (qo'lda tahrirlash mumkin).

### Urg'u qanday qo'yiladi

Bu — kontentdagi eng nozik joy, shuning uchun alohida yondashuv:

1. Model butun gapga emas, **har bir so'zga alohida** urg'u qo'yadi.
2. Natijadan **lug'at** tuziladi, belgilarni matnga **kod** qo'yadi.

Nega shunday: butun gapni so'raganda model matnni qayta yozib yuboradi yoki
so'zlarni tashlab ketadi. Lug'at usulida ruscha matn hech qachon o'zgarmaydi
va har bir so'z tekshiruvdan o'tadi.

Model tanlovi ham muhim — sinovda 18 ta qiyin so'zda:

| Model | To'g'ri |
|---|---|
| gpt-4.1-mini | 10/18 |
| gpt-4.1 | 18/18 |

Shuning uchun import `OPENAI_IMPORT_MODEL` (sukut bo'yicha `gpt-4.1`)
ishlatadi. Tarjimada ham mini ma'noni ag'darib yuborgan edi
("давно-давно" → "yaqinda"), shu sabab tarjima ham shu modelda.

Import tugagach `server/content/stress-review.txt` yaratiladi — barcha
so'zlarning urg'usi ro'yxati. **Uni ko'rib chiqing**: model 100% aniq emas,
xato bo'lsa `lessons.json` da tuzating.

Urg'u **U+0301** (combining acute) bilan, urg'uli unlidan **keyin**:

```
молоко́    →  м о л о к о + U+0301
```

Bo'g'inlarga ajratish va urg'u mashqlari shu belgidan avtomatik hisoblanadi.
`ё` har doim urg'uli, unga belgi qo'yilmaydi.

Kontent o'zgargach audioni yangilang:

```bash
npm run cache:prune -- --yes
npm run prewarm -- --yes
```

## Xavfsizlik eslatmalari

- Ball serverda qayta hisoblanadi — mijoz yuborgan `score` ga ishonilmaydi.
- `initData` 24 soatdan eski bo'lsa rad etiladi.
- `ALLOW_DEV_USER` production'da hech qachon `1` bo'lmasin.
