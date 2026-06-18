import axios from 'axios';
import { AppError } from '../utils/AppError';

export class LeetCodeService {
  /**
   * Fetches the user's public profile directly from the GraphQL API 
   * to get the 'aboutMe' (bio) section for verification.
   */
  static async getUserBio(username: string): Promise<string> {
    try {
      const query = `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            profile {
              aboutMe
            }
          }
        }
      `;

      const response = await axios.post(
        'https://leetcode.com/graphql',
        {
          query,
          variables: { username }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        }
      );

      const matchedUser = response.data?.data?.matchedUser;
      
      if (!matchedUser) {
        throw new AppError(`LeetCode user '${username}' not found.`, 404);
      }

      return matchedUser.profile?.aboutMe || '';
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch data from LeetCode. They might be rate-limiting requests.', 500);
    }
  }
}
