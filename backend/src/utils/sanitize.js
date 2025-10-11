import sanitizeHtml from 'sanitize-html';

export const sanitizeText = (text) =>
  sanitizeHtml(text ?? '', {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
