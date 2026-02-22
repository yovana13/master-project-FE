// src/services/portfolioService.ts

export async function uploadPortfolioImages(taskerId: string, files: File[]): Promise<any> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await fetch(`http://localhost:3007/users/${taskerId}/portfolio`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload portfolio images');
  return response.json();
}

export async function getPortfolioImages(taskerId: string): Promise<string[]> {
  const response = await fetch(`http://localhost:3007/users/${taskerId}/portfolio`);
  if (!response.ok) throw new Error('Failed to fetch portfolio images');
  const data = await response.json();
  return data.portfolioImages ?? [];
}

export async function deletePortfolioImages(taskerId: string, imageUrls: string[]): Promise<any> {
  const response = await fetch(`http://localhost:3007/users/${taskerId}/portfolio`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrls }),
  });
  if (!response.ok) throw new Error('Failed to delete portfolio images');
  return response.json();
}
