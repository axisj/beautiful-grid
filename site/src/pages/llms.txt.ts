import type { APIRoute } from 'astro';
import { productFacts } from '../data/productFacts';

export const GET: APIRoute = async () => {
  const content = `# BeautifulGrid

${productFacts.summary.en}

## Start here

- [Runtime and compatibility](https://bgrid.axisj.com/product-facts)
- [Getting started](${productFacts.documentationUrl}/getting-started)
- [Learn and feature demos](${productFacts.demoUrl})
- [TypeScript API](https://bgrid.axisj.com/api/props)
- [GitHub](${productFacts.repositoryUrl})
- [npm](${productFacts.npmUrl})
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};
