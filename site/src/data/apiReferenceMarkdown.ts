import { apiReferenceGroups } from './apiReference';

type ApiLocale = 'ko' | 'en';

const englishGroupLabels: Record<string, string> = {
  core: 'Core component types',
  data: 'Data and events',
  query: 'Sort, filter, and toolbox',
  selection: 'Selection and editing',
  layout: 'Layout and display',
  reorder: 'Reordering',
  pivot: 'Pivot',
};

const escapeTableCell = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', '<br>');

export function renderApiReferenceMarkdown(locale: ApiLocale) {
  const isEnglish = locale === 'en';
  const canonicalPath = isEnglish ? '/en/api/props' : '/api/props';
  const sections = apiReferenceGroups.map(group => {
    const entries = group.entries.map(entry => {
      const summary = isEnglish
        ? `Public ${entry.kind} used by BeautifulGrid configuration or callbacks. The declaration below is generated from the library source.`
        : entry.summary;
      const members = entry.members.length
        ? `\n| Member | Type | Required | Deprecated | Description |\n| --- | --- | --- | --- | --- |\n${entry.members
            .map(member =>
              `| \`${escapeTableCell(member.name)}\` | \`${escapeTableCell(member.type)}\` | ${member.required ? 'yes' : 'no'} | ${member.deprecated ? 'yes' : 'no'} | ${escapeTableCell(isEnglish ? `Contract for ${member.name}; use the exact type shown in this row.` : member.description)} |`,
            )
            .join('\n')}\n`
        : '';

      return `### ${entry.name}\n\n${summary}\n\nSource: https://github.com/axisj/beautiful-grid/blob/main/beautiful-grid/types.ts#L${entry.sourceLine}\n\n\`\`\`ts\n${entry.declaration}\n\`\`\`\n${members}`;
    });

    return `## ${isEnglish ? englishGroupLabels[group.id] ?? group.label : group.label}\n\n${entries.join('\n\n')}`;
  });

  return `# BeautifulGrid TypeScript API Reference\n\n> ${
    isEnglish
      ? 'Machine-readable public interfaces, types, enums, and members generated from beautiful-grid/types.ts.'
      : 'beautiful-grid/types.ts에서 생성한 공개 인터페이스, 타입, enum 및 멤버의 기계 판독용 참조입니다.'
  }\n\nSource page: https://bgrid.axisj.com${canonicalPath}\n\nThe TypeScript source is the final authority when this document and an installed package version differ. Internal Zustand store and rendering-only types are intentionally excluded.\n\n${sections.join('\n\n')}\n`;
}
