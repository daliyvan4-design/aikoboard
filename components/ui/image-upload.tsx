"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X, Link2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspect?: "square" | "cover";
  label?: string;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "events",
  aspect = "square",
  label,
  placeholder = "Glissez votre image ou cliquez",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        onChange(data.url);
      } else {
        setError(data.error ?? "Erreur upload");
      }
    } catch {
      setError("Erreur réseau");
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (value) {
    return (
      <div className="relative">
        {label && (
          <p className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
            {label}
          </p>
        )}
        <div
          className={`relative rounded-2xl overflow-hidden border border-line ${
            aspect === "cover" ? "aspect-[3/1]" : "w-32 h-32"
          }`}
        >
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 bg-ink/70 text-cream rounded-full flex items-center justify-center hover:bg-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleUrlSubmit = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setError("URL invalide");
      return;
    }
    onChange(trimmed);
    setUrlValue("");
    setShowUrlInput(false);
    setError("");
  };

  return (
    <div>
      {label && (
        <p className="block text-[12px] font-medium text-ink mb-2 uppercase tracking-wider">
          {label}
        </p>
      )}

      {showUrlInput ? (
        <div className="border-2 border-dashed border-gold/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gold flex-shrink-0" />
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              placeholder="https://..."
              autoFocus
              className="flex-1 bg-white border border-line rounded-lg px-3 py-2 text-[12px] outline-none focus:border-gold/50"
            />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowUrlInput(false); setUrlValue(""); setError(""); }}
              className="text-[11px] text-mute hover:text-ink px-2 py-1"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="text-[11px] bg-gold hover:bg-gold2 text-ink rounded-lg px-3 py-1 font-medium"
            >
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed border-line rounded-2xl text-center hover:border-gold/30 transition-colors cursor-pointer ${
            aspect === "cover" ? "p-6" : "p-8"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-gold mx-auto animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-mute mx-auto mb-3" />
              <p className="text-[13px] text-mute">{placeholder}</p>
              <p className="text-[11px] text-mute/60 mt-1">JPG, PNG, WebP — max 5 Mo</p>
            </>
          )}
        </div>
      )}

      {!showUrlInput && !uploading && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowUrlInput(true); setError(""); }}
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-mute hover:text-gold transition-colors"
        >
          <Link2 className="w-3 h-3" />
          Coller un lien
        </button>
      )}

      {error && (
        <p className="text-[12px] text-err mt-2">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
