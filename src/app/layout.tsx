import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/styles/index.css';
import { ThemeToggle } from './components/theme-switch';
import { LastUpdated } from './components/last-updated';

export const metadata: Metadata = {
  title: "Kevin's 的文档",
  description: "Kevin's 的知识文档",
  authors: [{ name: "Kevin", url: "https://vkkevin.github.io/docs" }],
  keywords: [ "Kevin", "Knowledge", "Docs", "Blog", "知识", "文档", "博客" ],
  // robots: { index: true, follow: true },
};

// const banner = <Banner storageKey="some-key">Nextra 4.0 is released 🎉</Banner>;
const footer = <Footer>MIT {new Date().getFullYear()} © Kevin.</Footer>;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          // banner={banner}
          navbar={
            <Navbar
              align='left'
              logo={
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path strokeWidth="1.5" stroke="currentColor" fill="none" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                  <span style={{ marginLeft: '.4em', fontWeight: 800 }}>
                    {metadata.title?.toString()}
                  </span>
                </>
              }
              projectLink="https://github.com/vkkevin/docs"
            >
              <ThemeToggle lite={true} />
            </Navbar>
          }
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/vkkevin/docs/tree"
          sidebar={{ defaultMenuCollapseLevel: 1, autoCollapse: true }}
          lastUpdated={<LastUpdated locale='zh'>最近更新于</LastUpdated>}
          themeSwitch={{
            dark: "深色模式",
            light: "浅色模式",
            system: "跟随系统",
          }}
          editLink="编辑该页面"
          feedback={{
            content: "页面有问题？点击反馈",
            labels: "反馈",
          }}
          toc={{
            title: "目录",
            backToTop: "回到顶部",
          }}
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}