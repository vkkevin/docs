import nextra from 'nextra'
 
const withNextra = nextra({
  defaultShowCopyCode: true,
  search: { codeblocks: false },
})

const nextConfig = withNextra({
  output: 'export',
  basePath: process.env.DOCS_BASE_PATH,
  reactStrictMode: true,
  devIndicators: false
});

export default nextConfig;
