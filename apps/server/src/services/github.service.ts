import { Octokit } from '@octokit/rest';
import { upsertLog } from './log.service';

export const fetchGitHubActivity = async (
  githubUsername: string,
  accessToken: string
): Promise<Record<string, number>> => {
  const octokit = new Octokit({ auth: accessToken });

  // Get actual username first
  const userResponse = await octokit.rest.users.getAuthenticated();
  const actualUsername = userResponse.data.login;

  // GraphQL query for full year contributions
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const data: any = await octokit.graphql(query, { username: actualUsername });

  const commitsByDate: Record<string, number> = {};

  const weeks = data.user.contributionsCollection.contributionCalendar.weeks;
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > 0) {
        commitsByDate[day.date] = day.contributionCount;
      }
    }
  }

  return commitsByDate;
};

export const mapCommitsToEffortLevel = (commitCount: number): number => {
    if (commitCount >= 10) return 4
    if (commitCount >= 6) return 3
    if (commitCount >= 3) return 2
    return 1
}

export const syncUserGitHub = async (userId: string, githubUsername: string, accessToken: string, codingCategoryId: string): Promise<{ syncedDays: number }> => {
    //fetch acticity from GitHub
    const commitsByDate = await fetchGitHubActivity(githubUsername, accessToken)

    //sync each active date
    let syncedDays = 0

    for (const [date, commitCount] of Object.entries(commitsByDate)) {
        const effortLevel = mapCommitsToEffortLevel(commitCount)

        //upsert log with source github
        await upsertLog(userId, codingCategoryId, date, effortLevel, `${commitCount} commits`, 'github')
        syncedDays++
    }
    return { syncedDays }
}