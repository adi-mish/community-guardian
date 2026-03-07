import { z } from 'zod'

export const ReportCategorySchema = z.enum([
  'Scam / phishing',
  'Local physical safety',
  'Home / network security',
])

export type ReportCategory = z.infer<typeof ReportCategorySchema>

export const NeighborhoodSchema = z.enum([
  'Downtown',
  'Riverside',
  'Maplewood',
  'Northgate',
  'Oak Hill',
  'Lakeside',
  'South Park',
  'Eastwood',
])

export type Neighborhood = z.infer<typeof NeighborhoodSchema>

export const SeveritySchema = z.enum(['low', 'medium', 'high'])
export type Severity = z.infer<typeof SeveritySchema>

export const VerificationStatusSchema = z.enum(['unverified', 'verified', 'resolved'])
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>

export const SummaryModeSchema = z.enum(['ai', 'fallback'])
export type SummaryMode = z.infer<typeof SummaryModeSchema>

const IsoDateTimeSchema = z
  .string()
  .datetime()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid timestamp.' })

export const ReportSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required.').max(120),
  raw_description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(4000),
  category: ReportCategorySchema,
  neighborhood: NeighborhoodSchema,
  severity: SeveritySchema,
  verification_status: VerificationStatusSchema,
  created_at: IsoDateTimeSchema,
  source_label: z.string().trim().min(1).max(80),
  tags: z.array(z.string().trim().min(1)).max(12),
  recommended_checklist: z.array(z.string().trim().min(1)).min(1).max(8),
  ai_summary: z.string().trim().min(1).max(600),
  summary_mode: SummaryModeSchema,
})

export type Report = z.infer<typeof ReportSchema>

export const ReportFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120),
  raw_description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(4000),
  category: ReportCategorySchema,
  neighborhood: NeighborhoodSchema,
  severity: SeveritySchema,
  verification_status: VerificationStatusSchema,
  source_label: z.string().trim().min(1, 'Source label is required.').max(80),
  tags_text: z.string().trim().max(200).optional().default(''),
})

export type ReportFormValues = z.infer<typeof ReportFormSchema>

export const DigestConfidenceSchema = z.enum(['Low', 'Medium', 'High'])
export type DigestConfidence = z.infer<typeof DigestConfidenceSchema>

export const DigestSchema = z.object({
  selected_report_ids: z.array(z.string().min(1)).min(1),
  digest_title: z.string().trim().min(1).max(120),
  digest_summary: z.string().trim().min(1).max(1200),
  key_risks: z.array(z.string().trim().min(1)).min(1).max(8),
  action_checklist: z.array(z.string().trim().min(1)).length(3),
  confidence_label: DigestConfidenceSchema,
  generated_at: IsoDateTimeSchema,
  mode: SummaryModeSchema,
  notes: z.string().trim().min(1).max(1200),
})

export type Digest = z.infer<typeof DigestSchema>

export const DigestRequestSchema = z.object({
  reports: z.array(ReportSchema).min(1, 'Select at least one report to generate a digest.'),
})

export type DigestRequest = z.infer<typeof DigestRequestSchema>

export const AiDigestOutputSchema = z.object({
  digest_title: z.string().trim().min(1).max(120),
  digest_summary: z.string().trim().min(1).max(1200),
  key_risks: z.array(z.string().trim().min(1)).min(1).max(8),
  action_checklist: z.array(z.string().trim().min(1)).length(3),
  confidence_label: DigestConfidenceSchema,
  notes: z.string().trim().min(1).max(1200),
})

export type AiDigestOutput = z.infer<typeof AiDigestOutputSchema>

export function parseTags(tagsText: string): string[] {
  const tags = tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  const unique = Array.from(new Set(tags.map((tag) => tag.toLowerCase())))
  return unique.slice(0, 12)
}

