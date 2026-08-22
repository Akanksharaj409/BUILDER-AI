import React from 'react'
import { Loader2Icon } from 'lucide-react'

const Loading = () => {
  return (
    <div role='status' className="flex h-screen w-full items-center justify-center bg-white">
      <Loader2Icon className="animate-spin text-zinc-950" />
    </div>
  )
}

export default Loading