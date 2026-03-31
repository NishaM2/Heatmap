import { Octokit } from '@octokit/rest';
import { upsertLog } from './log.service';

export const fetchGitHubActivity = async (githubUsername: string, accessToken: string): Promise<Record<string, number>> => {
    //create Octokit instance with the user's token
    const octokit = new Octokit({
        auth: accessToken
    })

    const userResponse = await octokit.rest.users.getAuthenticated()
    const actualUsername = userResponse.data.login

    //fetch events from GitHub API
    const response = await octokit.rest.activity.listEventsForAuthenticatedUser({
        username: actualUsername,
        per_page: 100
    })

    //group commit counts by date
    const commitsByDate: Record<string, number> = {}
    for (const event of response.data) {
        //only care about push events
        if (event.type !== 'PushEvent') continue

        //extract date from created_at (remove time part)
        const date = event.created_at!.split('T')[0]
        // "2026-03-20T10:30:00Z"  "2026-03-20"

        // Count commits in this push event
        const payload = event.payload as any
        const commitCount = payload.commits?.length || 0

        // Add to existing count for that date
        commitsByDate[date] = (commitsByDate[date] || 0) + commitCount
    }
    return commitsByDate
}

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