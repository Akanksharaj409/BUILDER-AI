import React, { useEffect, useRef } from "react";
import { UserIcon, BotMessageSquareIcon, BotIcon } from "lucide-react";
import PromptInput from "./PromptInput";

const ChatPanel = ({ messages = [], onSend, loading }) => {
    const bottomRef = useRef(null);
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/*Messages*/}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-zinc-400 text-sm text-center">
                            Ask AI to modify your website
                        </p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index}>
                        <div className="flex gap-2.5 items-start">
                            <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 bg-zinc-50">
                               {msg.role === "user" ? (
                                   <UserIcon className="w-3.5 h-3.5 text-zinc-500" />
                               ) : (
                                   <BotMessageSquareIcon className="w-3.5 h-3.5 text-zinc-500" />
                               )} 
                            </div>
                            <div className="flex-1 min-w-0">
                                 <p className="text-xs font-semibold text-zinc-500">
                                    {msg.role === "user" ? "You" : "AI"}
                                 </p>
                                 <p className="text-[13px] text-zinc-700 leading-normal whitespace-pre-wrap break-words">
                                     {msg.content.split("- `/").map((text, i) => (
                                        <span key={i} className="block mt-1">
                                            <span className={i === 0 ? "hidden" : ""}>-`/</span>
                                            {text}
                                        </span>
                                     ))}
                                 </p>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-2.5 items-start">
                        <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center mt-0.5 bg-zinc-900/5">
                          <BotIcon size={13} className="text-zinc-900" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] font-medium text-zinc-400 mb-2 uppercase tracking-wider">AI</p>
                               <div className="dot-loader flex gap-1"> 
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                               </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef}/>
            </div>
            {/*Input*/}
            <div className="p-3 border-t border-zinc-200 bg-white">
                <PromptInput onSubmit={onSend} loading={loading} placeholder="Ask AI to modify..." variant="white" autoFocus/>
            </div>
        </div>
    );
};

export default ChatPanel;