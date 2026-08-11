import type { Lesson } from "../../shared/types.js"

/**
 * Darslar ma'lumoti.
 *
 * BU FAYL AVTOMATIK YARATILADI — `npm run import` uni qayta yozadi.
 * Qo'lda tahrirlash mumkin (masalan urg'uni tuzatish uchun), lekin
 * keyingi importda o'zgarishlar yo'qoladi.
 */
export const LESSON_DATA: Lesson[] = [
  {
    "id": "lesson-01",
    "title": "Жизнь А́нны",
    "titleUz": "Annaning hayoti",
    "level": "A2",
    "topic": "Kundalik hayot",
    "assignedAt": "2026-08-03",
    "dueAt": "2026-08-10",
    "reading": {
      "introUz": "Matnni ovoz chiqarib o'qing va Annaning kun tartibini tasavvur qiling.",
      "paragraphs": [
        "У А́нны о́чень тяжёлая жизнь, хотя́ ей то́лько 18 лет. Вот, наприме́р, сего́дня она́ сде́лала о́чень мно́го дел.",
        "Гла́вное для А́нны — хоро́шая фо́рма и краси́вая фигу́ра (90-60-90). А её идеа́л — Пэ́рис Хи́лтон. А́нна хо́чет жить, как э́та изве́стная америка́нка. У́тром она́ снача́ла бе́гала в па́рке, пото́м пла́вала в бассе́йне, пото́м пошла́ в фи́тнес-клуб на массаж, пото́м в соля́рий. По́сле э́того А́нна пошла́ в сало́н красоты́. Че́рез четы́ре часа́ она́ вы́шла из сало́на красоты́ и пошла́ в ресторан́ о́бедать. Че́рез час она́ вы́шла из ресто́рана и пое́хала в магази́н «Эксклюзи́вная оде́жда».",
        "Она́ вошла́ в магази́н в два часа́. А́нна до́лго ходи́ла по магази́ну и выбира́ла но́вую оде́жду. Че́рез пять часо́в она́ вы́шла из магази́на и пое́хала на такси́ домо́й. До́ма А́нна оди́н час ду́мала, что наде́ть. Потому́ что она́ должна́ снача́ла пойти́ на дискоте́ку, а пото́м пое́хать в ночно́й клуб.",
        "За́втра у́тром А́нна лети́т в Ита́лию, в Мила́н. Ей на́до купи́ть но́вое ве́чернее пла́тье, потому́ что че́рез два дня она́ пойдёт на ва́жную встре́чу с подру́гами в кафе́."
      ],
      "sentences": [
        {
          "id": "s1",
          "ru": "У А́нны о́чень тяжёлая жизнь, хотя́ ей то́лько 18 лет.",
          "uz": "Annada hayot juda og'ir, garchi u atigi 18 yoshda bo'lsa ham."
        },
        {
          "id": "s2",
          "ru": "Вот, наприме́р, сего́дня она́ сде́лала о́чень мно́го дел.",
          "uz": "Masalan, bugun u juda ko'p ishlarni bajardi."
        },
        {
          "id": "s3",
          "ru": "Гла́вное для А́нны — хоро́шая фо́рма и краси́вая фигу́ра (90-60-90).",
          "uz": "Anna uchun eng muhimi — sog'lom bo'lish va chiroyli qomatga ega bo'lish (90-60-90)."
        },
        {
          "id": "s4",
          "ru": "А её идеа́л — Пэ́рис Хи́лтон.",
          "uz": "Uning orzusi — Peris Xiltondek bo'lish."
        },
        {
          "id": "s5",
          "ru": "А́нна хо́чет жить, как э́та изве́стная америка́нка.",
          "uz": "Anna shu mashhur amerikalik kabi yashashni xohlaydi."
        },
        {
          "id": "s6",
          "ru": "У́тром она́ снача́ла бе́гала в па́рке, пото́м пла́вала в бассе́йне, пото́м пошла́ в фи́тнес-клуб на массаж, пото́м в соля́рий.",
          "uz": "Ertalab u avval parkda yugurdi, keyin basseynda suzdi, so'ng fitnes klubga borib massaj oldi, undan keyin solyariyga kirdi."
        },
        {
          "id": "s7",
          "ru": "По́сле э́того А́нна пошла́ в сало́н красоты́.",
          "uz": "Shundan so'ng Anna go'zallik saloniga bordi."
        },
        {
          "id": "s8",
          "ru": "Че́рез четы́ре часа́ она́ вы́шла из сало́на красоты́ и пошла́ в ресторан́ о́бедать.",
          "uz": "To'rt soatdan keyin u go'zallik salonidan chiqib, tushlik qilish uchun restoranga yo'l oldi."
        },
        {
          "id": "s9",
          "ru": "Че́рез час она́ вы́шла из ресто́рана и пое́хала в магази́н «Эксклюзи́вная оде́жда».",
          "uz": "Bir soatdan keyin u restorandan chiqib, 'Eksklyuziv kiyimlar' do'koniga bordi."
        },
        {
          "id": "s10",
          "ru": "Она́ вошла́ в магази́н в два часа́.",
          "uz": "U do'konga soat ikkida kirdi."
        },
        {
          "id": "s11",
          "ru": "А́нна до́лго ходи́ла по магази́ну и выбира́ла но́вую оде́жду.",
          "uz": "Anna do'konda uzoq yurib, yangi kiyim tanladi."
        },
        {
          "id": "s12",
          "ru": "Че́рез пять часо́в она́ вы́шла из магази́на и пое́хала на такси́ домо́й.",
          "uz": "Besh soatdan keyin u do'kondan chiqib, taksida uyiga ketdi."
        },
        {
          "id": "s13",
          "ru": "До́ма А́нна оди́н час ду́мала, что наде́ть.",
          "uz": "Uyda Anna bir soat nima kiyishni o'yladi."
        },
        {
          "id": "s14",
          "ru": "Потому́ что она́ должна́ снача́ла пойти́ на дискоте́ку, а пото́м пое́хать в ночно́й клуб.",
          "uz": "Chunki u avval diskotekaga borishi, keyin esa tungi klubga ketishi kerak."
        },
        {
          "id": "s15",
          "ru": "За́втра у́тром А́нна лети́т в Ита́лию, в Мила́н.",
          "uz": "Ertaga ertalab Anna Italiyaga, Milan shahriga uchadi."
        },
        {
          "id": "s16",
          "ru": "Ей на́до купи́ть но́вое ве́чернее пла́тье, потому́ что че́рез два дня она́ пойдёт на ва́жную встре́чу с подру́гами в кафе́.",
          "uz": "Unga yangi kechki ko'ylak sotib olish kerak, chunki ikki kundan keyin u do'stlari bilan kafeda muhim uchrashuvga boradi."
        }
      ]
    },
    "vocabulary": [
      {
        "id": "w1",
        "ru": "гуля́ть",
        "uz": "sayr qilmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я люблю́ гуля́ть в па́рке.",
          "uz": "Men parkda sayr qilishni yaxshi ko'raman."
        }
      },
      {
        "id": "w2",
        "ru": "вы́ставка",
        "uz": "ko'rgazma",
        "pos": "ot",
        "example": {
          "ru": "Мы посети́ли вы́ставку вчера́.",
          "uz": "Biz kecha ko'rgazmaga bordik."
        }
      },
      {
        "id": "w3",
        "ru": "го́род",
        "uz": "shahar",
        "pos": "ot",
        "example": {
          "ru": "Э́тот го́род о́чень краси́вый.",
          "uz": "Bu shahar juda chiroyli."
        }
      },
      {
        "id": "w4",
        "ru": "иностра́нец",
        "uz": "chet ellik",
        "pos": "ot",
        "example": {
          "ru": "Он иностра́нец из Фра́нции.",
          "uz": "U Fransiyadan chet ellik."
        }
      },
      {
        "id": "w5",
        "ru": "слы́шать",
        "uz": "eshitmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я слы́шу му́зыку сейча́с.",
          "uz": "Men hozir musiqa eshitayapman."
        }
      },
      {
        "id": "w6",
        "ru": "го́рло",
        "uz": "tomoq",
        "pos": "ot",
        "example": {
          "ru": "У меня́ боли́т го́рло.",
          "uz": "Mening tomoğim og'riyapti."
        }
      },
      {
        "id": "w7",
        "ru": "верну́ться",
        "uz": "qaytmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он верну́лся домо́й по́здно.",
          "uz": "U uyga kech qaytdi."
        }
      },
      {
        "id": "w8",
        "ru": "уйти́",
        "uz": "ketmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я хочу́ уйти́ сейча́с.",
          "uz": "Men hozir ketmoqchiman."
        }
      },
      {
        "id": "w9",
        "ru": "войти́",
        "uz": "kirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Пожа́луйста, войди́те в ко́мнату.",
          "uz": "Iltimos, xonaga kiring."
        }
      },
      {
        "id": "w10",
        "ru": "вы́йти",
        "uz": "chiqmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он вы́шел из до́ма у́тром.",
          "uz": "U ertalab uydan chiqdi."
        }
      },
      {
        "id": "w11",
        "ru": "сове́товать",
        "uz": "maslahat bermoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я сове́тую тебе́ э́то сде́лать.",
          "uz": "Men senga buni qilishni maslahat beraman."
        }
      },
      {
        "id": "w12",
        "ru": "неда́вно",
        "uz": "yaqinda",
        "pos": "ravish",
        "example": {
          "ru": "Я неда́вно ви́дел э́тот фильм.",
          "uz": "Men bu filmni yaqinda ko'rdim."
        }
      },
      {
        "id": "w13",
        "ru": "ма́стер",
        "uz": "usta",
        "pos": "ot",
        "example": {
          "ru": "Он хоро́ший ма́стер по де́реву.",
          "uz": "U yog'ochga yaxshi usta."
        }
      },
      {
        "id": "w14",
        "ru": "зе́ркало",
        "uz": "oynak",
        "pos": "ot",
        "example": {
          "ru": "Она́ смо́трит в зе́ркало.",
          "uz": "U oynakka qarayapti."
        }
      },
      {
        "id": "w15",
        "ru": "изме́рить",
        "uz": "o'lchamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Пожа́луйста, изме́рь длину́ стола́.",
          "uz": "Iltimos, stol uzunligini o'lcha."
        }
      },
      {
        "id": "w16",
        "ru": "стена́",
        "uz": "devor",
        "pos": "ot",
        "example": {
          "ru": "Карти́нка виси́т на стене́.",
          "uz": "Rasm devorda osilgan."
        }
      },
      {
        "id": "w17",
        "ru": "постуча́ть",
        "uz": "taqillatmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Постучи́ в дверь, пожа́луйста.",
          "uz": "Iltimos, eshikni taqillat."
        }
      },
      {
        "id": "w18",
        "ru": "засну́ть",
        "uz": "mudramoq",
        "pos": "fe'l",
        "example": {
          "ru": "Ребёнок бы́стро засну́л.",
          "uz": "Bola tezda mudradi."
        }
      },
      {
        "id": "w19",
        "ru": "звуча́ть",
        "uz": "jaranglamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Му́зыка звучи́т краси́во.",
          "uz": "Musiqa chiroyli jaranglaydi."
        }
      },
      {
        "id": "w20",
        "ru": "дое́хать",
        "uz": "yetib bormoq (mashinada)",
        "pos": "fe'l",
        "example": {
          "ru": "Мы дое́хали до шко́лы на авто́бусе.",
          "uz": "Biz maktabga avtobusda yetib bordik."
        }
      }
    ]
  },
  {
    "id": "lesson-02",
    "title": "ТРИ РО́ЗЫ",
    "titleUz": "Uchta atirgul",
    "level": "A2",
    "topic": "Ertak",
    "assignedAt": "2026-08-10",
    "dueAt": "2026-08-17",
    "reading": {
      "introUz": "Matnni ovoz chiqarib o‘qing va asosiy voqeani tushunishga harakat qiling.",
      "paragraphs": [
        "Давно́-давно́ в Казахста́не жил оди́н молодо́й поэ́т. Его́ зва́ли Абай. Абай писа́л и пел о́чень краси́вые пе́сни.",
        "В саду́ поэ́та бы́ло мно́го роз. Три кра́сные ро́зы о́коло его́ дома́ бы́ли осо́бенно краси́вые. Э́то бы́ли са́мые люби́мые цветы́ поэ́та. Одна́жды но́чью Абай пел в саду́ свои́ люби́мые пе́сни. Вдруг он услы́шал незнако́мый краси́вый го́лос. Э́тот го́лос пел пе́сни Аба́я. Поэ́т осмотре́л весь сад, но в саду́ никого́ не бы́ло.",
        "Когда́ пришла́ сле́дующая ночь, случи́лось то же са́мое: опя́ть кто-то пел в саду́ пе́сни. Абай осмотре́л сад, но никого́ не нашёл там.",
        "Когда́ пришла́ тре́тья ночь, Абай сно́ва на́чал петь и сно́ва услы́шал незнако́мый го́лос. Он бы́стро посмотре́л наза́д и уви́дел де́вушку. Э́та де́вушка была́ о́чень краси́вая.",
        "— Кто ты? — спроси́л Абай. — Отку́да ты зна́ешь мои́ пе́сни?",
        "— Я — одна́ из трёх роз, кото́рые расту́т о́коло твоего́ дома́, — отве́тила де́вушка. — У́тром, когда́ вы́йдет со́лнце, я сно́ва ста́ну ро́зой. Я уже́ ви́жу росу́ на траве́ и ли́стьях. Роса́ говори́т мне о том, что ско́ро вы́йдет со́лнце. Мне на́до спеши́ть. Проща́й!",
        "— Подожди́! Не уходи́! — закрича́л поэ́т. — Я всегда́ хочу́ слы́шать твой го́лос.",
        "— Сейча́с я должна́ уйти́, — отве́тила де́вушка. — Но е́сли у́тром, когда́ вы́йдет со́лнце, ты уви́дишь три ро́зы, и ты узна́ешь меня́ среди́ них, я сно́ва превращу́сь в де́вушку. А е́сли ты не узна́ешь меня́, я умру́.",
        "И де́вушка ушла́. Ра́но у́тром, когда́ вы́шло со́лнце, Абай вы́шел в сад и уви́дел три ро́зы. Все три ро́зы бы́ли одина́ковые. Поэ́т до́лго смотре́л на ро́зы и вдруг показа́л на одну́ из роз.",
        "— Э́то ты! — закрича́л он.",
        "И ро́за преврати́лась в прекра́сную де́вушку.",
        "Скажи́те, как узна́л Абай свою́ ро́зу?"
      ],
      "sentences": [
        {
          "id": "s1",
          "ru": "Давно́-давно́ в Казахста́не жил оди́н молодо́й поэ́т.",
          "uz": "Qadim zamonlarda Qozog‘istonda bir yosh shoir yashagan."
        },
        {
          "id": "s2",
          "ru": "Его́ зва́ли Абай.",
          "uz": "Uning ismi Abay edi."
        },
        {
          "id": "s3",
          "ru": "Абай писа́л и пел о́чень краси́вые пе́сни.",
          "uz": "Abay juda chiroyli qo‘shiqlar yozar va kuylardi."
        },
        {
          "id": "s4",
          "ru": "В саду́ поэ́та бы́ло мно́го роз.",
          "uz": "Shoirning bog‘ida ko‘plab atirgullar bor edi."
        },
        {
          "id": "s5",
          "ru": "Три кра́сные ро́зы о́коло его́ дома́ бы́ли осо́бенно краси́вые.",
          "uz": "Uning uyi oldida uchta qizil atirgul o‘sardi va ular juda chiroyli edi."
        },
        {
          "id": "s6",
          "ru": "Э́то бы́ли са́мые люби́мые цветы́ поэ́та.",
          "uz": "Bu gullar shoirning eng sevimli gullari edi."
        },
        {
          "id": "s7",
          "ru": "Одна́жды но́чью Абай пел в саду́ свои́ люби́мые пе́сни.",
          "uz": "Bir kuni kechasi Abay bog‘ida o‘zining sevimli qo‘shiqlarini kuylardi."
        },
        {
          "id": "s8",
          "ru": "Вдруг он услы́шал незнако́мый краси́вый го́лос.",
          "uz": "To‘satdan u notanish, chiroyli bir ovozni eshitdi."
        },
        {
          "id": "s9",
          "ru": "Э́тот го́лос пел пе́сни Аба́я.",
          "uz": "Bu ovoz Abayning qo'shiqlarini kuylardi."
        },
        {
          "id": "s10",
          "ru": "Поэ́т осмотре́л весь сад, но в саду́ никого́ не бы́ло.",
          "uz": "Shoir butun bog'ni ko'zdan kechirdi, lekin bog'da hech kim yo'q edi."
        },
        {
          "id": "s11",
          "ru": "Когда́ пришла́ сле́дующая ночь, случи́лось то же са́мое: опя́ть кто-то пел в саду́ пе́сни.",
          "uz": "Keyingi tun kelganda ham xuddi shu hol bo'ldi: yana kimdir bog'da qo'shiq aytdi."
        },
        {
          "id": "s12",
          "ru": "Абай осмотре́л сад, но никого́ не нашёл там.",
          "uz": "Abay bog'ni ko'zdan kechirdi, lekin u yerdan hech kimni topolmadi."
        },
        {
          "id": "s13",
          "ru": "Когда́ пришла́ тре́тья ночь, Абай сно́ва на́чал петь и сно́ва услы́шал незнако́мый го́лос.",
          "uz": "Uchinchi tun kelganda, Abay yana kuylay boshladi va yana notanish ovozni eshitdi."
        },
        {
          "id": "s14",
          "ru": "Он бы́стро посмотре́л наза́д и уви́дел де́вушку.",
          "uz": "U tezda orqasiga qaradi va bir qizni ko'rdi."
        },
        {
          "id": "s15",
          "ru": "Э́та де́вушка была́ о́чень краси́вая.",
          "uz": "Bu qiz juda chiroyli edi."
        },
        {
          "id": "s16",
          "ru": "— Кто ты? — спроси́л Абай.",
          "uz": "— Sen kimsan? — deb so'radi Abay."
        },
        {
          "id": "s17",
          "ru": "— Отку́да ты зна́ешь мои́ пе́сни?",
          "uz": "1. — Qanday qilib mening qo‘shiqlarimni bilasan?"
        },
        {
          "id": "s18",
          "ru": "— Я — одна́ из трёх роз, кото́рые расту́т о́коло твоего́ дома́, — отве́тила де́вушка.",
          "uz": "2. — Men uying yonida o‘sadigan uchta atirguldan biriman, — dedi qiz."
        },
        {
          "id": "s19",
          "ru": "— У́тром, когда́ вы́йдет со́лнце, я сно́ва ста́ну ро́зой.",
          "uz": "3. — Ertalab quyosh chiqqanda, yana atirgulga aylanaman."
        },
        {
          "id": "s20",
          "ru": "Я уже́ ви́жу росу́ на траве́ и ли́стьях.",
          "uz": "4. Men allaqachon maysada va barglarda shabnamni ko‘ryapman."
        },
        {
          "id": "s21",
          "ru": "Роса́ говори́т мне о том, что ско́ро вы́йдет со́лнце.",
          "uz": "5. Shabnam menga tez orada quyosh chiqishini aytyapti."
        },
        {
          "id": "s22",
          "ru": "Мне на́до спеши́ть.",
          "uz": "6. Menga shoshilishim kerak."
        },
        {
          "id": "s23",
          "ru": "Проща́й!",
          "uz": "7. Xayr!"
        },
        {
          "id": "s24",
          "ru": "— Подожди́!",
          "uz": "8. — To‘xta!"
        },
        {
          "id": "s25",
          "ru": "Не уходи́! — закрича́л поэ́т.",
          "uz": "Ketma! — deb baqirdi shoir."
        },
        {
          "id": "s26",
          "ru": "— Я всегда́ хочу́ слы́шать твой го́лос.",
          "uz": "Men har doim sening ovozingni eshitishni xohlayman."
        },
        {
          "id": "s27",
          "ru": "— Сейча́с я должна́ уйти́, — отве́тила де́вушка.",
          "uz": "Hozir ketishim kerak, — dedi qiz."
        },
        {
          "id": "s28",
          "ru": "— Но е́сли у́тром, когда́ вы́йдет со́лнце, ты уви́дишь три ро́зы, и ты узна́ешь меня́ среди́ них, я сно́ва превращу́сь в де́вушку.",
          "uz": "Agar ertalab quyosh chiqqanda uchta atirgulni ko‘rsang va ular orasidan meni tanisang, yana qizga aylanaman."
        },
        {
          "id": "s29",
          "ru": "А е́сли ты не узна́ешь меня́, я умру́.",
          "uz": "Agar meni tanimasang, men o‘laman."
        },
        {
          "id": "s30",
          "ru": "И де́вушка ушла́.",
          "uz": "Qiz ketib qoldi."
        },
        {
          "id": "s31",
          "ru": "Ра́но у́тром, когда́ вы́шло со́лнце, Абай вы́шел в сад и уви́дел три ро́зы.",
          "uz": "Ertalab quyosh chiqqanda Abay bog‘ga chiqdi va uchta atirgulni ko‘rdi."
        },
        {
          "id": "s32",
          "ru": "Все три ро́зы бы́ли одина́ковые.",
          "uz": "Uchala atirgul ham bir xil edi."
        },
        {
          "id": "s33",
          "ru": "Поэ́т до́лго смотре́л на ро́зы и вдруг показа́л на одну́ из роз.",
          "uz": "Shoir uzoq vaqt atirgullarni tomosha qildi va to‘satdan bittasini ko‘rsatdi."
        },
        {
          "id": "s34",
          "ru": "— Э́то ты! — закрича́л он.",
          "uz": "— Bu sen ekansan! — deb baqirdi u."
        },
        {
          "id": "s35",
          "ru": "И ро́за преврати́лась в прекра́сную де́вушку.",
          "uz": "Shunda atirgul chiroyli qizga aylandi."
        },
        {
          "id": "s36",
          "ru": "Скажи́те, как узна́л Абай свою́ ро́зу?",
          "uz": "Aytib bering, Abay o‘z atirgulini qanday tanidi?"
        }
      ]
    },
    "vocabulary": [
      {
        "id": "w1",
        "ru": "о́зеро",
        "uz": "ko'l",
        "pos": "ot",
        "example": {
          "ru": "Мы ви́дим большо́е о́зеро.",
          "uz": "Biz katta ko'lni ko'ramiz."
        }
      },
      {
        "id": "w2",
        "ru": "пригласи́ть",
        "uz": "taklif qilmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я хочу́ пригласи́ть дру́га.",
          "uz": "Men do'stimni taklif qilmoqchiman."
        }
      },
      {
        "id": "w3",
        "ru": "лови́ть",
        "uz": "tutmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он лю́бит лови́ть ры́бу.",
          "uz": "U baliq tutishni yaxshi ko'radi."
        }
      },
      {
        "id": "w4",
        "ru": "отдохну́ть",
        "uz": "dam olmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Мы реши́ли отдохну́ть дома́.",
          "uz": "Biz uyda dam olishga qaror qildik."
        }
      },
      {
        "id": "w5",
        "ru": "пое́хать",
        "uz": "bormoq",
        "pos": "fe'l",
        "example": {
          "ru": "Они́ хотя́т пое́хать в го́род.",
          "uz": "Ular shaharga bormoqchi."
        }
      },
      {
        "id": "w6",
        "ru": "положи́ть",
        "uz": "qo'ymoq",
        "pos": "fe'l",
        "example": {
          "ru": "Положи́ кни́гу на стол.",
          "uz": "Kitobni stol ustiga qo'y."
        }
      },
      {
        "id": "w7",
        "ru": "трава́",
        "uz": "maysa",
        "pos": "ot",
        "example": {
          "ru": "На по́ле зелёная трава́.",
          "uz": "Maydonda yashil maysa bor."
        }
      },
      {
        "id": "w8",
        "ru": "вдруг",
        "uz": "to'satdan",
        "pos": "ravish",
        "example": {
          "ru": "Вдруг начался́ дождь.",
          "uz": "To'satdan yomg'ir boshlandi."
        }
      },
      {
        "id": "w9",
        "ru": "схвати́ть",
        "uz": "ushlamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он бы́стро схвати́л мяч.",
          "uz": "U to'pni tez ushladi."
        }
      },
      {
        "id": "w10",
        "ru": "побежа́ть",
        "uz": "yugurib ketmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Ма́льчик побежа́л домо́й.",
          "uz": "Bola uyga yugurib ketdi."
        }
      },
      {
        "id": "w11",
        "ru": "закрича́ть",
        "uz": "qichqirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он закрича́л от стра́ха.",
          "uz": "U qo'rqib qichqirdi."
        }
      },
      {
        "id": "w12",
        "ru": "звать",
        "uz": "chaqirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Ма́ма зовёт меня́ домо́й.",
          "uz": "Onam meni uyga chaqiryapti."
        }
      },
      {
        "id": "w13",
        "ru": "наступи́ть",
        "uz": "boshlanmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Зима́ наступи́ла бы́стро.",
          "uz": "Qish tez boshlandi."
        }
      },
      {
        "id": "w14",
        "ru": "темно́",
        "uz": "qorong'u",
        "pos": "sifat",
        "example": {
          "ru": "В ко́мнате темно́ сейча́с.",
          "uz": "Hozir xonada qorong'u."
        }
      },
      {
        "id": "w15",
        "ru": "есть",
        "uz": "1) bor 2) yemoq",
        "pos": "fe'l",
        "example": {
          "ru": "У меня́ есть кни́га.",
          "uz": "Menda kitob bor."
        }
      },
      {
        "id": "w16",
        "ru": "член",
        "uz": "a'zo",
        "pos": "ot",
        "example": {
          "ru": "Он член кома́нды.",
          "uz": "U jamoa a'zosi."
        }
      },
      {
        "id": "w17",
        "ru": "серди́то",
        "uz": "g'azablanib",
        "pos": "ravish",
        "example": {
          "ru": "Он серди́то отве́тил мне.",
          "uz": "U menga g'azablanib javob berdi."
        }
      },
      {
        "id": "w18",
        "ru": "вы́бежать",
        "uz": "yugurib chiqmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Ма́льчик вы́бежал на у́лицу.",
          "uz": "Bola ko'chaga yugurib chiqdi."
        }
      },
      {
        "id": "w19",
        "ru": "согласи́ться",
        "uz": "rozi bo'lmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я согласи́лся помо́чь.",
          "uz": "Men yordam berishga rozi bo'ldim."
        }
      },
      {
        "id": "w20",
        "ru": "бить",
        "uz": "urmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он бьёт мяч ного́й.",
          "uz": "U to'pni oyog'i bilan urmoqda."
        }
      }
    ]
  },
  {
    "id": "lesson-03",
    "title": "ДЕ́ТСКИЙ ВРАЧ",
    "titleUz": "Bolalar shifokori",
    "level": "A2",
    "topic": "Kasb, Hayotiy voqea",
    "assignedAt": "2026-08-11",
    "dueAt": "2026-08-12T23:00:00+05:00",
    "reading": {
      "introUz": "Matnni ovoz chiqarib o'qing va asosiy voqeani tushunishga harakat qiling.",
      "paragraphs": [
        "Ю́рий Степа́нов был лётчиком. Ему́ нра́вилась э́та профе́ссия. Но одна́жды врачи́ сказа́ли ему́, что у него́ больно́е се́рдце и ему́ нельзя́ быть лётчиком. Он до́лжен был вы́брать другу́ю специа́льность.",
        "Ю́рий реши́л стать врачо́м. Он поступи́л в медици́нский институ́т. Учи́ться бы́ло тру́дно, но инте́ресно. Ему́ бы́ло уже́ 30 лет.",
        "Он успе́шно око́нчил институ́т и стал де́тским врачо́м. Степа́нову понра́вилась рабо́та врача́. Он полюби́л свою́ но́вую специа́льность, полюби́л дете́й. Два го́да Ю́рий рабо́тал в де́тской больни́це. Но одна́жды случи́лось несча́стье. В больни́це умерла́ ма́ленькая де́вочка. Степа́нов не мог помо́чь ей, потому́ что де́вочка была́ тяжело́ больна́. Но мать де́вочки сказа́ла Степа́нову, что он не име́ет пра́ва быть де́тским врачо́м, потому́ что он не понима́ет, что зна́чит потеря́ть ребёнка. Же́нщина была́ не права́, но Ю́рий не мог забы́ть её слова́. И тогда́ он реши́л, что сде́лал оши́бку, когда́ вы́брал профе́ссию врача́.",
        "Ю́рий Степа́нов ушёл из больни́цы, уе́хал в друго́й го́род и на́чал рабо́тать на заво́де. На его́ но́вой рабо́те никто́ не знал, что ра́ньше он рабо́тал врачо́м.",
        "Одна́жды Степа́нов пришёл в го́сти к своему́ това́рищу. У того́ был ма́ленький сын. Това́рищ Степа́нова сказа́л ему́, что ма́льчик пло́хо себя́ чу́вствует. Когда́ Ю́рий уви́дел ма́льчика, он по́нял, что ребёнок серьёзно бо́лен. Ю́рий внима́тельно осмотре́л ма́льчика и сказа́л, каки́е лека́рства он до́лжен принима́ть. Оте́ц ма́льчика о́чень удиви́лся, и тогда́ Степа́нов рассказа́л ему́ исто́рию свое́й жи́зни. Това́рищ сказа́л: «Ты не прав. Ты до́лжен верну́ться и рабо́тать врачо́м. Де́ти ждут тебя́».",
        "Степа́нов верну́лся в больни́цу. Он сно́ва стал рабо́тать врачо́м. Де́ти о́чень лю́бят своего́ врача́. Но они́ не зна́ют, кака́я тру́дная и инте́ресная жизнь была́ у э́того челове́ка."
      ],
      "sentences": [
        {
          "id": "s1",
          "ru": "Ю́рий Степа́нов был лётчиком.",
          "uz": "Yuriy Stepanov uchuvchi edi."
        },
        {
          "id": "s2",
          "ru": "Ему́ нра́вилась э́та профе́ссия.",
          "uz": "Unga bu kasb yoqardi."
        },
        {
          "id": "s3",
          "ru": "Но одна́жды врачи́ сказа́ли ему́, что у него́ больно́е се́рдце и ему́ нельзя́ быть лётчиком.",
          "uz": "Lekin bir kuni shifokorlar unga yuragingda muammo bor, uchuvchi bo'lish mumkin emas, deb aytishdi."
        },
        {
          "id": "s4",
          "ru": "Он до́лжен был вы́брать другу́ю специа́льность.",
          "uz": "U boshqa kasb tanlashi kerak edi."
        },
        {
          "id": "s5",
          "ru": "Ю́рий реши́л стать врачо́м.",
          "uz": "Yuriy shifokor bo'lishga qaror qildi."
        },
        {
          "id": "s6",
          "ru": "Он поступи́л в медици́нский институ́т.",
          "uz": "U tibbiyot institutiga o'qishga kirdi."
        },
        {
          "id": "s7",
          "ru": "Учи́ться бы́ло тру́дно, но инте́ресно.",
          "uz": "O'qish qiyin edi, lekin qiziqarli edi."
        },
        {
          "id": "s8",
          "ru": "Ему́ бы́ло уже́ 30 лет.",
          "uz": "U allaqachon 30 yoshda edi."
        },
        {
          "id": "s9",
          "ru": "Он успе́шно око́нчил институ́т и стал де́тским врачо́м.",
          "uz": "U institutni muvaffaqiyatli tugatdi va bolalar shifokori bo'ldi."
        },
        {
          "id": "s10",
          "ru": "Степа́нову понра́вилась рабо́та врача́.",
          "uz": "Stepanovga shifokorlik ishi yoqdi."
        },
        {
          "id": "s11",
          "ru": "Он полюби́л свою́ но́вую специа́льность, полюби́л дете́й.",
          "uz": "U yangi kasbini va bolalarni yaxshi ko'rib qoldi."
        },
        {
          "id": "s12",
          "ru": "Два го́да Ю́рий рабо́тал в де́тской больни́це.",
          "uz": "Yuriy ikki yil bolalar shifoxonasida ishladi."
        },
        {
          "id": "s13",
          "ru": "Но одна́жды случи́лось несча́стье.",
          "uz": "Lekin bir kuni baxtsiz hodisa yuz berdi."
        },
        {
          "id": "s14",
          "ru": "В больни́це умерла́ ма́ленькая де́вочка.",
          "uz": "Shifoxonada kichkina qizaloq vafot etdi."
        },
        {
          "id": "s15",
          "ru": "Степа́нов не мог помо́чь ей, потому́ что де́вочка была́ тяжело́ больна́.",
          "uz": "Stepanov unga yordam bera olmadi, chunki qizaloq juda og'ir kasal edi."
        },
        {
          "id": "s16",
          "ru": "Но мать де́вочки сказа́ла Степа́нову, что он не име́ет пра́ва быть де́тским врачо́м, потому́ что он не понима́ет, что зна́чит потеря́ть ребёнка.",
          "uz": "Lekin qizaloqning onasi Stepanovga, sen bolalar shifokori bo'lishga haqli emassan, chunki bolani yo'qotish qanday og'riq ekanini tushunmaysan, dedi."
        },
        {
          "id": "s17",
          "ru": "Же́нщина была́ не права́, но Ю́рий не мог забы́ть её слова́.",
          "uz": "Ayol haq emas edi, lekin Yuriy uning gaplarini unutolmasdi."
        },
        {
          "id": "s18",
          "ru": "И тогда́ он реши́л, что сде́лал оши́бку, когда́ вы́брал профе́ссию врача́.",
          "uz": "Shunda u vrach bo'lishni tanlaganida xato qilganini tushundi."
        },
        {
          "id": "s19",
          "ru": "Ю́рий Степа́нов ушёл из больни́цы, уе́хал в друго́й го́род и на́чал рабо́тать на заво́де.",
          "uz": "Yuriy Stepanov kasalxonadan ketdi, boshqa shaharga ko'chib, zavodda ishlay boshladi."
        },
        {
          "id": "s20",
          "ru": "На его́ но́вой рабо́те никто́ не знал, что ра́ньше он рабо́тал врачо́м.",
          "uz": "Yangi ishida hech kim uning ilgari vrach bo'lganini bilmasdi."
        },
        {
          "id": "s21",
          "ru": "Одна́жды Степа́нов пришёл в го́сти к своему́ това́рищу.",
          "uz": "Bir kuni Stepanov do'stinikiga mehmonga bordi."
        },
        {
          "id": "s22",
          "ru": "У того́ был ма́ленький сын.",
          "uz": "Do'stining kichkina o'g'li bor edi."
        },
        {
          "id": "s23",
          "ru": "Това́рищ Степа́нова сказа́л ему́, что ма́льчик пло́хо себя́ чу́вствует.",
          "uz": "Stepanovning do'sti unga bolasi o'zini yomon his qilayotganini aytdi."
        },
        {
          "id": "s24",
          "ru": "Когда́ Ю́рий уви́дел ма́льчика, он по́нял, что ребёнок серьёзно бо́лен.",
          "uz": "Yuriy bolani ko'rib, uning og'ir kasal ekanini tushundi."
        },
        {
          "id": "s25",
          "ru": "Ю́рий внима́тельно осмотре́л ма́льчика и сказа́л, каки́е лека́рства он до́лжен принима́ть.",
          "uz": "Yuriy bolani diqqat bilan ko‘zdan kechirdi va unga qanday dori ichish kerakligini aytdi."
        },
        {
          "id": "s26",
          "ru": "Оте́ц ма́льчика о́чень удиви́лся, и тогда́ Степа́нов рассказа́л ему́ исто́рию свое́й жи́зни.",
          "uz": "Bolani otasi juda hayron bo‘ldi, shunda Stepanov unga o‘z hayoti haqida gapirib berdi."
        },
        {
          "id": "s27",
          "ru": "Това́рищ сказа́л: «Ты не прав.",
          "uz": "Do‘sti unga: «Sen noto‘g‘ri qilayapsan», dedi."
        },
        {
          "id": "s28",
          "ru": "Ты до́лжен верну́ться и рабо́тать врачо́м.",
          "uz": "Sen qaytib kelib, vrach bo‘lib ishlashing kerak."
        },
        {
          "id": "s29",
          "ru": "Де́ти ждут тебя́».",
          "uz": "Bolalar seni kutishyapti."
        },
        {
          "id": "s30",
          "ru": "Степа́нов верну́лся в больни́цу.",
          "uz": "Stepanov kasalxonaga qaytdi."
        },
        {
          "id": "s31",
          "ru": "Он сно́ва стал рабо́тать врачо́м.",
          "uz": "U yana vrach bo‘lib ishlay boshladi."
        },
        {
          "id": "s32",
          "ru": "Де́ти о́чень лю́бят своего́ врача́.",
          "uz": "Bolalar o‘z vrachlarini juda yaxshi ko‘rishadi."
        },
        {
          "id": "s33",
          "ru": "Но они́ не зна́ют, кака́я тру́дная и инте́ресная жизнь была́ у э́того челове́ка.",
          "uz": "Lekin ular bu odamning hayoti qanchalik qiyin va qiziqarli bo‘lganini bilishmaydi."
        }
      ]
    },
    "vocabulary": [
      {
        "id": "w1",
        "ru": "лётчик",
        "uz": "uchuvchi",
        "pos": "ot",
        "example": {
          "ru": "Лётчик лети́т на самолёте.",
          "uz": "Uchuvchi samolyotda uchyapti."
        }
      },
      {
        "id": "w2",
        "ru": "се́рдце",
        "uz": "yurak",
        "pos": "ot",
        "example": {
          "ru": "У меня́ боли́т се́рдце.",
          "uz": "Mening yuragim og'riyapti."
        }
      },
      {
        "id": "w3",
        "ru": "вы́брать",
        "uz": "tanlamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я хочу́ вы́брать кни́гу.",
          "uz": "Men kitob tanlamoqchiman."
        }
      },
      {
        "id": "w4",
        "ru": "специа́льность",
        "uz": "mutaxassislik",
        "pos": "ot",
        "example": {
          "ru": "Моя́ специа́льность — учи́тель.",
          "uz": "Mening mutaxassisligim — o'qituvchi."
        }
      },
      {
        "id": "w5",
        "ru": "реши́ть",
        "uz": "qaror qilmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он реши́л пое́хать домо́й.",
          "uz": "U uyga borishga qaror qildi."
        }
      },
      {
        "id": "w6",
        "ru": "несча́стье",
        "uz": "baxtsizlik",
        "pos": "ot",
        "example": {
          "ru": "Э́то бы́ло большо́е несча́стье.",
          "uz": "Bu katta baxtsizlik edi."
        }
      },
      {
        "id": "w7",
        "ru": "умере́ть",
        "uz": "o'lmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Мой де́душка у́мер.",
          "uz": "Mening bobom vafot etdi."
        }
      },
      {
        "id": "w8",
        "ru": "тяжело́",
        "uz": "og'ir",
        "pos": "ravish",
        "example": {
          "ru": "Ему́ тяжело́ рабо́тать.",
          "uz": "Unga ishlash og'ir."
        }
      },
      {
        "id": "w9",
        "ru": "потеря́ть",
        "uz": "yo'qotmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я потеря́л ключи́.",
          "uz": "Men kalitlarni yo'qotdim."
        }
      },
      {
        "id": "w10",
        "ru": "уе́хать",
        "uz": "jo'nab ketmoq (mashinada)",
        "pos": "fe'l",
        "example": {
          "ru": "Он уе́хал в Москву́.",
          "uz": "U Moskvaga jo'nab ketdi."
        }
      },
      {
        "id": "w11",
        "ru": "гость",
        "uz": "mehmon",
        "pos": "ot",
        "example": {
          "ru": "Гость пришёл домо́й.",
          "uz": "Mehmon uyga keldi."
        }
      },
      {
        "id": "w12",
        "ru": "това́рищ",
        "uz": "birodar",
        "pos": "ot",
        "example": {
          "ru": "Мой това́рищ учи́тся здесь.",
          "uz": "Mening birodarim bu yerda o‘qiydi."
        }
      },
      {
        "id": "w13",
        "ru": "чу́вствовать",
        "uz": "his qilmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я чу́вствую хо́лод.",
          "uz": "Men sovuqni his qilaman."
        }
      },
      {
        "id": "w14",
        "ru": "внима́тельно",
        "uz": "e'tibor bilan",
        "pos": "ravish",
        "example": {
          "ru": "Он внима́тельно слу́шает.",
          "uz": "U e'tibor bilan tinglaydi."
        }
      },
      {
        "id": "w15",
        "ru": "лека́рства принима́ть",
        "uz": "dori qabul qilmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я принима́ю лека́рства у́тром.",
          "uz": "Men ertalab dori qabul qilaman."
        }
      },
      {
        "id": "w16",
        "ru": "удиви́ться",
        "uz": "ajablanmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я удиви́лся но́вости.",
          "uz": "Men yangilikka ajablandim."
        }
      },
      {
        "id": "w17",
        "ru": "сно́ва",
        "uz": "yangitdan",
        "pos": "ravish",
        "example": {
          "ru": "Он сно́ва пришёл сюда́.",
          "uz": "U yana bu yerga keldi."
        }
      },
      {
        "id": "w18",
        "ru": "осмотре́ть",
        "uz": "ko'rib chiqmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Врач осмотре́л пацие́нта.",
          "uz": "Shifokor bemorni ko‘rib chiqdi."
        }
      },
      {
        "id": "w19",
        "ru": "полюби́ть",
        "uz": "yaxshi ko'rib qolmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я полюби́л э́ту кни́гу.",
          "uz": "Men bu kitobni yaxshi ko‘rib qoldim."
        }
      },
      {
        "id": "w20",
        "ru": "до́лжен",
        "uz": "kerak, majbur",
        "pos": "sifat",
        "example": {
          "ru": "Я до́лжен учи́ться.",
          "uz": "Men o‘qishim kerak."
        }
      }
    ]
  }
]
