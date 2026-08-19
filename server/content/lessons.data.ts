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
  },
  {
    "id": "lesson-04",
    "title": "КАК ВИ́КТОР ВЫ́БРАЛ ПРОФЕ́ССИЮ",
    "titleUz": "Kasb tanlash",
    "level": "A2",
    "topic": "Kundalik hayot",
    "assignedAt": "2026-08-13",
    "dueAt": "2026-08-14T23:00:00+05:00",
    "reading": {
      "introUz": "Matnni ovoz chiqarib o'qing va Viktor qanday kasb tanlaganini aniqlang.",
      "paragraphs": [
        "Ви́ктор жил в Петербу́рге и учи́лся в деся́том кла́ссе. У него́ бы́ло мно́го друзе́й. Когда́ друзья́ собира́лись вме́сте, они́ говори́ли о том, что они́ бу́дут де́лать, когда́ оконча́т шко́лу. Оди́н хоте́л стать инжене́ром, друго́й — врачо́м, тре́тий — строи́телем, четвёртый — агроно́мом. Ка́ждый ду́мал, что он вы́брал са́мую хоро́шую профе́ссию.",
        "А Ви́ктор ничего́ не говори́л. Когда́ друзья́ спроси́ли его́, кем он хо́чет стать, он отве́тил: «Я хочу́ стать писа́телем!» Друзья́ засмея́лись: «Как ты мо́жешь стать писа́телем? Ты не зна́ешь жизнь!»",
        "Ви́ктор ничего́ не отве́тил.",
        "По́сле оконча́ния шко́лы Ви́ктор пришёл в Литерату́рный институ́т. Когда́ он хоте́л сдать свои́ докуме́нты, секрета́рь сказа́л ему́, что в э́тот институ́т мо́гут поступи́ть лю́ди, кото́рые уже́ написа́ли хоро́ший расска́з и́ли стихи́. Ви́ктор по́нял, что снача́ла он до́лжен написа́ть расска́з. Он до́лго не мог реши́ть, о чём писа́ть. Да, его́ друзья́ пра́вы, он пло́хо зна́ет жизнь.",
        "Ви́ктор реши́л нача́ть рабо́тать, а че́рез год поступа́ть в институ́т. Он на́чал иска́ть интере́сную рабо́ту. Наконе́ц он пое́хал на Се́вер с гео́логами, что́бы изучи́ть их жизнь. Ви́ктор знал, что у гео́логов тру́дная, но интере́сная рабо́та. Он познако́мился с ра́зными людьми́, кото́рые о́чень люби́ли свою́ специа́льность. Ви́ктор рабо́тал вме́сте с ни́ми.",
        "Одна́жды Ви́ктор сказа́л гео́логам, что он хо́чет написа́ть расска́з об их профе́ссии. И тепе́рь ка́ждый ве́чер по́сле рабо́ты гео́логи расска́зывали ему́ ра́зные исто́рии из свое́й жи́зни, что́бы помо́чь ему́ написа́ть интере́сный расска́з.",
        "Прошёл год. Когда́ Ви́ктор с гео́логами верну́лись в Петербу́рг, на вокза́ле они́ сказа́ли ему́: «Мы жела́ем тебе́ стать хоро́шим писа́телем!» Ви́ктор засмея́лся и отве́тил: «А я реши́л стать гео́логом!»"
      ],
      "sentences": [
        {
          "id": "s1",
          "ru": "Ви́ктор жил в Петербу́рге и учи́лся в деся́том кла́ссе.",
          "uz": "Viktor Peterburgda yashardi va o'ninchi sinfda o'qirdi."
        },
        {
          "id": "s2",
          "ru": "У него́ бы́ло мно́го друзе́й.",
          "uz": "Uning ko'p do'stlari bor edi."
        },
        {
          "id": "s3",
          "ru": "Когда́ друзья́ собира́лись вме́сте, они́ говори́ли о том, что они́ бу́дут де́лать, когда́ оконча́т шко́лу.",
          "uz": "Do'stlari birga yig'ilganda, maktabni tugatgach nima qilishlarini gaplashishardi."
        },
        {
          "id": "s4",
          "ru": "Оди́н хоте́л стать инжене́ром, друго́й — врачо́м, тре́тий — строи́телем, четвёртый — агроно́мом.",
          "uz": "Biri muhandis bo'lishni, boshqasi shifokor, uchinchisi quruvchi, to'rtinchisi esa agronom bo'lishni xohlardi."
        },
        {
          "id": "s5",
          "ru": "Ка́ждый ду́мал, что он вы́брал са́мую хоро́шую профе́ссию.",
          "uz": "Har biri o'zi tanlagan kasb eng yaxshi deb o'ylardi."
        },
        {
          "id": "s6",
          "ru": "А Ви́ктор ничего́ не говори́л.",
          "uz": "Lekin Viktor hech narsa demasdi."
        },
        {
          "id": "s7",
          "ru": "Когда́ друзья́ спроси́ли его́, кем он хо́чет стать, он отве́тил: «Я хочу́ стать писа́телем!»",
          "uz": "Do'stlari undan kim bo'lishni xohlashini so'rashganda, u: «Men yozuvchi bo'lishni xohlayman!» deb javob berdi."
        },
        {
          "id": "s8",
          "ru": "Друзья́ засмея́лись: «Как ты мо́жешь стать писа́телем?",
          "uz": "Do'stlari kulib yuborishdi: «Sen qanday qilib yozuvchi bo'la olasan?»"
        },
        {
          "id": "s9",
          "ru": "Ты не зна́ешь жизнь!»",
          "uz": "Sen hayotni bilmaysan!"
        },
        {
          "id": "s10",
          "ru": "Ви́ктор ничего́ не отве́тил.",
          "uz": "Viktor hech narsa demadi."
        },
        {
          "id": "s11",
          "ru": "По́сле оконча́ния шко́лы Ви́ктор пришёл в Литерату́рный институ́т.",
          "uz": "Maktabni tugatgandan keyin Viktor Adabiyot institutiga keldi."
        },
        {
          "id": "s12",
          "ru": "Когда́ он хоте́л сдать свои́ докуме́нты, секрета́рь сказа́л ему́, что в э́тот институ́т мо́гут поступи́ть лю́ди, кото́рые уже́ написа́ли хоро́ший расска́з и́ли стихи́.",
          "uz": "U hujjatlarini topshirmoqchi bo'lganida, kotiba unga bu institutga faqat yaxshi hikoya yoki she’r yozgan odamlar kirishi mumkinligini aytdi."
        },
        {
          "id": "s13",
          "ru": "Ви́ктор по́нял, что снача́ла он до́лжен написа́ть расска́з.",
          "uz": "Viktor avval hikoya yozishi kerakligini tushundi."
        },
        {
          "id": "s14",
          "ru": "Он до́лго не мог реши́ть, о чём писа́ть.",
          "uz": "U uzoq vaqt nima haqida yozishni bilmay qiynaldi."
        },
        {
          "id": "s15",
          "ru": "Да, его́ друзья́ пра́вы, он пло́хо зна́ет жизнь.",
          "uz": "Ha, do‘stlari to‘g‘ri aytishgan, u hayotni yaxshi bilmaydi."
        },
        {
          "id": "s16",
          "ru": "Ви́ктор реши́л нача́ть рабо́тать, а че́рез год поступа́ть в институ́т.",
          "uz": "Viktor ishlashni boshlashga va bir yildan keyin institutga kirishga qaror qildi."
        },
        {
          "id": "s17",
          "ru": "Он на́чал иска́ть интере́сную рабо́ту.",
          "uz": "U uzi uchun qiziqarli ish izlashni boshladi."
        },
        {
          "id": "s18",
          "ru": "Наконе́ц он пое́хал на Се́вер с гео́логами, что́бы изучи́ть их жизнь.",
          "uz": "Nihoyat, u geologlar bilan Shimolga bordi va ularning hayotini o‘rganishga kirishdi."
        },
        {
          "id": "s19",
          "ru": "Ви́ктор знал, что у гео́логов тру́дная, но интере́сная рабо́та.",
          "uz": "Viktor bilardi: geologlarning ishi og‘ir, lekin juda qiziqarli."
        },
        {
          "id": "s20",
          "ru": "Он познако́мился с ра́зными людьми́, кото́рые о́чень люби́ли свою́ специа́льность.",
          "uz": "U turli odamlar bilan tanishdi, ular o‘z kasbini juda yaxshi ko‘rardi."
        },
        {
          "id": "s21",
          "ru": "Ви́ктор рабо́тал вме́сте с ни́ми.",
          "uz": "Viktor ular bilan birga ishladi."
        },
        {
          "id": "s22",
          "ru": "Одна́жды Ви́ктор сказа́л гео́логам, что он хо́чет написа́ть расска́з об их профе́ссии.",
          "uz": "Bir kuni Viktor geologlarga: 'Men sizlarning kasbingiz haqida hikoya yozmoqchiman', dedi."
        },
        {
          "id": "s23",
          "ru": "И тепе́рь ка́ждый ве́чер по́сле рабо́ты гео́логи расска́зывали ему́ ра́зные исто́рии из свое́й жи́зни, что́бы помо́чь ему́ написа́ть интере́сный расска́з.",
          "uz": "Endi esa har kuni kechqurun geologlar unga o‘z hayotlaridan turli voqealarni aytib berishardi, shunda u yaxshi hikoya yozishi uchun yordam berishardi."
        },
        {
          "id": "s24",
          "ru": "Прошёл год.",
          "uz": "Bir yil o‘tdi."
        },
        {
          "id": "s25",
          "ru": "Когда́ Ви́ктор с гео́логами верну́лись в Петербу́рг, на вокза́ле они́ сказа́ли ему́: «Мы жела́ем тебе́ стать хоро́шим писа́телем!»",
          "uz": "Viktor geologlar bilan Peterburgga qaytganda, vokzalda ular unga: «Biz senga yaxshi yozuvchi bo'lishingni tilaymiz!» deyishdi."
        },
        {
          "id": "s26",
          "ru": "Ви́ктор засмея́лся и отве́тил: «А я реши́л стать гео́логом!»",
          "uz": "Viktor kulib: «Men esa geolog bo'lishga qaror qildim!» deb javob berdi."
        }
      ]
    },
    "vocabulary": [
      {
        "id": "w1",
        "ru": "собира́ться",
        "uz": "yig'ilishmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Мы собира́емся в па́рке.",
          "uz": "Biz bog'da yig'ilamiz."
        }
      },
      {
        "id": "w2",
        "ru": "око́нчить",
        "uz": "tugatmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я око́нчил шко́лу.",
          "uz": "Men maktabni tugatdim."
        }
      },
      {
        "id": "w3",
        "ru": "строи́тель",
        "uz": "quruvchi",
        "pos": "ot",
        "example": {
          "ru": "Мой оте́ц строи́тель.",
          "uz": "Mening otam quruvchi."
        }
      },
      {
        "id": "w4",
        "ru": "засмея́ться",
        "uz": "kulmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Де́ти засмея́лись гро́мко.",
          "uz": "Bolalar qattiq kulishdi."
        }
      },
      {
        "id": "w5",
        "ru": "жизнь",
        "uz": "hayot",
        "pos": "ot",
        "example": {
          "ru": "Жизнь прекра́сна.",
          "uz": "Hayot go'zal."
        }
      },
      {
        "id": "w6",
        "ru": "отве́тить",
        "uz": "javob bermoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я отвечу́ на вопро́с.",
          "uz": "Men savolga javob beraman."
        }
      },
      {
        "id": "w7",
        "ru": "сдать",
        "uz": "topshirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я сдал экза́мен.",
          "uz": "Men imtihonni topshirdim."
        }
      },
      {
        "id": "w8",
        "ru": "поступи́ть",
        "uz": "kirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он поступи́л в университе́т.",
          "uz": "U universitetga kirdi."
        }
      },
      {
        "id": "w9",
        "ru": "расска́з",
        "uz": "hikoya",
        "pos": "ot",
        "example": {
          "ru": "Я чита́ю расска́з.",
          "uz": "Men hikoya o'qiyapman."
        }
      },
      {
        "id": "w10",
        "ru": "стихи́",
        "uz": "she'rlar",
        "pos": "ot",
        "example": {
          "ru": "Я люблю́ чита́ть стихи́.",
          "uz": "Men she'rlar o'qishni yaxshi ko'raman."
        }
      },
      {
        "id": "w11",
        "ru": "до́лго",
        "uz": "uzoq muddat",
        "pos": "ravish",
        "example": {
          "ru": "Он до́лго ждал меня́.",
          "uz": "U uzoq muddat meni kutdi."
        }
      },
      {
        "id": "w12",
        "ru": "изучи́ть",
        "uz": "o'rganmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я хочу́ изучи́ть язы́к.",
          "uz": "Men tilni o'rganmoqchiman."
        }
      },
      {
        "id": "w13",
        "ru": "расска́зывать",
        "uz": "hikoya qilmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он лю́бит расска́зывать исто́рии.",
          "uz": "U hikoya qilishni yaxshi ko'radi."
        }
      },
      {
        "id": "w14",
        "ru": "помо́чь",
        "uz": "yordam bermoq",
        "pos": "fe'l",
        "example": {
          "ru": "Ты мо́жешь мне помо́чь?",
          "uz": "Menga yordam bera olasanmi?"
        }
      },
      {
        "id": "w15",
        "ru": "пройти́",
        "uz": "o'tmoq (прошёл год — yil o'tdi)",
        "pos": "fe'l",
        "example": {
          "ru": "Прошёл год о́чень бы́стро.",
          "uz": "Yil juda tez o'tdi."
        }
      },
      {
        "id": "w16",
        "ru": "жела́ть",
        "uz": "tilamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я жела́ю тебе́ уда́чи.",
          "uz": "Men senga omad tilayman."
        }
      },
      {
        "id": "w17",
        "ru": "забы́ть",
        "uz": "unutmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я забы́л твой а́дрес.",
          "uz": "Men sening manzilingni unutdim."
        }
      },
      {
        "id": "w18",
        "ru": "посо́л",
        "uz": "elchi",
        "pos": "ot",
        "example": {
          "ru": "Посо́л прие́хал в го́род.",
          "uz": "Elchi shaharga keldi."
        }
      },
      {
        "id": "w19",
        "ru": "посо́льство",
        "uz": "elchixona",
        "pos": "ot",
        "example": {
          "ru": "Посо́льство нахо́дится ря́дом.",
          "uz": "Elchixona yaqin joyda."
        }
      },
      {
        "id": "w20",
        "ru": "племя́нник",
        "uz": "jiyan (o'g'il bola)",
        "pos": "ot",
        "example": {
          "ru": "Мой племя́нник лю́бит рисова́ть.",
          "uz": "Mening jiyanim rasm chizishni yaxshi ko'radi."
        }
      }
    ]
  },
  {
    "id": "lesson-05",
    "title": "АБУ́-НУВА́С",
    "titleUz": "Abu-Nuvas va o‘g‘li",
    "level": "A2",
    "topic": "Ertak",
    "assignedAt": "2026-08-17",
    "dueAt": "2026-08-17T23:00:00+05:00",
    "reading": {
      "introUz": "Matnni ovoz chiqarib o‘qing va voqeani tushunishga harakat qiling.",
      "paragraphs": [
        "У Абу́-Нува́са был ма́ленький сын. Э́тому весёлому и хи́трому ма́льчику бы́ло то́лько семь лет, но он был уже́ о́чень похо́ж на своего́ отца́. Абу́-Нува́с о́чень люби́л своего́ весёлого хи́трого сы́на, хотя́ сын ча́сто обма́нывал своего́ отца́.",
        "Одна́жды друг Абу́-Нува́са пришёл к нему́ в го́сти и принёс ему́ сла́дкую халву́, кото́рую Абу́-Нува́с о́чень люби́л. Абу́-Нува́с реши́л, что он съест э́ту халву́, когда́ бу́дет пить чай. Друг Абу́-Нува́са ушёл. Абу́-Нува́с хоте́л нача́ть пить чай, но в э́тот моме́нт в дверь кто́-то постуча́л. Абу́-Нува́с откры́л дверь и уви́дел своего́ сосе́да. Сосе́д сказа́л Абу́-Нува́су, что у него́ сего́дня день рожде́ния и он хо́чет, что́бы Абу́-Нува́с пришёл к нему́ в го́сти. Абу́-Нува́с сказа́л, что придёт че́рез не́сколько мину́т. Но он хорошо́ знал, что, как то́лько он уйдёт, сын обяза́тельно съест вку́сную халву́, кото́рую принёс его́ друг. Поэ́тому он реши́л обману́ть своего́ ма́ленького сы́на.",
        "Он сказа́л своему́ ма́ленькому сы́ну, что челове́к, кото́рый принёс э́ту халву́, его́ ста́рый враг и что в э́той халве́ есть яд. «Е́сли ты съешь э́ту халву́, ты обяза́тельно умрёшь», — сказа́л Абу́-Нува́с своему́ сы́ну.",
        "Абу́-Нува́с ушёл к своему́ сосе́ду. Когда́ он ушёл, его́ весёлый хи́трый ма́ленький сын взял халву́ и съел её. Он по́нял, что оте́ц сказа́л непра́вду, потому́ что он не хоте́л, что́бы сын съел его́ люби́мую халву́.",
        "Но когда́ сын съел всю халву́, он испуга́лся. Он поду́мал, что оте́ц о́чень рассе́рдится, когда́ уви́дит, что сын съел всю халву́. И он реши́л обману́ть своего́ отца́. Он взял люби́мый нож Абу́-Нува́са и слома́л его́. Пото́м он положи́л сло́манный нож ря́дом с собо́й на пол и на́чал ждать, когда́ придёт оте́ц.",
        "Когда́ Абу́-Нува́с пришёл домо́й, он уви́дел, что его́ люби́мый ма́ленький сын сиди́т на полу́ и пла́чет, а ря́дом с ним лежи́т сло́манный нож. Сын уви́дел отца́ и сказа́л: «Я случа́йно слома́л твой люби́мый нож и реши́л умере́ть. Поэ́тому я съел всю халву́. А тепе́рь я сижу́ и жду, когда́ я умру́. Я не понима́ю, почему́ я ещё не у́мер». Когда́ Абу́-Нува́с услы́шал э́ти слова́, он на́чал гро́мко смея́ться. Он по́нял, что его́ ма́ленький сын хитре́е его́."
      ],
      "sentences": [
        {
          "id": "s1",
          "ru": "У Абу́-Нува́са был ма́ленький сын.",
          "uz": "Abu-Nuvasning kichkina o‘g‘li bor edi."
        },
        {
          "id": "s2",
          "ru": "Э́тому весёлому и хи́трому ма́льчику бы́ло то́лько семь лет, но он был уже́ о́чень похо́ж на своего́ отца́.",
          "uz": "Bu quvnoq va ayyor bola atigi yetti yoshda edi, lekin u allaqachon otasiga juda o‘xshardi."
        },
        {
          "id": "s3",
          "ru": "Абу́-Нува́с о́чень люби́л своего́ весёлого хи́трого сы́на, хотя́ сын ча́сто обма́нывал своего́ отца́.",
          "uz": "Abu-Nuvas o‘zining quvnoq va ayyor o‘g‘lini juda yaxshi ko‘rardi, garchi o‘g‘li tez-tez otasini aldab turardi."
        },
        {
          "id": "s4",
          "ru": "Одна́жды друг Абу́-Нува́са пришёл к нему́ в го́сти и принёс ему́ сла́дкую халву́, кото́рую Абу́-Нува́с о́чень люби́л.",
          "uz": "Bir kuni Abu-Nuvasning do‘sti unga mehmon bo‘lib keldi va u juda yaxshi ko‘radigan shirin halva olib keldi."
        },
        {
          "id": "s5",
          "ru": "Абу́-Нува́с реши́л, что он съест э́ту халву́, когда́ бу́дет пить чай.",
          "uz": "Abu-Nuvas halvani choy ichayotganda yeyishga qaror qildi."
        },
        {
          "id": "s6",
          "ru": "Друг Абу́-Нува́са ушёл.",
          "uz": "Abu-Nuvasning do‘sti ketdi."
        },
        {
          "id": "s7",
          "ru": "Абу́-Нува́с хоте́л нача́ть пить чай, но в э́тот моме́нт в дверь кто́-то постуча́л.",
          "uz": "Abu-Nuvas choy ichishni boshlamoqchi edi, shu payt eshik taqilladi."
        },
        {
          "id": "s8",
          "ru": "Абу́-Нува́с откры́л дверь и уви́дел своего́ сосе́да.",
          "uz": "Abu-Nuvas eshikni ochdi va qo‘shnisini ko‘rdi."
        },
        {
          "id": "s9",
          "ru": "Сосе́д сказа́л Абу́-Нува́су, что у него́ сего́дня день рожде́ния и он хо́чет, что́бы Абу́-Нува́с пришёл к нему́ в го́сти.",
          "uz": "Qo'shni Abu-Nuvasga bugun tug'ilgan kuni ekanini aytdi va uni mehmonlikka chaqirdi."
        },
        {
          "id": "s10",
          "ru": "Абу́-Нува́с сказа́л, что придёт че́рез не́сколько мину́т.",
          "uz": "Abu-Nuvas bir necha daqiqadan keyin borishini aytdi."
        },
        {
          "id": "s11",
          "ru": "Но он хорошо́ знал, что, как то́лько он уйдёт, сын обяза́тельно съест вку́сную халву́, кото́рую принёс его́ друг.",
          "uz": "Lekin u yaxshi bilar edi: u uyidan chiqishi bilan o'g'li do'sti olib kelgan mazali halvani albatta yeydi."
        },
        {
          "id": "s12",
          "ru": "Поэ́тому он реши́л обману́ть своего́ ма́ленького сы́на.",
          "uz": "Shuning uchun u kichkina o'g'lini aldashga qaror qildi."
        },
        {
          "id": "s13",
          "ru": "Он сказа́л своему́ ма́ленькому сы́ну, что челове́к, кото́рый принёс э́ту халву́, его́ ста́рый враг и что в э́той халве́ есть яд.",
          "uz": "U kichkina o'g'liga: 'Bu halvani olib kelgan odam men uchun eski dushman, bu halvada zahar bor', dedi."
        },
        {
          "id": "s14",
          "ru": "«Е́сли ты съешь э́ту халву́, ты обяза́тельно умрёшь», — сказа́л Абу́-Нува́с своему́ сы́ну.",
          "uz": "'Agar sen bu halvani yesang, albatta o'lib qolasan', — dedi Abu-Nuvas o'g'liga."
        },
        {
          "id": "s15",
          "ru": "Абу́-Нува́с ушёл к своему́ сосе́ду.",
          "uz": "Abu-Nuvas qo'shnisining uyiga ketdi."
        },
        {
          "id": "s16",
          "ru": "Когда́ он ушёл, его́ весёлый хи́трый ма́ленький сын взял халву́ и съел её.",
          "uz": "U chiqib ketgach, uning quvnoq va ayyor kichkina o'g'li halvani olib, yeb qo'ydi."
        },
        {
          "id": "s17",
          "ru": "Он по́нял, что оте́ц сказа́л непра́вду, потому́ что он не хоте́л, что́бы сын съел его́ люби́мую халву́.",
          "uz": "U otasi yolg'on gapirganini tushundi: otasi o'g'li sevimli halvasini yeb qo'yishini xohlamagan edi."
        },
        {
          "id": "s18",
          "ru": "Но когда́ сын съел всю халву́, он испуга́лся.",
          "uz": "Lekin o'g'li butun halvani yeb qo'ygach, qo'rqib ketdi."
        },
        {
          "id": "s19",
          "ru": "Он поду́мал, что оте́ц о́чень рассе́рдится, когда́ уви́дит, что сын съел всю халву́.",
          "uz": "U o'yladi: otasi o'g'li butun halvani yeb qo'yganini ko'rsa, juda jahli chiqadi."
        },
        {
          "id": "s20",
          "ru": "И он реши́л обману́ть своего́ отца́.",
          "uz": "Shuning uchun u otasini aldashga qaror qildi."
        },
        {
          "id": "s21",
          "ru": "Он взял люби́мый нож Абу́-Нува́са и слома́л его́.",
          "uz": "U Abu-Nuvasning sevimli pichog'ini olib, uni sindirdi."
        },
        {
          "id": "s22",
          "ru": "Пото́м он положи́л сло́манный нож ря́дом с собо́й на пол и на́чал ждать, когда́ придёт оте́ц.",
          "uz": "Keyin sindirilgan pichoqni yoniga polga qo'ydi va otasi kelishini kutdi."
        },
        {
          "id": "s23",
          "ru": "Когда́ Абу́-Нува́с пришёл домо́й, он уви́дел, что его́ люби́мый ма́ленький сын сиди́т на полу́ и пла́чет, а ря́дом с ним лежи́т сло́манный нож.",
          "uz": "Abu-Nuvas uyga kirganda, kichkina o'g'li polga o'tirib yig'layotganini va yonida sindirilgan pichoq yotganini ko'rdi."
        },
        {
          "id": "s24",
          "ru": "Сын уви́дел отца́ и сказа́л: «Я случа́йно слома́л твой люби́мый нож и реши́л умере́ть.",
          "uz": "O'g'li otasini ko'rib: “Men pichog'ingni tasodifan sindirib qo'ydim va shu sabab o'lishga qaror qildim”, dedi."
        },
        {
          "id": "s25",
          "ru": "Поэ́тому я съел всю халву́.",
          "uz": "Shuning uchun men butun halvani yeb qo'ydim."
        },
        {
          "id": "s26",
          "ru": "А тепе́рь я сижу́ и жду, когда́ я умру́.",
          "uz": "Endi esa o'tirib, qachon o'laman deb kutyapman."
        },
        {
          "id": "s27",
          "ru": "Я не понима́ю, почему́ я ещё не у́мер».",
          "uz": "Nega hali ham o'lmaganimni tushunmayapman."
        },
        {
          "id": "s28",
          "ru": "Когда́ Абу́-Нува́с услы́шал э́ти слова́, он на́чал гро́мко смея́ться.",
          "uz": "Abu-Nuvas bu gaplarni eshitib, baland ovozda kulib yubordi."
        },
        {
          "id": "s29",
          "ru": "Он по́нял, что его́ ма́ленький сын хитре́е его́.",
          "uz": "U o'g'li undan ham ayyorroq ekanini tushundi."
        }
      ]
    },
    "vocabulary": [
      {
        "id": "w1",
        "ru": "весёлый",
        "uz": "quvnoq",
        "pos": "sifat",
        "example": {
          "ru": "Ма́льчик весёлый сего́дня.",
          "uz": "Bola bugun quvnoq."
        }
      },
      {
        "id": "w2",
        "ru": "похо́ж",
        "uz": "o'xshash",
        "pos": "sifat",
        "example": {
          "ru": "Ты похо́ж на бра́та.",
          "uz": "Sen akangga o'xshashsan."
        }
      },
      {
        "id": "w3",
        "ru": "обма́нывать",
        "uz": "aldamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Не на́до обма́нывать люде́й.",
          "uz": "Odamlarni aldamaslik kerak."
        }
      },
      {
        "id": "w4",
        "ru": "гость",
        "uz": "mehmon",
        "pos": "ot",
        "example": {
          "ru": "К нам пришёл гость.",
          "uz": "Bizga mehmon keldi."
        }
      },
      {
        "id": "w5",
        "ru": "съесть",
        "uz": "yeb tugatmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я хочу́ съесть я́блоко.",
          "uz": "Men olmani yeb tugatmoqchiman."
        }
      },
      {
        "id": "w6",
        "ru": "пить",
        "uz": "ichmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он лю́бит пить чай.",
          "uz": "U choy ichishni yaxshi ko'radi."
        }
      },
      {
        "id": "w7",
        "ru": "вку́сный",
        "uz": "mazali",
        "pos": "sifat",
        "example": {
          "ru": "Э́то вку́сный суп.",
          "uz": "Bu mazali sho'rva."
        }
      },
      {
        "id": "w8",
        "ru": "враг",
        "uz": "dushman",
        "pos": "ot",
        "example": {
          "ru": "У него́ есть враг.",
          "uz": "Uning dushmani bor."
        }
      },
      {
        "id": "w9",
        "ru": "яд",
        "uz": "zahar",
        "pos": "ot",
        "example": {
          "ru": "У змеи́ есть яд.",
          "uz": "Ilonda zahar bor."
        }
      },
      {
        "id": "w10",
        "ru": "непра́вда",
        "uz": "yolg'on",
        "pos": "ot",
        "example": {
          "ru": "Э́то непра́вда.",
          "uz": "Bu yolg'on."
        }
      },
      {
        "id": "w11",
        "ru": "испуга́ться",
        "uz": "qo'rqmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я испуга́лся но́чью.",
          "uz": "Men tunda qo'rqdim."
        }
      },
      {
        "id": "w12",
        "ru": "поду́мать",
        "uz": "o'ylamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он поду́мал и отве́тил.",
          "uz": "U o'ylab, javob berdi."
        }
      },
      {
        "id": "w13",
        "ru": "рассерди́ться",
        "uz": "jahli chiqmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Она́ рассерди́лась на меня́.",
          "uz": "U menga jahli chiqdi."
        }
      },
      {
        "id": "w14",
        "ru": "слома́ть",
        "uz": "sindirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я слома́л каранда́ш.",
          "uz": "Men qalamni sindirdim."
        }
      },
      {
        "id": "w15",
        "ru": "положи́ть",
        "uz": "qo'ymoq",
        "pos": "fe'l",
        "example": {
          "ru": "Положи́ кни́гу на стол.",
          "uz": "Kitobni stolga qo'y."
        }
      },
      {
        "id": "w16",
        "ru": "ждать",
        "uz": "kutmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я жду дру́га здесь.",
          "uz": "Men do'stimni shu yerda kutyapman."
        }
      },
      {
        "id": "w17",
        "ru": "пла́кать",
        "uz": "yig'lamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Ма́льчик на́чал пла́кать.",
          "uz": "Bola yig'lay boshladi."
        }
      },
      {
        "id": "w18",
        "ru": "случа́йно",
        "uz": "to'satdan",
        "pos": "ravish",
        "example": {
          "ru": "Я случа́йно встре́тил его́.",
          "uz": "Men uni to'satdan uchratdim."
        }
      },
      {
        "id": "w19",
        "ru": "смея́ться",
        "uz": "kulmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Де́ти лю́бят смея́ться вме́сте.",
          "uz": "Bolalar birga kulishni yaxshi ko'radi."
        }
      },
      {
        "id": "w20",
        "ru": "принести́",
        "uz": "olib kelmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Пожа́луйста, принеси́ мне во́ду.",
          "uz": "Iltimos, menga suv olib kel."
        }
      }
    ]
  },
  {
    "id": "lesson-06",
    "title": "ДРУЗЬЯ",
    "titleUz": "Do'stlar",
    "level": "A2",
    "topic": "Kundalik hayot",
    "assignedAt": "2026-08-19",
    "dueAt": "2026-08-19T23:00:00+05:00",
    "reading": {
      "introUz": "Matnni ovoz chiqarib o'qing va asosiy voqealarni tushunishga harakat qiling.",
      "paragraphs": [
        "Ли́да жила́ в Москве́. Ей бы́ло трина́дцать лет. Она́ учи́лась в шко́ле. Ли́да жила́ в Москве́ без роди́телей. Её мать умерла́ не́сколько лет наза́д, а оте́ц был в а́рмии и жил в дру́гом го́роде.",
        "Зимо́й Ли́да жила́ у свое́й ста́ршей сестры́, а ле́том, когда́ бы́ли кани́кулы, она́ отдыха́ла в дере́вне. Там у Ли́ды бы́ло мно́го друзе́й. Но лу́чшим дру́гом Ли́ды был ма́льчик, кото́рого зва́ли Тиму́р. Он всегда́ помога́л Ли́де, когда́ ей бы́ло тру́дно.",
        "Одна́жды ле́том, когда́ Ли́да отдыха́ла в дере́вне, она́ пошла́ гуля́ть со свои́ми друзья́ми и верну́лась домо́й о́чень по́здно. Когда́ она́ вошла́ в свою́ ко́мнату, она́ уви́дела, что на столе́ лежи́т телегра́мма. Ли́да взяла́ телегра́мму и прочита́ла её. Телегра́мма была́ от сестры́. «Сего́дня но́чью оте́ц бу́дет в Москве́. Он бу́дет здесь то́лько два часа́. Жду тебя́ в Москве́».",
        "Ли́да положи́ла телегра́мму на стол и посмотре́ла на часы́. Бы́ло двена́дцать часо́в но́чи. Ли́да поняла́, что она́ опозда́ла на после́дний по́езд и уже́ не смо́жет уви́деть отца́. Она́ се́ла на крова́ть и запла́кала. Она́ давно́ не ви́дела отца́ и о́чень хоте́ла встре́титься с ним.",
        "Вдруг Ли́да вспо́мнила, что у неё есть друг Тиму́р, кото́рый всегда́ помога́л ей ра́ньше в тру́дные мину́ты. Мо́жет быть, он помо́жет ей и тепе́рь? Ли́да позвони́ла Тиму́ру по телефо́ну и рассказа́ла ему́ о телегра́мме, кото́рую она́ получи́ла. Тиму́р сказа́л ей, что́бы она́ ждала́ его́ о́коло до́ма.",
        "Че́рез не́сколько мину́т Тиму́р прие́хал к до́му на мотоци́кле своего́ ста́ршего бра́та. Ли́да се́ла на мотоци́кл, и они́ пое́хали в Москву́. Когда́ они́ прие́хали, оте́ц Ли́ды уже́ стоя́л о́коло две́ри. Он о́чень обра́довался, потому́ что ду́мал, что уже́ не уви́дит Ли́ду. Он сказа́л Ли́де: «Как хорошо́, что ты прие́хала! Но почему́ ты прие́хала так по́здно?»",
        "Ли́да отве́тила ему́: «Я получи́ла телегра́мму о́чень по́здно. Когда́ после́дний по́езд ушёл в Москву́, я ду́мала, что я не смогу́ уви́деть тебя́. Но у меня́ есть друг Тиму́р. Он о́чень хоро́ший челове́к. Э́то он помо́г мне прие́хать в Москву́».",
        "Ли́да позвала́ Тиму́ра. Оте́ц поблагодари́л его́ и сказа́л Ли́де: «Я о́чень рад, что у тебя́ есть хоро́ший друг!»"
      ],
      "sentences": [
        {
          "id": "s1",
          "ru": "Ли́да жила́ в Москве́.",
          "uz": "Lida Moskva shahrida yashardi."
        },
        {
          "id": "s2",
          "ru": "Ей бы́ло трина́дцать лет.",
          "uz": "U o'n uch yoshda edi."
        },
        {
          "id": "s3",
          "ru": "Она́ учи́лась в шко́ле.",
          "uz": "U maktabda o'qirdi."
        },
        {
          "id": "s4",
          "ru": "Ли́да жила́ в Москве́ без роди́телей.",
          "uz": "Lida Moskvada ota-onasisiz yashardi."
        },
        {
          "id": "s5",
          "ru": "Её мать умерла́ не́сколько лет наза́д, а оте́ц был в а́рмии и жил в дру́гом го́роде.",
          "uz": "Onasi bir necha yil oldin vafot etgan, otasi esa harbiyda bo'lib, boshqa shaharda yashardi."
        },
        {
          "id": "s6",
          "ru": "Зимо́й Ли́да жила́ у свое́й ста́ршей сестры́, а ле́том, когда́ бы́ли кани́кулы, она́ отдыха́ла в дере́вне.",
          "uz": "Qishda Lida opasinikida yashardi, yozda esa ta'til paytida qishloqda dam olardi."
        },
        {
          "id": "s7",
          "ru": "Там у Ли́ды бы́ло мно́го друзе́й.",
          "uz": "U yerda Lidaning ko'p do'stlari bor edi."
        },
        {
          "id": "s8",
          "ru": "Но лу́чшим дру́гом Ли́ды был ма́льчик, кото́рого зва́ли Тиму́р.",
          "uz": "Lidaning eng yaqin do'sti esa Timur ismli bola edi."
        },
        {
          "id": "s9",
          "ru": "Он всегда́ помога́л Ли́де, когда́ ей бы́ло тру́дно.",
          "uz": "U har doim Lida qiynalganida unga yordam berardi."
        },
        {
          "id": "s10",
          "ru": "Одна́жды ле́том, когда́ Ли́да отдыха́ла в дере́вне, она́ пошла́ гуля́ть со свои́ми друзья́ми и верну́лась домо́й о́чень по́здно.",
          "uz": "Bir kuni yozda, Lida qishloqda dam olayotganda, do'stlari bilan sayrga chiqdi va uyga juda kech qaytdi."
        },
        {
          "id": "s11",
          "ru": "Когда́ она́ вошла́ в свою́ ко́мнату, она́ уви́дела, что на столе́ лежи́т телегра́мма.",
          "uz": "U xonasiga kirganida, stol ustida telegramma yotganini ko'rdi."
        },
        {
          "id": "s12",
          "ru": "Ли́да взяла́ телегра́мму и прочита́ла её.",
          "uz": "Lida telegrammani olib, o'qidi."
        },
        {
          "id": "s13",
          "ru": "Телегра́мма была́ от сестры́.",
          "uz": "Telegramma opasidan edi."
        },
        {
          "id": "s14",
          "ru": "«Сего́дня но́чью оте́ц бу́дет в Москве́.",
          "uz": "«Bugun kechasi otam Moskvada bo'ladi."
        },
        {
          "id": "s15",
          "ru": "Он бу́дет здесь то́лько два часа́.",
          "uz": "U faqat ikki soatgina shu yerda bo'ladi."
        },
        {
          "id": "s16",
          "ru": "Жду тебя́ в Москве́».",
          "uz": "Seni Moskvada kutaman.»"
        },
        {
          "id": "s17",
          "ru": "Ли́да положи́ла телегра́мму на стол и посмотре́ла на часы́.",
          "uz": "Lida telegrammani stolga qo'ydi va soatga qaradi."
        },
        {
          "id": "s18",
          "ru": "Бы́ло двена́дцать часо́в но́чи.",
          "uz": "Soat tungi o'n ikki edi."
        },
        {
          "id": "s19",
          "ru": "Ли́да поняла́, что она́ опозда́ла на после́дний по́езд и уже́ не смо́жет уви́деть отца́.",
          "uz": "Lida oxirgi poyezdga kech qolganini va endi otasini ko'ra olmasligini tushundi."
        },
        {
          "id": "s20",
          "ru": "Она́ се́ла на крова́ть и запла́кала.",
          "uz": "U karavotga o'tirib yig'lab yubordi."
        },
        {
          "id": "s21",
          "ru": "Она́ давно́ не ви́дела отца́ и о́чень хоте́ла встре́титься с ним.",
          "uz": "U otasini anchadan beri ko'rmagan edi va u bilan uchrashishni juda xohlardi."
        },
        {
          "id": "s22",
          "ru": "Вдруг Ли́да вспо́мнила, что у неё есть друг Тиму́р, кото́рый всегда́ помога́л ей ра́ньше в тру́дные мину́ты.",
          "uz": "Birdan Lida esladi: uning do'sti Timur bor, u har doim qiyin paytda yordam bergan."
        },
        {
          "id": "s23",
          "ru": "Мо́жет быть, он помо́жет ей и тепе́рь?",
          "uz": "Balki, hozir ham yordam berar?"
        },
        {
          "id": "s24",
          "ru": "Ли́да позвони́ла Тиму́ру по телефо́ну и рассказа́ла ему́ о телегра́мме, кото́рую она́ получи́ла.",
          "uz": "Lida Timurga telefon qilib, olgan telegrammasi haqida gapirib berdi."
        },
        {
          "id": "s25",
          "ru": "Тиму́р сказа́л ей, что́бы она́ ждала́ его́ о́коло до́ма.",
          "uz": "Timur unga uy yonida kutib turishini aytdi."
        },
        {
          "id": "s26",
          "ru": "Че́рез не́сколько мину́т Тиму́р прие́хал к до́му на мотоци́кле своего́ ста́ршего бра́та.",
          "uz": "Bir necha daqiqadan so'ng Timur akasining mototsiklida uyga keldi."
        },
        {
          "id": "s27",
          "ru": "Ли́да се́ла на мотоци́кл, и они́ пое́хали в Москву́.",
          "uz": "Lida mototsiklga o'tirdi va ular Moskvaga yo'l olishdi."
        },
        {
          "id": "s28",
          "ru": "Когда́ они́ прие́хали, оте́ц Ли́ды уже́ стоя́л о́коло две́ри.",
          "uz": "Ular yetib kelganida, Lidaning otasi eshik oldida turardi."
        },
        {
          "id": "s29",
          "ru": "Он о́чень обра́довался, потому́ что ду́мал, что уже́ не уви́дит Ли́ду.",
          "uz": "U juda xursand bo'ldi, chunki Lidani endi ko'rmayman deb o'ylagandi."
        },
        {
          "id": "s30",
          "ru": "Он сказа́л Ли́де: «Как хорошо́, что ты прие́хала!",
          "uz": "U Lidaga dedi: «Kelganing qanday yaxshi bo'ldi!"
        },
        {
          "id": "s31",
          "ru": "Но почему́ ты прие́хала так по́здно?»",
          "uz": "Lekin nega bunchalik kech kelding?»"
        },
        {
          "id": "s32",
          "ru": "Ли́да отве́тила ему́: «Я получи́ла телегра́мму о́чень по́здно.",
          "uz": "Lida unga javob berdi: «Men telegrammani juda kech oldim."
        },
        {
          "id": "s33",
          "ru": "Когда́ после́дний по́езд ушёл в Москву́, я ду́мала, что я не смогу́ уви́деть тебя́.",
          "uz": "Oxirgi poyezd Moskvaga ketib bo'lganda, men seni ko'ra olmayman deb o'ylagandim."
        },
        {
          "id": "s34",
          "ru": "Но у меня́ есть друг Тиму́р.",
          "uz": "Lekin menda do'stim Timur bor."
        },
        {
          "id": "s35",
          "ru": "Он о́чень хоро́ший челове́к.",
          "uz": "U juda yaxshi inson."
        },
        {
          "id": "s36",
          "ru": "Э́то он помо́г мне прие́хать в Москву́».",
          "uz": "Aynan u menga Moskvaga kelishda yordam berdi.»"
        },
        {
          "id": "s37",
          "ru": "Ли́да позвала́ Тиму́ра.",
          "uz": "Lida Timurni chaqirdi."
        },
        {
          "id": "s38",
          "ru": "Оте́ц поблагодари́л его́ и сказа́л Ли́де: «Я о́чень рад, что у тебя́ есть хоро́ший друг!»",
          "uz": "Otasi unga rahmat aytdi va Lidaga dedi: «Senda yaxshi do'st borligidan juda xursandman!»"
        }
      ]
    },
    "vocabulary": [
      {
        "id": "w1",
        "ru": "наза́д",
        "uz": "oldin",
        "pos": "ravish",
        "example": {
          "ru": "Я прие́хал сюда́ два го́да наза́д.",
          "uz": "Men bu yerga ikki yil oldin keldim."
        }
      },
      {
        "id": "w2",
        "ru": "ста́рший",
        "uz": "katta (oilada)",
        "pos": "sifat",
        "example": {
          "ru": "Э́то мой ста́рший брат.",
          "uz": "Bu mening akam."
        }
      },
      {
        "id": "w3",
        "ru": "дере́вня",
        "uz": "qishloq",
        "pos": "ot",
        "example": {
          "ru": "Моя́ ба́бушка живёт в дере́вне.",
          "uz": "Buvim qishloqda yashaydi."
        }
      },
      {
        "id": "w4",
        "ru": "верну́ться",
        "uz": "qaytmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я хочу́ верну́ться домо́й.",
          "uz": "Men uyga qaytmoqchiman."
        }
      },
      {
        "id": "w5",
        "ru": "по́здно",
        "uz": "kech",
        "pos": "ravish",
        "example": {
          "ru": "Он пришёл по́здно.",
          "uz": "U kech keldi."
        }
      },
      {
        "id": "w6",
        "ru": "войти́",
        "uz": "kirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Пожа́луйста, войди́те в класс.",
          "uz": "Iltimos, sinfga kiring."
        }
      },
      {
        "id": "w7",
        "ru": "телегра́мма",
        "uz": "telegramma (xat)",
        "pos": "ot",
        "example": {
          "ru": "Я получи́л телегра́мму.",
          "uz": "Men telegramma oldim."
        }
      },
      {
        "id": "w8",
        "ru": "положи́ть",
        "uz": "qo'ymoq",
        "pos": "fe'l",
        "example": {
          "ru": "Положи́ кни́гу на стол.",
          "uz": "Kitobni stolga qo'y."
        }
      },
      {
        "id": "w9",
        "ru": "опозда́ть",
        "uz": "kech qolmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я опозда́л на уро́к.",
          "uz": "Men darsga kech qoldim."
        }
      },
      {
        "id": "w10",
        "ru": "после́дний",
        "uz": "so'nggi",
        "pos": "sifat",
        "example": {
          "ru": "Э́то мой после́дний уро́к.",
          "uz": "Bu mening so'nggi darsim."
        }
      },
      {
        "id": "w11",
        "ru": "встре́титься",
        "uz": "uchrashmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Мы встре́тились в па́рке.",
          "uz": "Biz parkda uchrashdik."
        }
      },
      {
        "id": "w12",
        "ru": "вспо́мнить",
        "uz": "eslamoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я вспо́мнил твои́ слова́.",
          "uz": "Men sening so'zlaringni esladim."
        }
      },
      {
        "id": "w13",
        "ru": "давно́",
        "uz": "anchadan beri",
        "pos": "ravish",
        "example": {
          "ru": "Я давно́ здесь живу́.",
          "uz": "Men bu yerda anchadan beri yashayman."
        }
      },
      {
        "id": "w14",
        "ru": "о́коло",
        "uz": "yonida, yaqinida",
        "pos": "ravish",
        "example": {
          "ru": "Магази́н о́коло до́ма.",
          "uz": "Do'kon uy yonida."
        }
      },
      {
        "id": "w15",
        "ru": "обра́доваться",
        "uz": "xursand bo'lmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Он обра́довался но́вости.",
          "uz": "U xabarga xursand bo'ldi."
        }
      },
      {
        "id": "w16",
        "ru": "получи́ть",
        "uz": "olmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я получи́л письмо́ вчера́.",
          "uz": "Men kecha xat oldim."
        }
      },
      {
        "id": "w17",
        "ru": "позва́ть",
        "uz": "chaqirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Ма́ма позвала́ меня́ домо́й.",
          "uz": "Onam meni uyga chaqirdi."
        }
      },
      {
        "id": "w18",
        "ru": "поблагодари́ть",
        "uz": "minnatdorchilik bildirmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я поблагодари́л учи́теля.",
          "uz": "Men o'qituvchiga minnatdorchilik bildirdim."
        }
      },
      {
        "id": "w19",
        "ru": "предста́вить",
        "uz": "tasavvur qilmoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я не могу́ предста́вить э́то.",
          "uz": "Men buni tasavvur qila olmayman."
        }
      },
      {
        "id": "w20",
        "ru": "помога́ть",
        "uz": "yordam bermoq",
        "pos": "fe'l",
        "example": {
          "ru": "Я помога́ю ба́бушке до́ма.",
          "uz": "Men uyda buvimga yordam beraman."
        }
      }
    ]
  }
]
