/**
 * Ovoz sintezi provayderi shartnomasi.
 *
 * Ilova qaysi xizmat ishlayotganini bilmaydi — faqat shu interfeysga murojaat
 * qiladi. Provayderni almashtirish uchun `.env` dagi TTS_PROVIDER yetarli.
 *
 * Barcha matn bir xil — tabiiy — tezlikda o'qiladi. Sun'iy sekinlashtirish
 * urg'uni buzadi va o'quvchi haqiqiy nutqni tanimay qoladi.
 */

export interface TtsProvider {
  /** Loglar va diagnostika uchun nom */
  readonly name: string
  /** Kalit sozlanganmi? */
  isConfigured(): boolean
  /** Matnni mp3 audioga aylantiradi */
  speak(text: string): Promise<Buffer>
}
