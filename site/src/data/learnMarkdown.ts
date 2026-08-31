interface LearnMarkdownEntry {
  body?: string;
  data: {
    title: string;
    description: string;
    canonicalPath: string;
    features: string[];
    relatedGuides: string[];
    relatedApi: string[];
    lastReviewedAt: string;
  };
}

export function renderLearnMarkdown(entry: LearnMarkdownEntry) {
  const { data } = entry;
  const machineReadableBody = (entry.body ?? '')
    .replace(/\]\((\/(?:en\/)?learn\/[^)#?]+)(#[^)]+)?\)/g, (_match, route: string, hash = '') =>
      `](${route.endsWith('.md') ? route : `${route}.md`}${hash})`,
    )
    .replace(/\]\((\/(?:en\/)?api\/props)(#[^)]+)?\)/g, (_match, route: string, hash = '') =>
      `](${route}.md${hash})`,
    );
  const metadata = [
    `Source page: https://bgrid.axisj.com${data.canonicalPath}`,
    `Last reviewed: ${data.lastReviewedAt}`,
    data.features.length ? `Topics: ${data.features.join(', ')}` : '',
    data.relatedGuides.length ? `Related guides: ${data.relatedGuides.join(', ')}` : '',
    data.relatedApi.length ? `Related API: ${data.relatedApi.join(', ')}` : '',
  ].filter(Boolean);

  return `# ${data.title}\n\n> ${data.description}\n\n${metadata.join('\n')}\n\n${machineReadableBody.trim()}\n`;
}

export function markdownResponse(content: string) {
  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
