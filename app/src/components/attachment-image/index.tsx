import { useState, useEffect } from "react";
import { getAttachmentDownloadUrl } from "../../services/api/attachments";
import styles from "./index.module.scss";

interface AttachmentImageProps {
  fileId: string;
  alt?: string;
  className?: string;
}

/**
 * Fetches signed download URL and renders the image. Shows placeholder while loading.
 */
export function AttachmentImage({
  fileId,
  alt = "",
  className,
}: AttachmentImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAttachmentDownloadUrl(fileId)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (error) {
    return (
      <div className={`${styles.placeholder} ${className ?? ""}`} title="加载失败">
        图
      </div>
    );
  }
  if (!url) {
    return (
      <div className={`${styles.placeholder} ${className ?? ""}`}>…</div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
