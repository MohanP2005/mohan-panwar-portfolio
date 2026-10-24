// lib/mail.ts

export function buildMailto(email: string, subject: string, body: string): string {
    // Encode the email address, but keep the "@" symbol readable
    const encodedEmail = encodeURIComponent(email).replace(/%40/g, '@');

    // Encode subject as‑is
    const encodedSubject = encodeURIComponent(subject);

    // Encode body and convert LF line breaks to CRLF for mail clients
    const encodedBody = encodeURIComponent(body).replace(/%0A/g, '%0D%0A');

    return `mailto:${encodedEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}
