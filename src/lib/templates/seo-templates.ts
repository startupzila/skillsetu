/**
 * SEO template generator — auto-generates per-language SEO metadata for courses.
 *
 * Called when a course (or a new translation) is created, so the SEO content
 * is ready immediately without a separate script. Editors can refine later.
 *
 * Templates produce keyword-rich, search-engine-friendly content in both
 * English and Hindi, covering the common search patterns users would type:
 *   "{title} tutorial", "{title} course", "{title} free tutorial", etc.
 */

export interface CourseSeoData {
  seo_title: string
  seo_description: string
  seo_keywords: string[]
  seo_faqs: Array<{ q: string; a: string }>
  seo_intro_paragraph: string
}

/**
 * Generate SEO data for a course in the given language.
 *
 * @param title         — course title in that language
 * @param shortDesc     — short description in that language (optional)
 * @param difficulty    — difficulty level (beginner/intermediate/etc.)
 * @param lang          — 'en' | 'hi'
 */
export function generateCourseSeo(
  title: string,
  shortDesc: string | null | undefined,
  difficulty: string | null | undefined,
  lang: 'en' | 'hi',
): CourseSeoData {
  if (lang === 'hi') {
    return generateHindiSeo(title, shortDesc, difficulty)
  }
  return generateEnglishSeo(title, shortDesc, difficulty)
}

function generateEnglishSeo(
  title: string,
  shortDesc: string | null | undefined,
  difficulty: string | null | undefined,
): CourseSeoData {
  const diff = difficulty ? difficulty.replace('_', ' ') : 'beginner'
  const desc = shortDesc ?? `Learn ${title} with step-by-step tutorials and examples`

  return {
    seo_title: `${title} — Free Online Course & Tutorial | MioDemy`,
    seo_description: `Learn ${title} with free structured tutorials, examples, practice exercises, quizzes, and downloadable PDFs. ${desc} ${diff === 'beginner' ? 'Perfect for beginners.' : `Suitable for ${diff} learners.`} Available in English and Hindi.`,
    seo_keywords: [
      `${title} Tutorial`,
      `${title} Course`,
      `${title} Free Tutorial`,
      `${title} Free Course`,
      `${title} Video Tutorial`,
      `${title} Online Course`,
      `${title} for Beginners`,
      `Learn ${title}`,
      `${title} Examples`,
      `${title} Practice`,
      `${title} PDF`,
      `${title} Notes`,
      `${title} in Hindi`,
      `Free ${title} Course Online`,
    ],
    seo_faqs: [
      {
        q: `Is the ${title} course free?`,
        a: `Yes, the ${title} course on MioDemy is completely free, including all lessons, examples, practice exercises, quizzes, and downloadable PDF notes. There are no hidden fees or subscriptions.`,
      },
      {
        q: `Can I learn ${title} in Hindi?`,
        a: `Yes, this ${title} course is available in both English and Hindi. You can switch the language anytime using the language switcher in the header, and all lessons, examples, and practice exercises will be shown in your preferred language.`,
      },
      {
        q: `Does the ${title} course include practice exercises and quizzes?`,
        a: `Yes, every lesson in the ${title} course includes worked examples, practice problems, and multiple-choice questions (MCQs) to reinforce your learning. You can test your understanding after each lesson.`,
      },
      {
        q: `Are PDF notes and cheat sheets available for ${title}?`,
        a: `Yes, free PDF notes, cheat sheets, and downloadable resources are available for the ${title} course. Visit the Free PDF Downloads section on the course page to access them.`,
      },
      {
        q: `What level is the ${title} course suitable for?`,
        a: `The ${title} course is designed for ${diff} learners. Whether you are starting from scratch or looking to strengthen your skills, the step-by-step tutorials guide you through each concept with clear examples.`,
      },
    ],
    seo_intro_paragraph: `MioDemy's free ${title} course is a comprehensive, structured learning program that covers everything you need to master ${title}. With step-by-step tutorials, real-world examples, hands-on practice exercises, interactive quizzes, and downloadable PDF notes, this course is designed for ${diff} learners. ${desc} The course is self-paced and available in both English and Hindi, so you can learn in the language you're most comfortable with. Each lesson builds on the previous one, taking you from the fundamentals to advanced techniques with clear explanations and practical exercises.`,
  }
}

function generateHindiSeo(
  title: string,
  shortDesc: string | null | undefined,
  difficulty: string | null | undefined,
): CourseSeoData {
  const diff = difficulty ? difficulty.replace('_', ' ') : 'शुरुआती'
  const desc = shortDesc ?? `${title} सीखें — चरण-दर-चरण ट्यूटोरियल और उदाहरण के साथ`

  return {
    seo_title: `${title} — मुफ्त ऑनलाइन कोर्स और ट्यूटोरियल | MioDemy`,
    seo_description: `${title} सीखें — मुफ्त संरचित ट्यूटोरियल, उदाहरण, अभ्यास, क्विज़ और डाउनलोड करने योग्य PDF के साथ। ${desc} ${diff === 'शुरुआती' ? 'शुरुआती लोगों के लिए एकदम सही।' : `${diff} स्तर के लिए उपयुक्त।`} अंग्रेज़ी और हिंदी दोनों में उपलब्ध।`,
    seo_keywords: [
      `${title} Tutorial in Hindi`,
      `${title} Course in Hindi`,
      `${title} Free Tutorial in Hindi`,
      `${title} Free Course in Hindi`,
      `${title} Video Tutorial in Hindi`,
      `${title} Online Course in Hindi`,
      `${title} हिंदी में`,
      `${title} सीखें`,
      `${title} ट्यूटोरियल`,
      `${title} कोर्स`,
      `${title} मुफ्त कोर्स`,
      `${title} PDF`,
      `${title} नोट्स`,
      `${title} उदाहरण`,
      `हिंदी में ${title}`,
    ],
    seo_faqs: [
      {
        q: `क्या ${title} कोर्स मुफ़्त है?`,
        a: `हाँ, MioDemy पर ${title} कोर्स पूरी तरह मुफ़्त है। सभी पाठ, उदाहरण, अभ्यास, क्विज़ और डाउनलोड करने योग्य PDF नोट्स शामिल हैं। कोई छिपी हुई फीस या सब्सक्रिप्शन नहीं है।`,
      },
      {
        q: `क्या ${title} कोर्स हिंदी में उपलब्ध है?`,
        a: `हाँ, यह ${title} कोर्स हिंदी और अंग्रेज़ी दोनों में उपलब्ध है। आप हेडर में भाषा स्विचर का उपयोग करके कभी भी भाषा बदल सकते हैं। सभी पाठ, उदाहरण और अभ्यास आपकी पसंद की भाषा में दिखाए जाएंगे।`,
      },
      {
        q: `क्या ${title} कोर्स में अभ्यास और क्विज़ शामिल हैं?`,
        a: `हाँ, ${title} कोर्स के हर पाठ में उदाहरण, अभ्यास प्रश्न और बहुविकल्पीय प्रश्न (MCQ) शामिल हैं ताकि आपकी समझ मजबूत हो सके। हर पाठ के बाद आप अपनी जानकारी का परीक्षण कर सकते हैं।`,
      },
      {
        q: `क्या ${title} के लिए PDF नोट्स और चीट शीट उपलब्ध हैं?`,
        a: `हाँ, ${title} कोर्स के लिए मुफ्त PDF नोट्स, चीट शीट और डाउनलोड करने योग्य संसाधन उपलब्ध हैं। कोर्स पेज पर "मुफ्त PDF डाउनलोड" सेक्शन पर जाएं।`,
      },
      {
        q: `${title} कोर्स किस स्तर के लिए है?`,
        a: `${title} कोर्स ${diff} स्तर के लिए डिज़ाइन किया गया है। चाहे आप बिल्कुल शुरुआत से शुरू कर रहे हों या अपने कौशल को मजबूत करना चाहते हों, चरण-दर-चरण ट्यूटोरियल आपको हर अवधारणा को स्पष्ट उदाहरणों के साथ समझाएंगे।`,
      },
    ],
    seo_intro_paragraph: `MioDemy का मुफ़्त ${title} कोर्स एक व्यापक, संरचित शिक्षण कार्यक्रम है जो ${title} में महारत हासिल करने के लिए आवश्यक सब कुछ कवर करता है। चरण-दर-चरण ट्यूटोरियल, वास्तविक दुनिया के उदाहरण, व्यावहारिक अभ्यास, इंटरैक्टिव क्विज़ और डाउनलोड करने योग्य PDF नोट्स के साथ, यह कोर्स ${diff} स्तर के लिए डिज़ाइन किया गया है। ${desc} यह कोर्स स्व-गति वाला है और अंग्रेज़ी तथा हिंदी दोनों में उपलब्ध है, ताकि आप अपनी पसंद की भाषा में सीख सकें। हर पाठ पिछले पाठ पर निर्मित होता है, जो आपको मूल बातों से लेकर उन्नत तकनीकों तक स्पष्ट व्याख्या और व्यावहारिक अभ्यास के साथ ले जाता है।`,
  }
}
