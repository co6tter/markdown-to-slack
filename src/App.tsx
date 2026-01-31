import { useState, useEffect } from 'react';
import { Copy, Check, Settings } from 'lucide-react';
import classNames from 'classnames';
import { convertToSlack, type ConversionOptions } from './lib/converter';

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>({
    tableStyle: 'codeblock',
    headerStyle: 'simple',
  });
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  
  // Real-time conversion
  useEffect(() => {
    // console.log('Converting with options:', options);
    const result = convertToSlack(input, options);
    setOutput(result);
  }, [input, options]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy mode', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col h-screen">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Markdown to Slack
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Convert Markdown tables and styles for Slack without breakage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle could go here if implemented, using system preference for now */}
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          
          {/* Input Section */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                Markdown Input
              </label>
              <button 
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className={classNames(
                  "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm",
                  isOptionsOpen ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}
              >
                <Settings size={16} />
                <span>Options</span>
              </button>
            </div>
            
            {/* Options Panel */}
            {isOptionsOpen && (
               <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm animate-in slide-in-from-top-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="flex flex-col gap-2">
                     <span className="font-medium text-gray-700 dark:text-gray-300">Header Style</span>
                     <div className="flex gap-2">
                       <button
                         onClick={() => setOptions(o => ({ ...o, headerStyle: 'simple' }))}
                         className={classNames(
                           "px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                           options.headerStyle === 'simple' 
                             ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm text-gray-900 dark:text-white ring-1 ring-blue-500/20" 
                             : "border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                         )}
                       >
                         Simple (Bold)
                       </button>
                       <button
                         onClick={() => setOptions(o => ({ ...o, headerStyle: 'emoji' }))}
                         className={classNames(
                           "px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                           options.headerStyle === 'emoji' 
                             ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm text-gray-900 dark:text-white ring-1 ring-blue-500/20" 
                             : "border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                         )}
                       >
                         Emoji (1️⃣ Title)
                       </button>
                     </div>
                   </div>
                   
                   <div className="flex flex-col gap-2">
                     <span className="font-medium text-gray-700 dark:text-gray-300">Table Style</span>
                     <div className="flex gap-2">
                       <button
                         onClick={() => setOptions(o => ({ ...o, tableStyle: 'codeblock' }))}
                         className={classNames(
                           "px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                           options.tableStyle === 'codeblock' 
                             ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm text-gray-900 dark:text-white ring-1 ring-blue-500/20" 
                             : "border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                         )}
                       >
                         Code Block (Recommended)
                       </button>
                       <button
                         onClick={() => setOptions(o => ({ ...o, tableStyle: 'list' }))}
                         className={classNames(
                           "px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                           options.tableStyle === 'list' 
                             ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm text-gray-900 dark:text-white ring-1 ring-blue-500/20" 
                             : "border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                         )}
                       >
                         List Style (Mobile)
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            )}

            <textarea
              className="flex-1 w-full p-4 resize-none focus:outline-none bg-transparent font-mono text-sm leading-relaxed"
              placeholder="# Paste your Markdown here...&#10;&#10;| Feature | Status |&#10;| --- | --- |&#10;| Table | ✅ |"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
          </div>

          {/* Output Section */}
          <div className="flex-1 flex flex-col min-h-0 bg-gray-900 text-white rounded-xl shadow-sm border border-gray-700 overflow-hidden relative group">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <label className="font-semibold text-sm text-gray-300 flex items-center gap-2">
                Slack Output 
                <span className="text-xs text-gray-500 font-normal">(mrkdwn)</span>
              </label>
              
              <button
                onClick={handleCopy}
                disabled={!output}
                className={classNames(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  !output ? "opacity-50 cursor-not-allowed bg-gray-800 text-gray-500" :
                  copied 
                    ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                )}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <textarea
              className="flex-1 w-full p-4 resize-none focus:outline-none bg-gray-900/50 font-mono text-sm leading-relaxed text-gray-300"
              readOnly
              value={output}
              placeholder="Result will appear here..."
            />
            
            {!input && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                    <div className="text-center">
                        <div className="text-6xl mb-4">📝 ➡️ 💬</div>
                        <p>Paste Markdown to convert</p>
                    </div>
                </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
