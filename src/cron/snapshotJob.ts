import cron from 'node-cron';
import axios from 'axios';
import { User } from '../models/User';
import { Snapshot } from '../models/Snapshot';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const fetchUserStats = async (username: string) => {
  try {
    const [profile, solved, contest] = await Promise.all([
      axios.get(`https://alfa-leetcode-api.onrender.com/${username}`).then(r => r.data).catch(() => ({})),
      axios.get(`https://alfa-leetcode-api.onrender.com/${username}/solved`).then(r => r.data).catch(() => ({})),
      axios.get(`https://alfa-leetcode-api.onrender.com/${username}/contest`).then(r => r.data).catch(() => ({}))
    ]);

    return { profile, solved, contest };
  } catch (error) {
    console.error(`Failed to fetch stats for ${username}`, error);
    return null;
  }
};

export const startSnapshotCron = () => {
  // Run every 24 hours at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Starting daily snapshot job...');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    try {
      // Find all verified users
      const users = await User.find({ isVerified: true, leetcodeUsername: { $exists: true } });

      for (const user of users) {
        // Skip if snapshot already exists for today
        const existingSnapshot = await Snapshot.findOne({ user: user._id, date: today });
        if (existingSnapshot) continue;

        if (!user.leetcodeUsername) continue;

        const data = await fetchUserStats(user.leetcodeUsername);
        if (!data || !data.profile || data.profile.errors) {
          console.log(`Skipping snapshot for ${user.leetcodeUsername} due to API failure.`);
          continue;
        }

        const { solved, contest } = data;

        await Snapshot.create({
          user: user._id,
          date: today,
          contestRating: Math.round(contest?.contestRating || 0),
          problemsSolved: {
            total: solved?.solvedProblem || 0,
            easy: solved?.easySolved || 0,
            medium: solved?.mediumSolved || 0,
            hard: solved?.hardSolved || 0,
          },
          acceptanceRate: 0, // Placeholder
          currentStreak: 0, // Need GraphQL contribution calendar for this
          longestStreak: 0,
          topicStatistics: [],
          aiProfileScore: 0, // Will be updated by AI Analytics pipeline
          growthScore: 0,
          consistencyScore: 0,
        });

        // Sleep to respect API rate limits
        await delay(2000);
      }

      console.log('Daily snapshot job completed successfully.');
    } catch (error) {
      console.error('Error during daily snapshot job:', error);
    }
  });
};
