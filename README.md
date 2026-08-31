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
play, pauza va vaqt chizig'ini surish hammaga uzatiladi. Yonida matnli chat va
**ovozli suhbat** ishlaydi. Video hech qayerda saqlanmaydi: bazada faqat 11
belgilik `videoId` turadi, ko'rsatishni YouTube'ning o'z pleeri bajaradi.

### Ochiq va maxfiy uylar

Uy ochilayotganda ikki variant bor, sukut bo'yicha — **ochiq**:

- **Ochiq** uy «Kino» bo'limidagi «Ochiq uylar» ro'yxatida hammaga ko'rinadi.
  Kodni bilmagan odam ham unga kirish so'rovini yubora oladi.
- **Maxfiy** uy hech qayerda ko'rinmaydi. Unga faqat taklif havolasini
  (ya'ni kodni) olgan odam borishi mumkin.

Ko'rinish faqat **kim so'rov yubora oladi**ni hal qiladi, **kim kiradi**ni
emas: ikkala holatda ham ichkariga o'tish uchun uy egasining tasdig'i kerak.
Egasi buni keyin ham o'zgartira oladi; o'zgarish uy suhbatiga yozib qo'yiladi,
chunki u a'zolarga ham taalluqli.

Ochiq ro'yxatda o'zim aloqador uylar ko'rinmaydi (a'zo ham, so'rov yuborgan
ham, bloklangan ham) — ular «Mening uylarim» da turadi. Tartib: avval odam
bor uylar, keyin oxirgi harakat vaqti bo'yicha, ko'pi bilan 30 ta.

Maxfiylik keyin qo'shilgani uchun eski uylarda bu maydon yo'q. Ular ochiq
deb hisoblanadi (`$ne: "private"`) — hech kimning uyi kutilmaganda yashirinib
qolmasligi kerak.

### Ovozli suhbat

Kino ketayotganda yozib o'tirish noqulay: ekrandan ko'z uzish kerak, qiziq
joyini esa o'sha zahoti aytgingiz keladi. Shuning uchun chat yonida mikrofon
tugmasi turadi — bosgan odamlar bir-birini eshita boshlaydi.

**Ovoz serverdan o'tmaydi.** Brauzerlar bir-biriga to'g'ridan-to'g'ri ulanadi
(WebRTC): serverning butun ishi — tanishtirish. Ikki brauzer bir marta xat
almashadi ("men shu manzillardaman, kodek shunday"), keyin ovoz ular orasida
ketadi. Bu bizga trafik ham, xarajat ham keltirmaydi va Vercel'ning
serverless muhitiga to'g'ri keladi — ovoz oqimini ushlab turadigan doimiy
ulanish baribir yo'q.

Tanishtiruv xatlari (SDP) o'sha `sync` javobida keladi va o'sha yo'l bilan
qaytadi, ya'ni yangi ulanish turi ham, yangi hosting ham kerak emas. Kim
mikrofonini yoqqani ham shu so'rovda bildiriladi (`voice=1`), shuning uchun
ovozli suhbat uchun alohida "tirikman" so'rovi qo'shilmadi.

Nomzodlar (ICE) bittalab yuborilmaydi. Odatda WebRTC ularni topgan sayin
yuboradi, lekin bizda kanal sekin — sekundiga bir marta so'raladigan polling.
Har bir nomzod alohida ketsa ulanish o'nlab soniyaga cho'zilardi. Shuning
uchun nomzodlar yig'ilib bo'lguncha kutiladi (ko'pi bilan 2,5 soniya) va
hammasi SDP ichida bir yo'la ketadi: juftlik uchun ikkita xat yetarli.

Taklifni **id'si kichigi** yuboradi, kattasi javob beradi. Ikkalasi bir vaqtda
taklif yuborsa ulanish chalkashardi; ikkala tomon ham ikkala id'ni bilgani
uchun bu qoidaga kelishuv kerak emas.

### Aks-sado va tiniqlik

Ovozli suhbatdagi eng katta muammo — kino ovozining karnaydan chiqib,
mikrofonga qaytib tushishi. Do'stingiz o'shanda kinoni ikki marta eshitadi:
o'zinikini va sizning mikrofoningizdan kelganini, biroz kechikkan holda —
quloqqa u aks-sado ("reverb") bo'lib eshitiladi. Brauzerning aks-sado
o'chirgichi (AEC) buni to'liq yo'q qila olmaydi, ayniqsa telefon karnayida.

Uch qavat himoya bor:

**1. Ovoz darvozasi.** Mikrofon do'stga to'g'ridan-to'g'ri emas, kichik
zanjir orqali ketadi:

```
mikrofon ──┬── analizator (o'lchov)
           └── darvoza (gain) ── chiquvchi oqim
```

Odam gapirmayotganda darvoza yopiladi va do'stga hech narsa ketmaydi —
kino "sharpasi" ham. Gapirilganda bir zumda ochiladi. Analizator
darvozadan **oldin** ulanadi: aks holda darvoza bir marta yopilgach daraja
abadiy nol bo'lib qolar va qaytib ochilmasdi (`track.enabled = false` ham
xuddi shu tuzoqni yaratardi — shuning uchun uzish emas, gain ishlatiladi).
Ochilish-yopilish 60 ms da yumshoq bajariladi, aks holda har safar "chirt"
etib eshitilardi.

**2. Kino ovozini pasaytirish.** Kimdir gapirganda kino ovozi beshdan biriga
tushadi va gap tugagach o'zi tiklanadi. Butunlay o'chirilmaydi: kino sizsiz
ketaveradi va gap tugaganda nima bo'lganini bilmay qolasiz. Pasayish
**o'zingiz gapirganda ham** ishlaydi — shunda karnaydan mikrofonga qaytadigan
ovoz kamayadi, ya'ni do'stingizga aks-sado bormaydi.

**3. Naushnik.** Yuqoridagi ikkitasi aks-sadoni sezilarli kamaytiradi, lekin
butunlay yo'q qiladigan yagona yo'l — karnayni umuman ishlatmaslik. Bir
xonada ikki qurilmada ko'rilayotgan bo'lsa bu ayniqsa muhim.

Uzilishlarga qarshi: ovoz oqimi 48 kbit bilan cheklanadi va tarmoqda
ustunlik oladi (`networkPriority: "high"`). Sababi — bir vaqtda YouTube ham
xuddi shu kanaldan oqib turadi; video bufer to'ldirayotgan lahzada gap
uzilib qolmasligi kerak. Opus'ning yo'qolgan paketni tiklash mexanizmi
(inband FEC) brauzerda sukut bo'yicha yoqilgan.

Ovoz darajasi ikki tomonda ham o'lchanadi (Web Audio) — kim gapirayotgani
avatar atrofidagi halqadan ko'rinadi, ya'ni "meni eshityaptimi?" degan savol
qolmaydi.

Ba'zi tarmoqlarda (qattiq NAT, korporativ Wi-Fi) to'g'ridan-to'g'ri yo'l
topilmaydi. Bunda TURN server kerak bo'ladi — `.env` dagi `TURN_URLS`,
`TURN_USERNAME`, `TURN_PASSWORD`. Sozlanmagan bo'lsa ulanish faqat STUN bilan
urinadi va muvaffaqiyatsizlikda foydalanuvchiga sababi aytiladi.

### Nega WebSocket emas

Ilova Vercel'da serverless funksiya sifatida ishlaydi — u yerda doimiy
ulanish ham, instansiyalar orasidagi umumiy xotira ham yo'q. Socket.io
alohida server (Railway/Fly) talab qilardi: yangi hosting, yangi xarajat,
ikkita alohida deploy.

Shuning uchun haqiqat manbai — MongoDB, mijoz esa uy ichida turganda
1,2–1,8 soniyada bir marta `sync` so'raydi. Bitta kod lokalda ham,
Vercel'da ham bir xil ishlaydi.

### Uy holati — yagona haqiqat manbai

Bir vaqtlar har bir mijoz o'z pleeridan o'qigan soniyani uyga qaytarib
yozardi: "men 100,2 daman" — "yo'q, men 99,8 daman". Ikki tomon bir-birining
o'lchovini ustiga yozar, video esa oldinga-orqaga sakrardi. Ekrandagi vaqt
ham pleerdan olingani uchun ikki ekranda ikki xil raqam turar, pleer qayta
yuklanganda esa 0:00 ga tushib ketardi.

Endi pleerdan o'qilgan hech narsa uyga ketmaydi. Uyga faqat **niyat**
yuboriladi — "o'ynat", "to'xtat", "shu soniyaga o't" — soniyasi esa har doim
uyning soatidan hisoblanadi. Ekrandagi vaqt ham, chiziq ham o'sha soatdan
chiziladi, shuning uchun ikkala ekranda bir xil raqam turadi va u hech
qachon orqaga sakramaydi.

Pleer bu yerda quyi qurilma: uni bitta `steer()` funksiyasi uy holatiga
qarab yo'naltiradi. Bosilgan tugma ham, do'stdan kelgan o'zgarish ham,
kuzatuvning jimgina tuzatishi ham xuddi shu bitta yo'ldan o'tadi — "kim
boshladi" degan farq qolmadi, demak ikki tomon bir-birini ustma-ust
tuzatadigan holat ham qolmadi.

### Nega YouTube boshqaruvi yashirilgan

Pleerning o'z tugmalari ochiq bo'lganda biz foydalanuvchi nima qilganini
**taxmin** qilardik: vaqt sakrab ketdimi — demak surgan, "PAUSED" hodisasi
keldimi — demak to'xtatgan. Taxmin ishonchsiz: bufer ham, reklama ham, hali
boshlanmagan video ham xuddi shunday ko'rinardi, natijada uy noto'g'ri
soniyaga sakrab ketardi.

Endi `controls: 0` va iframe ustida `pointer-events: none` — YouTube
interfeysi umuman ishlamaydi, boshqaruv esa butunlay bizniki (o'ynatish,
vaqt chizig'i, ±10 soniya, ovoz, to'liq ekran). Har bir harakat — bosilgan
tugma, ya'ni uning turi ham, aniq soniyasi ham ma'lum.

Klaviatura ham o'tmaydi: iframe'ga `tabindex="-1"` qo'yiladi, aks holda Tab
bilan fokus ichkariga tushib, YouTube o'z tugmalarini ko'rsatib yuborardi.

Video haqiqatan ketayotgan lahzadan boshqa paytda pleer o'z pardamiz bilan
yopiladi. Boshqaruvni o'chirib bo'lsa ham, YouTube yuklanish paytida sarlavha
bilan brend qatorini, to'xtatilganda esa "More videos" tavsiyalarini
ko'rsatishda davom etadi — do'stingiz videoni yoqqanda sizda bir zum begona
ramka yonib o'chardi. Mayda buferda esa parda 0,4 soniya kutib yonadi: tarmoq
bir zum cho'kkanida ekran qorayib-yorishib turmasin.

Videoning "hozirgi joyi" bazada saqlanmaydi — u har soniyada o'zgaradi.
Saqlanadigani: `positionSec` (belgilangan lahzadagi joy) va `stateAt`
(o'sha lahza). Hozirgi joyni mijoz hisoblaydi. Telefon soati adashishi
mumkin, shuning uchun server har javobda `serverNow` ni ham yuboradi va
mijoz farqni to'g'rilab oladi.

### Harakat qilinganda yo'ldagi javoblar yopiladi

`sync` javobi yo'lda 1-2 soniya yuradi. Siz videoni surgan lahzada allaqachon
yo'lga chiqqan javob ichida **eskirgan** soniya bo'ladi, va u sizning
yozuvingizdan keyin yetib keladi. Ilgari u yangi holatni bosib ketar, kuzatuv
esa videoni eski joyga qaytarardi — surish "ishlamayotgandek" ko'rinardi.

Endi har bir harakat navbat raqamini oladi:

- bosilgan zahoti kutilayotgan holat ekranga qo'yiladi, shuning uchun chiziq
  markazning javobini kutib turmaydi;
- shu lahzadan boshlab `sync` javoblari uy holatiga tegmaydi (a'zolar va
  suhbat baribir yangilanaveradi);
- markazdan javob kelgach sinxronlash qayta ochiladi. Javob eskirgan bo'lsa —
  ya'ni undan keyin yana bosilgan bo'lsa — navbat raqami mos kelmaydi va u
  tashlab yuboriladi.

Javob umuman qaytmasa (tarmoq uzildi) besh soniyadan keyin sinxronlash o'zi
ochiladi. Bundan tashqari kechikkan javob hech qachon yangisining ustiga
yozilmaydi: `stateAt` orqaga ketadigan holat qabul qilinmaydi.

### Surish narxi o'lchanadi

`seekTo` ham, `loadVideoById` ham bir zumda bajarilmaydi: pleer yangi joyni
buferlaguncha vaqt ketadi va o'sha vaqtda uy soati siljib bo'ladi. Shuning
uchun surganda biroz oldinga suriladi.

Qancha oldinga — o'lchab bilinadi. Buyruq berilgan lahzadan pleer haqiqatan
o'ynay boshlagan lahzagacha ketgan vaqt yozib olinadi va keyingi surishda
o'sha qiymat ishlatiladi. Ilgari bu 0,5 soniya deb qotirib qo'yilgan edi:
sekin tarmoqda har tuzatishdan keyin video yana orqada qolar, keyingi
tuzatish yana kechikar — natijada uzluksiz sakrash sikli.

O'sha o'lchov "davom ettirish"da ham ishlatiladi. To'xtatilgan joydan
o'ynatilganda uy soati o'lchangan narx qadar orqadan qo'yiladi, ya'ni pleer
haqiqatan ketgan lahzada soat aynan kerakli soniyada bo'ladi — buferlash
vaqtida kinoning bir necha soniyasi tushib qolmaydi.

Og'ish 0,75 soniyadan oshsagina video jimgina tenglashtiriladi, ketma-ket
tuzatishlar orasida esa to'rt soniya kutiladi: surish har safar ko'zga
tashlanadigan uzilish, shuning uchun ular kam va aniq bo'lishi kerak.

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
oching — server so'rovni o'sha id'li soxta foydalanuvchi deb qabul qiladi.
Ular **Dev-1**, **Dev-2** deb ko'rinadi, ya'ni a'zolar ro'yxatida ham,
suhbatda ham kim kimligi ajralib turadi:

```
http://localhost:5173/rooms?devUser=1     # Dev-1 — uy egasi
http://localhost:5173/rooms?devUser=2     # Dev-2 — mehmon (boshqa oynada)
```

Bu foydalanuvchilarni alohida yaratish shart emas: birinchi so'rovda bazaga
o'zi yoziladi.

**Sinov haqiqiy ma'lumotlarga tegmasligi kerak.** `.env` dagi baza
(`learn_russian`) — o'quvchilarning ballari, progressi va uylari. Lokal
serverni boshqa bazaga yo'naltirib qo'ying; `.env.local` git'ga tushmaydi va
`.env` dagi qiymatni bosadi:

```
# .env.local
MONGODB_DB=learn_russian_dev
ALLOW_DEV_USER=1
```

Shundan keyin sinovda yaratilgan uy ham, Dev-1/Dev-2 ham faqat o'sha alohida
bazada qoladi. Bazasiz sinov ham bor: `npm run test:rooms` butun uy oqimini
(shu jumladan ovozli suhbat signallarini) xotirada tekshiradi.

Qiymat `sessionStorage` da saqlanadi, ya'ni ilova ichida yurganda ham
o'zgarmaydi, lekin **har oyna o'zinikini saqlaydi** — shuning uchun ikkinchi
foydalanuvchini alohida oynada (yoki incognito'da) oching.

Videoni brauzer faqat **faol** oynada o'ynatadi, shuning uchun sinxronni
ko'rish uchun ikkita alohida oyna kerak (bir oynadagi ikki tab emas).

Ovozli suhbatni sinaganda ham shu qoida: fon oynada brauzer mikrofonni ham,
ovoz o'lchovini ham to'xtatib qo'yadi. Bitta kompyuterda ikkala mikrofon
yoqilgan bo'lsa naushnik kiying — aks holda karnaydan chiqqan ovoz qaytadan
mikrofonga tushib, quloqni qomatga keltiradigan halqa hosil bo'ladi.
Eng ishonchli sinov — ikkita alohida qurilma.

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
    rooms.ts          Kino uyi: a'zolar, holat, chat, ovoz signallari
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
    room/             Sinxron pleer, chat, a'zolar, ovozli suhbat
  lib/                telegram.ts, api.ts, audio.ts, format.ts
                      rooms.ts (polling), voice.ts (WebRTC ovoz)
                      youtube.ts (IFrame API)
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
