import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { renderRichHash } from "./utils";
import { createContext } from "preact";

type GetImageFunction = (hash: string) => Promise<string>;

type GetPreviewFunction = (hash: string) => string;

class ImageProcessor {
  private cachedImages = new Map<string, Promise<string>>();
  private cachedPreviews = new Map<string, string>();

  constructor(private fetchImage: (hash: string) => Promise<string>) {}

  getImage: GetImageFunction = (hash: string) => {
    const cachedImage = this.cachedImages.get(hash);
    if (cachedImage !== undefined) {
      return cachedImage;
    }

    const fetchPromise = this.fetchImage(hash);
    this.cachedImages.set(hash, fetchPromise);

    return fetchPromise;
  };

  getPreview: GetPreviewFunction = (hash: string) => {
    const cachedPreview = this.cachedPreviews.get(hash);
    if (cachedPreview !== undefined) {
      return cachedPreview;
    }

    const preview = renderRichHash(hash);
    this.cachedPreviews.set(hash, preview);
    return preview;
  };
}

export const ImageContext = createContext<{
  getImage: GetImageFunction;
  getPreview: GetPreviewFunction;
} | null>(null);

export function ImageProvider({
  fetchImage,
  children,
}: {
  fetchImage: (hash: string) => Promise<string>;
  children: preact.ComponentChildren;
}) {
  const processorRef = useRef(new ImageProcessor(fetchImage));
  const getImage = useCallback<GetImageFunction>((...args) => {
    return processorRef.current.getImage(...args);
  }, []);

  const getPreview = useCallback<GetPreviewFunction>((...args) => {
    return processorRef.current.getPreview(...args);
  }, []);

  return (
    <ImageContext.Provider value={{ getImage, getPreview }}>
      {children}
    </ImageContext.Provider>
  );
}

const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImageContext must be used within an ImageProvider");
  }

  return context;
};

export function IconRenderer({ imgHash }: { imgHash: string }) {
  const [img, setImg] = useState<string>();
  const { getImage, getPreview } = useImageContext();

  const previewImg = useMemo(() => getPreview(imgHash), [imgHash, getPreview]);

  // Load the image from the context
  useEffect(() => {
    getImage(imgHash)
      .then((image) => {
        setImg(image);
      })
      .catch((err) => {
        console.error("Error fetching image for hash:", err);
      });
  }, [imgHash, getImage]);

  const src = img ?? previewImg;

  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt="Game Icon"
      className={`w-full h-full object-contain [transition: filter 1s ease-in-out] ${!img ? "filter-[blur(4px)]" : ""}`}
    />
  );
}
