import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '@/mdx-components'
import { getLastCommitTimestamp } from '@/app/utils/content-timestamp';
import { notFound } from 'next/navigation';

export const generateStaticParams = generateStaticParamsFor('mdxPath')

type PageProps = Readonly<{
  params: Promise<{
    mdxPath: string[]
  }>
}>

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  if (!metadata) {
    notFound();
  }
  if (process.env.NODE_ENV == "production") {
    const timestamp = await getLastCommitTimestamp(metadata.filePath);
    if (timestamp) {
      metadata.timestamp = timestamp;
    }
  }
  return metadata
}

const Wrapper = getMDXComponents({}).wrapper

export default async function Page(props: PageProps) {
  const params = await props.params
  const pageData = await importPage(params.mdxPath)
  if (!pageData) {
    notFound();
  }
  const { default: MDXContent, toc, metadata, sourceCode } = pageData
  if (process.env.NODE_ENV == "production") {
    const timestamp = await getLastCommitTimestamp(metadata.filePath);
    if (timestamp) {
      metadata.timestamp = timestamp;
    }
  }
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}