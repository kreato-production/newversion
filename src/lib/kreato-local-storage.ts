export function clearKreatoLocalStorage(): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('kreato_')) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  console.log(`Cleared ${keysToRemove.length} localStorage items for security`);
}
