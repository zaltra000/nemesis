import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage, GroundingChunk } from '../types';
import { Bot, User, Globe, ExternalLink, Cpu, Copy, Check, Search, Terminal, Zap, FileText, Image as ImageIcon } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl">
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[11px] font-mono text-gray-400 font-medium uppercase tracking-wider">{language}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] font-mono bg-white/5 hover:bg-white/10 border border-white/5 rounded px-2 py-1 transition-all text-gray-300"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            PreTag="div"
            customStyle={{ 
              margin: 0, 
              padding: '1.25rem', 
              background: 'transparent', 
              fontSize: '0.85rem',
              lineHeight: '1.6',
              fontFamily: '"JetBrains Mono", monospace'
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <code className={`${className} bg-white/10 text-primary-100 px-1.5 py-0.5 rounded text-xs font-mono border border-white/5`} {...props}>
      {children}
    </code>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Extract valid sources from grounding chunks
  const sources: GroundingChunk[] = message.groundingMetadata?.groundingChunks?.filter(
    chunk => chunk.web?.uri && chunk.web?.title
  ) || [];

  const uniqueSources = Array.from(new Set(sources.map(s => s.web?.uri)))
    .map(uri => sources.find(s => s.web?.uri === uri))
    .filter((s): s is GroundingChunk => !!s);

  // Extract search queries if available (Real functionality check)
  const searchQueries = message.groundingMetadata?.webSearchQueries || [];

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 hardware-accel animate-fade-in group`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg mt-1 transition-transform group-hover:scale-105 ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-blue-500/20' 
            : 'bg-gradient-to-br from-red-600 to-red-900 text-white shadow-red-500/20 border border-red-500/30'
        }`}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>

        {/* Content Box */}
        <div className={`flex flex-col gap-2 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Header for Bot */}
          {!isUser && (
            <div className="flex items-center gap-2.5 px-1">
              <span className="text-[11px] font-bold text-red-500 font-mono tracking-widest flex items-center gap-1.5">
                NEMESIS <span className="text-[9px] text-gray-600 font-normal opacity-50">v5.0</span>
              </span>
              {message.isThinking && (
                 <span className="flex items-center gap-1.5 text-[9px] text-accent-purple font-mono bg-accent-purple/10 px-2 py-0.5 rounded-full border border-accent-purple/20">
                    <Cpu className="w-3 h-3 animate-spin" />
                    NEURAL_ARCHITECT
                 </span>
              )}
            </div>
          )}

          <div className={`px-5 py-3.5 shadow-2xl backdrop-blur-md min-w-0 break-words w-full ${
            isUser 
              ? 'bg-gray-800/80 text-gray-50 rounded-2xl rounded-tr-none border border-gray-700/50' 
              : 'bg-gray-900/60 text-gray-100 rounded-2xl rounded-tl-none border border-white/5'
          }`}>
            
            {/* Attachment Rendering (For User Messages) */}
            {isUser && message.attachments && message.attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {message.attachments.map((att, idx) => (
                        <div key={idx} className="bg-black/40 border border-white/10 rounded-lg p-2 flex flex-col gap-2 overflow-hidden">
                            {/* If it's an image, show preview */}
                            {att.mimeType.startsWith('image/') ? (
                                <div className="h-24 w-full bg-black/50 rounded overflow-hidden">
                                     <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-10 w-full flex items-center justify-center bg-white/5 rounded">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-mono text-gray-300 truncate">{att.name}</span>
                                <span className="text-[8px] font-mono text-gray-500">{(att.size/1024).toFixed(0)}KB</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {message.isThinking ? (
              <div className="flex flex-col gap-3 min-w-[200px] py-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <span className="w-1.5 h-1.5 bg-accent-purple rounded-full animate-pulse"></span>
                  Simulating attack vector...
                </div>
                <div className="space-y-2 opacity-50">
                   <div className="h-1 bg-gray-700 rounded w-full animate-pulse"></div>
                   <div className="h-1 bg-gray-700 rounded w-3/4 animate-pulse delay-75"></div>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-7 prose-headings:font-bold prose-headings:font-mono prose-headings:text-gray-100 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-ul:my-2 prose-li:my-0.5">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CodeBlock
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Search Evidence (Queries) - SHOWS REAL FUNCTION */}
          {!isUser && !message.isThinking && searchQueries.length > 0 && (
             <div className="flex flex-wrap gap-1.5 mt-1 px-1">
               {searchQueries.map((query, i) => (
                 <div key={i} className="flex items-center gap-1.5 bg-[#0b0f19] border border-blue-500/20 text-blue-400 hover:text-blue-300 text-[10px] px-2.5 py-1 rounded-full font-mono transition-colors cursor-default">
                   <Search className="w-3 h-3" />
                   {query}
                 </div>
               ))}
             </div>
          )}

          {/* Sources / Metadata */}
          {!isUser && !message.isThinking && uniqueSources.length > 0 && (
            <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5 w-full backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                <Globe className="w-3 h-3 text-blue-500" />
                Intelligence Sources
              </div>
              <div className="grid grid-cols-1 gap-2">
                {uniqueSources.slice(0, 3).map((source, idx) => (
                  <a
                    key={idx}
                    href={source.web?.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 bg-gray-900/50 hover:bg-gray-800 border border-white/5 hover:border-blue-500/30 rounded-lg text-xs text-gray-300 transition-all group"
                  >
                    <div className="w-1 h-4 bg-gray-700 group-hover:bg-blue-500 rounded-full transition-colors"></div>
                    <span className="truncate flex-1 font-medium">{source.web?.title || 'Classified Source'}</span>
                    <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 text-blue-400 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <span className="text-[9px] text-gray-600 font-mono px-1 opacity-50 tracking-tight">
            CMD_ID: {message.timestamp.toString().slice(-6)} // T-{message.timestamp.toString().slice(-4)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;