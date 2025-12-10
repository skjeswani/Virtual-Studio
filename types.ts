export interface Product {
  name: string;
  imageUrls: string[];
  details: string;
}

export interface GeneratedImage {
  prompt: string;
  imageData: string; // base64 string
}

export interface BaseImage {
  base64: string;
  mimeType: string;
  url: string; // The object URL for display
}

// FIX: Add missing GeneratedVideo interface.
export interface GeneratedVideo {
  prompt: string;
  videoUri: string;
}

// FIX: Add missing GoogleUser interface.
export interface GoogleUser {
  id: string;
  name: string;
  givenName: string;
  familyName: string;
  imageUrl: string;
  email: string;
}

export interface UserCatalogItem {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
}
