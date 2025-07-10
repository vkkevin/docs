import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '@/mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

// export const generateStaticParams = async () => {
//   const params = await generateStaticParamsFor('mdxPath');
//   const mdParams = params.filter(param => {
//     const last = param.mdxPath[param.mdxPath.length - 1] || '';
//     return last.endsWith('.md') || last.endsWith('.mdx');
//   });
//   console.log("mdParams: ", mdParams);
//   return mdParams;
// }

type PageProps = Readonly<{
  params: Promise<{
    mdxPath: string[]
  }>
}>

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  console.log("generateMetadata: ", params.mdxPath)
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props: PageProps) {
  const params = await props.params
  console.log("Page: ", params.mdxPath)
  const result = await importPage(params.mdxPath)
  const { default: MDXContent, toc, metadata } = result
  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}