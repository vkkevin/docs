import nextra from 'nextra';
 
const withNextra = nextra({
  defaultShowCopyCode: true,
  codeHighlight: true,
  mdxOptions: {
    format: 'mdx'
  },
  search: { codeblocks: false },
  latex: true,
})

const nextConfig = withNextra({
  output: 'export',
  basePath: process.env.DOCS_BASE_PATH,
  reactStrictMode: true,
  devIndicators: false,
  images: {
    unoptimized: true,
  }
});

export default nextConfig;
