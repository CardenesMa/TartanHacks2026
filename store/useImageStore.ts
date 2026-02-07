import { create } from 'zustand';

interface ImageStore {
    imageData: string | null;
    setImageData: (data: string | null) => void;
}

export const useImageStore = create<ImageStore>((set) => ({
    imageData: null,
    setImageData: (data) => set({ imageData: data }),
}));
