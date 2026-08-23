import React, { useState } from 'react';
import { ArrowRightIcon, Loader2Icon, SparklesIcon } from 'lucide-react';

const PromptInput = ({ onSubmit, loading = false, placeholder = "Describe what you want to build...", variant = "glass", autoFocus = false }) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onSubmit(prompt);
  };

  const isWhite = variant === "white" || variant === "light";
  const isGlass = variant === "glass";

  return (
    <form onSubmit={handleSubmit} className="w-full relative group">
      <div className={`flex items-center gap-3 p-2 pl-4 rounded-2xl border transition-all ${
        isGlass 
          ? "bg-white/10 backdrop-blur-xl border-white/20 hover:border-white/30 focus-within:border-white/40 focus-within:bg-white/15 shadow-lg" 
          : isWhite
            ? "bg-white border-zinc-200 hover:border-zinc-300 focus-within:border-red-500/50 shadow-md"
            : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-lg"
      }`}>
        <SparklesIcon size={18} className="text-red-500 shrink-0" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          autoFocus={autoFocus}
          className={`flex-1 bg-transparent text-sm md:text-base focus:outline-none ${
            isWhite ? "text-zinc-900 placeholder-zinc-400" : "text-white placeholder-zinc-400"
          }`}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          className="p-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center"
        >
          {loading ? (
            <Loader2Icon size={18} className="animate-spin" />
          ) : (
            <ArrowRightIcon size={18} />
          )}
        </button>
      </div>
    </form>
  );
};

export default PromptInput;