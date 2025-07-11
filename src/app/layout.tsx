import { Footer, Layout, Link, Navbar } from 'nextra-theme-docs';
import { Banner, Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import 'nextra-theme-docs/style.css';
import { ThemeToggle } from './components/theme-switch';
import { LastUpdated } from './components/last-updated';

export const metadata: Metadata = {
  title: "Kevin's 的文档",
  description: "Kevin's 的知识文档",
};

// const banner = <Banner storageKey="some-key">Nextra 4.0 is released 🎉</Banner>;
const footer = <Footer>MIT {new Date().getFullYear()} © Kevin.</Footer>;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          // banner={banner}
          navbar={
            <Navbar
              logo={<h1 className="text-2xl"> {metadata.title?.toString()}</h1>}
              projectLink="https://github.com/vkkevin/docs"
            >
              <ThemeToggle lite={true} />
            </Navbar>
          }
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/vkkevin/docs/tree/content"
          sidebar={{ defaultMenuCollapseLevel: 1, autoCollapse: true }}
          footer={footer}
          lastUpdated={<LastUpdated />}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}