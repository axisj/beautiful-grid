import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const readRepositoryFile = (path: string) => readFileSync(resolve(repositoryRoot, path), 'utf8');

describe('self-hosted site deployment contracts', () => {
  it('uses the selected public domain across site and deployment sources', () => {
    const domainSources = [
      'site/astro.config.mjs',
      'site/public/robots.txt',
      'site/src/data/productFacts.ts',
      'site/src/data/aiContext.ts',
      'site/src/layouts/DemoOnlyLayout.astro',
      'site/src/layouts/Layout.astro',
      'site/src/layouts/LegacyRedirectLayout.astro',
      'deploy/edge/Caddyfile.fragment',
      'scripts/deploy-local-production.sh',
    ];

    for (const path of domainSources) {
      const source = readRepositoryFile(path);
      expect(source, path).toContain('bgrid.axisj.com');
      expect(source, path).not.toContain(['datagrid', 'axboot', 'com'].join('.'));
    }
  });

  it('keeps the Compose service, edge alias, and readiness checks aligned', () => {
    const compose = readRepositoryFile('docker-compose.prod.yml');
    const edge = readRepositoryFile('deploy/edge/Caddyfile.fragment');
    const deployment = readRepositoryFile('scripts/deploy-local-production.sh');

    expect(compose).toContain('beautiful-grid-site');
    expect(compose).toContain('platform: linux/amd64');
    expect(compose).toContain('127.0.0.1:7195:80');
    expect(compose).toContain('name: axstaff_default');
    expect(edge).toContain('reverse_proxy beautiful-grid-site:80');
    expect(deployment).toContain('http://127.0.0.1:7195/health');
    expect(deployment).toContain('http://beautiful-grid-site/health');
    expect(deployment).toContain('axboot-datagrid-site-1');
    expect(deployment).toContain('docker start "$legacy_container"');
    expect(deployment).toContain('docker rm "$legacy_container"');
  });

  it('only permits manual production deployment from main', () => {
    const workflow = readRepositoryFile('.github/workflows/deploy-website.yml');
    const dockerfile = readRepositoryFile('deploy/site/Dockerfile');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
    expect(workflow).toContain('runs-on: [self-hosted, macOS, ARM64]');
    expect(workflow).toContain('timeout-minutes: 20');
    expect(workflow).toContain('--platform linux/amd64');
    expect(workflow).toContain('pull_base_image node:22.22.3-alpine');
    expect(dockerfile).toContain('FROM node:22.22.3-alpine AS builder');
    expect(workflow).not.toMatch(/push:\s*\n/);
  });

  it('adds the shared edge route with validation and restores it on deployment failure', () => {
    const workflow = readRepositoryFile('.github/workflows/deploy-website.yml');

    expect(workflow).toContain('Caddyfile.before-beautiful-grid');
    expect(workflow).toContain('# BEGIN BEAUTIFUL-GRID');
    expect(workflow).toContain('caddy validate');
    expect(workflow).toContain('caddy reload');
    expect(workflow).toContain('Restore new edge route after failed deployment');
    expect(workflow).toContain('if: ${{ failure() }}');
    expect(workflow).toContain('cp -p "$backup" "$caddyfile"');
  });

  it('serves generated Markdown routes with a Markdown MIME type', () => {
    const nginxConfig = readRepositoryFile('deploy/site/nginx.conf');

    expect(nginxConfig).toMatch(
      /location ~ \\\.md\$ \{[\s\S]*?default_type text\/markdown;/,
    );
    expect(nginxConfig).toContain('text/markdown');
  });
});
