# MioDemy — Feature Plan: Free PDF Download & Training Centres Directory

**Status:** Active Development
**Date:** 2026-10-08

---

## Part A: Free PDF Download System

### Goal
Allow course editors to attach free downloadable PDFs (notes, cheat sheets, short notes, workbooks) to courses. Create SEO-optimized `/courses/[slug]/pdf` pages that rank for keywords like "PowerPoint PDF", "PowerPoint Notes", "PowerPoint Cheat Sheet" etc.

### URL
`/courses/[slug]/pdf` — separate SEO-optimized page per course

### DB Schema
```sql
CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'pdf' | 'notes' | 'short_notes' | 'cheat_sheet' | 'workbook'
  file_url TEXT,               -- direct URL or Supabase Storage path
  file_size_bytes INTEGER,
  is_external BOOLEAN DEFAULT false, -- true = external link, false = uploaded file
  is_free BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE course_resource_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES course_resources(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],        -- SEO keywords for this resource
  seo_content TEXT,        -- keyword-rich paragraph for SEO
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource_id, language_code)
);
```

### Console
Course editor gets "Free Resources" section:
- Add resource (type selector, title, file upload or external URL)
- Per-language translations (EN + HI)
- SEO content field (keyword-rich paragraph)

### Public Page: /courses/[slug]/pdf
- Course heading + "Start Learning" button (links to /courses/[slug])
- "Free PDF Downloads" section: list of resources with download buttons
- Only shows resources that have files attached
- Keyword-rich SEO content paragraph (per language)
- FAQs section
- Related courses
- Bilingual (EN + HI)
- generateMetadata for SEO (title, description, OG)
- JSON-LD: Course + FAQPage

### SEO Keywords (per course type)
- Excel: "Excel PDF", "Excel Notes", "Excel Short Notes", "Excel Cheat Sheet", "Excel Workbook", "Excel Tutorial PDF"
- PowerPoint: "PowerPoint PDF", "PowerPoint Notes", "PowerPoint Short Notes", "PowerPoint Cheat Sheet", "PowerPoint Workbook"
- Word: "Word PDF", "Word Notes", "MS Word Cheat Sheet"
- Digital Marketing: "Digital Marketing PDF", "Digital Marketing Notes", "SEO Cheat Sheet"

---

## Part B: Training Centres Directory

### Goal
World-class directory of Skills & Training Centres. Centres can self-register, get verified by admin, then self-manage their pages (like Facebook Pages). Location-based filtering (country → state → district → city).

### Name: "Training Centres"

### URL Structure
```
/centres                        → Directory listing (search + location filter)
/centres/[slug]                 → Centre page (Facebook-style)
/centres/register               → Self-registration form
```

### DB Schema
```sql
CREATE TABLE training_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  about TEXT,
  logo_url TEXT,
  cover_url TEXT,
  status TEXT DEFAULT 'pending', -- pending | verified | rejected | suspended
  owner_id UUID REFERENCES profiles(id), -- claimed owner
  website TEXT,
  email TEXT,
  phone TEXT,
  established_year INTEGER,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE centre_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES training_centres(id) ON DELETE CASCADE,
  language_code TEXT DEFAULT 'en',
  about TEXT,
  UNIQUE(centre_id, language_code)
);

CREATE TABLE centre_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES training_centres(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  district TEXT,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  pincode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  google_maps_url TEXT,
  office_hours JSONB,        -- { "mon": "9am-6pm", "tue": "9am-6pm", ... }
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE centre_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES training_centres(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER,
  fees DECIMAL(10,2),
  mode TEXT DEFAULT 'offline', -- online | offline | hybrid
  linked_course_id UUID REFERENCES courses(id), -- link to platform course
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE centre_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES training_centres(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE centre_admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES training_centres(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  centre_course_id UUID REFERENCES centre_courses(id),
  status TEXT DEFAULT 'pending', -- pending | contacted | admitted | rejected
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  state TEXT,
  district TEXT,
  city TEXT,
  parent_id UUID REFERENCES jurisdictions(id),
  sort_order INTEGER DEFAULT 0,
  UNIQUE(country, state, district, city)
);
```

### Centre Page Design (Facebook-style)
- **Cover photo** + logo + name + verified badge
- **Horizontal menu:** Overview | Courses | Reviews | Contact
- **Overview tab:** About, location map, office hours, helpline
- **Courses tab:** Centre's course offerings (linked to platform courses)
- **Reviews tab:** Public reviews + average rating
- **Contact tab:** Address, phone, email, office hours, map
- **Online Admission:** Button → form (course selection, user info)

### Console
- `/console/centres` — list all centres (pending/verified/rejected)
- Create/edit centre manually
- Verify/reject pending registrations
- Suspend centres

### Self-Registration
- `/centres/register` — public form
- Fields: name, slug, about, address, city, state, phone, email, courses offered
- Creates centre with status='pending'
- Admin verifies → status='verified' → centre page goes live
- Owner gets 'centre_owner' role → can self-manage

### Homepage + Header + Footer
- Header: "Centres" nav link
- Homepage: "Find Training Centres Near You" section
- Footer: "Centres" under Learn section

### SEO
- Per-centre metadata (title, description, keywords)
- Sitemap includes all centre pages
- JSON-LD: EducationalOrganization + LocalBusiness
- Location-based URLs: `/centres?city=mumbai&state=maharashtra`

### Unified System
- Centre courses can link to platform courses (linked_course_id)
- Platform course pages can suggest nearby centres
- Jurisdiction system reusable for courses (future: location-based course suggestions)
- Reviews system reusable for courses (future)
