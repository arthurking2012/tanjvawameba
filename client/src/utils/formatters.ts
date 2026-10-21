/**
 * Format bytes to human readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format relative time in Georgian language
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'ახლახანს';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} წუთის წინ`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} საათის წინ`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'გუშინ';
  }
  if (diffInDays < 30) {
    return `${diffInDays} დღის წინ`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} თვის წინ`;
  }
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} წლის წინ`;
}

/**
 * Format full date in Georgian
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
  ];
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Extract clean file extension
 */
export function getFileExtension(filename: string): string {
  if (!filename) return 'FILE';
  const parts = filename.split('.');
  if (parts.length <= 1) return 'FILE';
  return parts.pop()?.toUpperCase() || 'FILE';
}

/**
 * Get category display name in Georgian
 */
export function getCategoryName(category: string): string {
  switch (category) {
    case 'image':
      return 'სურათი';
    case 'video':
      return 'ვიდეო';
    case 'audio':
      return 'აუდიო';
    case 'document':
      return 'დოკუმენტი';
    case 'archive':
      return 'არქივი';
    default:
      return 'ფაილი';
  }
}

/**
 * Build share URL for a file
 */
export function getShareUrl(fileId: string): string {
  const origin = window.location.origin;
  return `${origin}/?file=${fileId}`;
}

/**
 * Build direct download API URL
 */
export function getDownloadUrl(fileId: string): string {
  return `/api/files/${fileId}/download`;
}
