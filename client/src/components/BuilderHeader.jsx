import React from 'react';
import { 
  ArrowLeftIcon, 
  Code2Icon, 
  DownloadIcon, 
  ExternalLinkIcon, 
  EyeIcon, 
  GlobeIcon, 
  Loader2Icon 
} from 'lucide-react';

const BuilderHeader = ({
  projectName,
  version,
  showCode,
  publishing,
  onToggleShowCode,
  onPublish,
  onOpenPreview,
  onDownload,
  onBack,
  onLogout
}) => {
  return (
    <header className='h-12 shrink-0 flex items-center justify-between px-3 border-b border-zinc-200 bg-white'>
      <div className='flex items-center gap-2'>
        <button 
          className='p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer' 
          onClick={onBack}
          title="Back to projects"
        >
          <ArrowLeftIcon size={16}/>
        </button>
        <img src='/logo.svg' alt='' className='invert size-5' />
        <span className='text-sm font-semibold truncate max-w-38 md:max-w-50'>
          {projectName || 'New project'} / v {version || '1.0'}
        </span>
      </div>

      <div className='flex items-center gap-1.5'>
        <button 
          onClick={onToggleShowCode}
          className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white ${showCode ? 'text-zinc-50 bg-zinc-900' : ''}`}
        >
          {showCode ? (
            <>
              <EyeIcon size={16}/>
              <span className='text-xs font-semibold'>Preview</span>
            </>
          ) : (
            <>
              <Code2Icon size={16}/>
              <span className='text-xs font-semibold'>Code</span>
            </>
          )}
        </button>

        <button 
          onClick={onOpenPreview}
          className='inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white'
        >
          <ExternalLinkIcon size={13}/>
          <span className='text-xs font-semibold'>Open Preview</span>
        </button>

        <button 
          onClick={onDownload}
          className='inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white'
        >
          <DownloadIcon size={13}/>
          <span className='text-xs font-semibold'>Download</span>
        </button>

        <button 
          onClick={onPublish} 
          disabled={publishing}
          className='inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white disabled:opacity-50'
        >
          {publishing ? <Loader2Icon size={13} className="animate-spin"/> : <GlobeIcon size={13}/>}
          <span className='text-xs font-semibold'>Publish</span>
        </button>
        <button 
          onClick={onLogout}
          className='inline-flex items-center justify-center gap-1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white'
        >
          <span className='text-xs font-semibold'>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default BuilderHeader;