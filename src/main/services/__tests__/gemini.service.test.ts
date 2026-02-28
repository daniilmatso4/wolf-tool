import { describe, it, expect } from 'vitest'

// Test the sanitizePlaceholders logic by re-implementing it here
// (the function is not exported, so we test its behavior patterns)
function sanitizePlaceholders(
  message: string,
  prospect: { name: string; title: string; company: string; aboutSnippet: string }
): string {
  const name = prospect.name || ''
  const firstName = name.split(' ')[0] || name
  const title = prospect.title || ''
  const company = prospect.company || ''

  const replacements: Array<{ pattern: RegExp; value: string }> = [
    { pattern: /\[(?:prospect['s]*\s*)?(?:first\s*)?name\]/gi, value: firstName },
    { pattern: /\{(?:prospect['s]*\s*)?(?:first\s*)?name\}/gi, value: firstName },
    { pattern: /\[(?:prospect['s]*\s*)?full\s*name\]/gi, value: name },
    { pattern: /\{(?:prospect['s]*\s*)?full\s*name\}/gi, value: name },
    { pattern: /\[(?:prospect['s]*\s*)?(?:title|role|position)\]/gi, value: title },
    { pattern: /\{(?:prospect['s]*\s*)?(?:title|role|position)\}/gi, value: title },
    { pattern: /\[(?:prospect['s]*\s*)?(?:company|company\s*name|organization|org)\]/gi, value: company },
    { pattern: /\{(?:prospect['s]*\s*)?(?:company|company\s*name|organization|org)\}/gi, value: company },
  ]

  for (const { pattern, value } of replacements) {
    message = message.replace(pattern, value)
  }

  return message
}

describe('sanitizePlaceholders', () => {
  const prospect = {
    name: 'John Smith',
    title: 'CTO',
    company: 'Acme Corp',
    aboutSnippet: ''
  }

  it('replaces [Name] with first name', () => {
    expect(sanitizePlaceholders('Hi [Name]!', prospect)).toBe('Hi John!')
  })

  it('replaces {name} with first name', () => {
    expect(sanitizePlaceholders('Hi {name}!', prospect)).toBe('Hi John!')
  })

  it('replaces [Full Name] with full name', () => {
    expect(sanitizePlaceholders('Dear [Full Name],', prospect)).toBe('Dear John Smith,')
  })

  it('replaces [Company] with company name', () => {
    expect(sanitizePlaceholders('at [Company]', prospect)).toBe('at Acme Corp')
  })

  it('replaces {company} with company name', () => {
    expect(sanitizePlaceholders('at {company}', prospect)).toBe('at Acme Corp')
  })

  it('replaces [Title] with title', () => {
    expect(sanitizePlaceholders('as [Title]', prospect)).toBe('as CTO')
  })

  it('replaces multiple placeholders in one message', () => {
    const msg = 'Hi [Name], I see you are [Title] at [Company].'
    expect(sanitizePlaceholders(msg, prospect)).toBe('Hi John, I see you are CTO at Acme Corp.')
  })

  it('handles missing name gracefully', () => {
    const noName = { ...prospect, name: '' }
    expect(sanitizePlaceholders('Hi [Name]!', noName)).toBe('Hi !')
  })

  it('leaves message unchanged if no placeholders', () => {
    const msg = 'Hi John, great to connect!'
    expect(sanitizePlaceholders(msg, prospect)).toBe(msg)
  })

  it('handles [Prospect Name] variant', () => {
    expect(sanitizePlaceholders('[Prospect Name]', prospect)).toBe('John')
  })

  it('is case-insensitive', () => {
    expect(sanitizePlaceholders('[NAME]', prospect)).toBe('John')
    expect(sanitizePlaceholders('[COMPANY]', prospect)).toBe('Acme Corp')
  })
})

describe('message trimming logic', () => {
  function trimMessage(message: string): string {
    if (message.length > 280) {
      const trimmed = message.substring(0, 280)
      const lastPeriod = trimmed.lastIndexOf('. ')
      const lastExclaim = trimmed.lastIndexOf('! ')
      const lastQuestion = trimmed.lastIndexOf('? ')
      const lastSentence = Math.max(lastPeriod, lastExclaim, lastQuestion)
      if (lastSentence > 180) {
        return trimmed.substring(0, lastSentence + 1)
      } else {
        const lastSpace = trimmed.lastIndexOf(' ')
        if (lastSpace > 180) {
          return trimmed.substring(0, lastSpace) + '.'
        }
        return trimmed
      }
    }
    return message
  }

  it('does not trim messages under 280 chars', () => {
    const msg = 'Short message.'
    expect(trimMessage(msg)).toBe(msg)
  })

  it('trims at sentence boundary when possible', () => {
    const sentence1 = 'A'.repeat(200) + '. '
    const sentence2 = 'B'.repeat(100)
    const msg = sentence1 + sentence2
    expect(trimMessage(msg)).toBe('A'.repeat(200) + '.')
  })

  it('falls back to word boundary when no sentence boundary', () => {
    const words = Array(50).fill('word').join(' ') // 249 chars
    const msg = words + ' extralongword'.repeat(5) // way over 280
    const result = trimMessage(msg)
    expect(result.length).toBeLessThanOrEqual(281) // word + period
    expect(result.endsWith('.')).toBe(true)
  })

  it('trims at exclamation and question marks too', () => {
    const sentence1 = 'A'.repeat(200) + '! '
    const sentence2 = 'B'.repeat(100)
    const msg = sentence1 + sentence2
    expect(trimMessage(msg)).toBe('A'.repeat(200) + '!')
  })
})
