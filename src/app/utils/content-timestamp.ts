import { simpleGit, SimpleGit } from 'simple-git';
import path from 'path';

export async function getLastCommitTimestamp(filePath: string): Promise<number | null> {
  const contentDir = path.join(process.cwd(), 'content');
  const absolutePath = path.join(process.cwd(), filePath);

  const git: SimpleGit = simpleGit({ baseDir: contentDir });
  var relativePath: string
  if (filePath.startsWith('content' + path.sep)) {
    relativePath = '.' + filePath.replace('content', '');
  } else {
    relativePath = '.' + absolutePath.replace(contentDir, '');
  }
  try {
    const log = await git.log({ file: relativePath, maxCount: 1 });
    if (log.latest) {
      console.log("> relativePath: ", relativePath, "date: ", log.latest.date, "timestamp: ", new Date(log.latest.date).getTime());
      return new Date(log.latest.date).getTime();
    }
    console.error('Failed to get last commit timestamp');
    return null;
  } catch (error) {
    console.error('Failed to get last commit timestamp:', error);
    return null;
  }
}