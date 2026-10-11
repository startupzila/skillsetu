/**
 * SEO template generator for jurisdiction location pages.
 *
 * Auto-generates keyword-rich SEO content (intro paragraph, keywords list,
 * FAQs) for state, district, and city centre directory pages.
 *
 * Usage:
 *   const seo = generateJurisdictionSeo({ locationName, parentName, type, lang })
 *   // seo.seo_title, seo.seo_description, seo.keywords, seo.intro_paragraph, seo.faqs
 */

export interface JurisdictionSeoData {
  seo_title: string
  seo_description: string
  keywords: string[]
  intro_paragraph: string
  faqs: Array<{ q: string; a: string }>
}

interface JurisdictionSeoInput {
  /** Name of this location (e.g. "Nagod", "Satna", "Madhya Pradesh") */
  locationName: string
  /** Parent location name (e.g. "Satna" for city Nagod, "Madhya Pradesh" for district Satna) */
  parentName?: string
  /** Type: 'state' | 'district' | 'city' */
  type: 'state' | 'district' | 'city'
  /** Language: 'en' | 'hi' (currently only English — SEO content stays in English for search engines) */
  lang?: 'en' | 'hi'
}

/**
 * Generate SEO data for a jurisdiction location page.
 *
 * Keywords cover the patterns users search for:
 *   "Skill Centres in [Location]"
 *   "Training Centres in [Location]"
 *   "Skill & Training Centres in [Location]"
 *   "[Location] + [Parent]" combos
 *   Course-specific: "Excel training in [Location]", "Tally classes in [Location]", etc.
 */
export function generateJurisdictionSeo(input: JurisdictionSeoInput): JurisdictionSeoData {
  const { locationName, parentName, type } = input

  // Build the full location context
  const fullLocation = parentName
    ? `${locationName}, ${parentName}`
    : locationName

  // Core keyword patterns (the user's requested keywords)
  const keywords: string[] = [
    `Skill Centres in ${locationName}`,
    `Training Centres in ${locationName}`,
    `Skill & Training Centres in ${locationName}`,
    `Skill and Training Centres in ${locationName}`,
    `Computer Training Centres in ${locationName}`,
    `Skill Development Centres in ${locationName}`,
    `Training Institutes in ${locationName}`,
    `Coaching Centres in ${locationName}`,
  ]

  // Add parent-location combos (e.g. "Skill Centres in Nagod Satna", "Skill Centres in Satna Madhya Pradesh")
  if (parentName) {
    keywords.push(
      `Skill Centres in ${locationName} ${parentName}`,
      `Training Centres in ${locationName} ${parentName}`,
      `Skill & Training Centres in ${locationName} ${parentName}`,
    )
  }

  // Add course-specific keywords
  const courses = [
    'Excel', 'Tally', 'Digital Marketing', 'Computer', 'Accounting',
    'Data Entry', 'Web Design', 'Graphic Design', 'Programming',
  ]
  for (const course of courses) {
    keywords.push(`${course} training in ${locationName}`)
    keywords.push(`${course} classes in ${locationName}`)
    keywords.push(`${course} course in ${locationName}`)
    keywords.push(`${course} institute in ${locationName}`)
  }

  // Add type-specific keywords
  if (type === 'state') {
    keywords.push(
      `training centres in ${locationName} state`,
      `skill centres in ${locationName} India`,
      `best training centres in ${locationName}`,
      `top training institutes in ${locationName}`,
      `vocational training centres in ${locationName}`,
      `IT training centres in ${locationName}`,
    )
  } else if (type === 'district') {
    keywords.push(
      `training centres in ${locationName} district`,
      `skill centres in ${locationName} ${parentName ?? ''}`.trim(),
      `coaching classes in ${locationName}`,
      `computer institutes in ${locationName}`,
      `education centres in ${locationName}`,
    )
  } else if (type === 'city') {
    keywords.push(
      `training centres near ${locationName}`,
      `skill centres near me in ${locationName}`,
      `coaching centres in ${locationName} ${parentName ?? ''}`.trim(),
      `training institutes in ${locationName} ${parentName ?? ''}`.trim(),
      `best coaching in ${locationName}`,
      `computer classes in ${locationName}`,
      `IT training in ${locationName}`,
    )
  }

  // Generate SEO title
  const seo_title = `Skill & Training Centres in ${fullLocation} — Find Institutes | MioDemy`

  // Generate SEO description
  const seo_description = `Find verified skill and training centres in ${fullLocation}. Browse institutes offering Excel, Tally, Digital Marketing, computer training and more. Courses, fees, reviews, and contact details for training centres in ${locationName}.`

  // Generate intro paragraph
  const intro_paragraph = `MioDemy's directory lists verified skill and training centres in ${fullLocation}. Whether you're looking for Excel training, Tally courses, Digital Marketing classes, computer training, or skill development programs, our directory helps you find the right training institute in ${locationName}. Each centre profile includes course details, fees, duration, mode (offline/online/hybrid), office hours, contact information, location address, student reviews and ratings. Browse ${type === 'state' ? `centres across all districts in ${locationName}` : type === 'district' ? `centres in ${locationName}${parentName ? `, ${parentName}` : ''}` : `centres in ${locationName}`} and find the perfect training provider near you.`
    .replace(/,\s*,/g, ',')

  // Generate FAQs
  const faqs = [
    {
      q: `How to find training centres in ${locationName}?`,
      a: `Browse the list above or use the MioDemy directory to find verified training centres in ${fullLocation}. You can filter by location, search by name, or browse by course type. Each centre has a detailed profile with courses, fees, reviews and contact information.`,
    },
    {
      q: `Are these training centres in ${locationName} verified?`,
      a: `Yes, all centres listed on MioDemy are verified by our team before going live. Each centre has a "Verified" badge on their profile. We verify centre details including address, courses offered, and contact information.`,
    },
    {
      q: `What courses are offered by training centres in ${locationName}?`,
      a: `Training centres in ${locationName} offer courses in Excel, Tally, Digital Marketing, computer skills, accounting, data entry, web design, graphic design, programming, and more. Browse individual centre profiles to see their specific course offerings, fees, and duration.`,
    },
    {
      q: `Can I register my training centre in ${locationName} on MioDemy?`,
      a: `Yes! If you run a training centre in ${locationName}, click "Register Centre" and fill out the registration form. Our team will verify your details and your centre page will go live with full course information, fees, reviews and contact details.`,
    },
    {
      q: `How do I contact a training centre in ${locationName}?`,
      a: `Each centre profile on MioDemy includes contact information such as phone number, email, address, and office hours. Visit the centre's profile page and use the provided contact details to get in touch directly.`,
    },
  ]

  return {
    seo_title,
    seo_description,
    keywords: [...new Set(keywords)], // deduplicate
    intro_paragraph,
    faqs,
  }
}
