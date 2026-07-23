export function truncateProfileContext(profileData: any): string {
  if (!profileData) return "{}";
  
  // Clone to avoid mutating original
  const truncated = JSON.parse(JSON.stringify(profileData));
  
  // Limit to most recent 3 jobs
  if (truncated.experience && Array.isArray(truncated.experience)) {
    truncated.experience = truncated.experience.slice(0, 3);
  }
  
  // Limit to most recent 5 projects
  if (truncated.projects && Array.isArray(truncated.projects)) {
    truncated.projects = truncated.projects.slice(0, 5);
  }

  // Cap skills to top 15
  if (truncated.skills && Array.isArray(truncated.skills)) {
    truncated.skills = truncated.skills.slice(0, 15);
  }

  return JSON.stringify(truncated);
}
