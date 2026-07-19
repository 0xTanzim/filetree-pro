import manifest from '../../../package.json';

describe('FileTree Pro configuration defaults', () => {
  test('publishes a default max depth of 15 levels', () => {
    const maxDepth = manifest.contributes.configuration.properties['filetree-pro.maxDepth'];

    expect(maxDepth.default).toBe(15);
  });
});
