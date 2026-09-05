import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_TYPES,
  type EmailTemplate,
  type NotifyType,
} from "@/lib/email-templates";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { getSetting, setSetting } from "@/lib/db";

function validTemplate(value: unknown): value is EmailTemplate {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.subject === "string" && typeof candidate.html === "string";
}

export function getEmailTemplates(): Record<NotifyType, EmailTemplate> {
  const templates = { ...DEFAULT_EMAIL_TEMPLATES };
  for (const type of EMAIL_TEMPLATE_TYPES) {
    const raw = getSetting(EMAIL_TEMPLATE_KEYS[type]);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validTemplate(parsed)) {
        templates[type] = {
          subject: parsed.subject,
          // Sanitize on read too: rows saved before sanitization existed
          // must not reach inboxes raw.
          html: sanitizeRichHtml(parsed.html),
        };
      }
    } catch {
      // Fall back to the built-in template.
    }
  }
  return templates;
}

export function setEmailTemplate(type: NotifyType, template: EmailTemplate) {
  setSetting(EMAIL_TEMPLATE_KEYS[type], JSON.stringify(template));
}
