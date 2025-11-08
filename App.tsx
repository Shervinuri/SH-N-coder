
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Footer } from './components/Footer';
import { CodeIcon, EyeIcon, SendIcon } from './components/Icons';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateCodeStream } from './services/geminiService';

// Type Definitions
type ViewMode = 'sandbox' | 'preview';

// --- HELPER FUNCTIONS ---
const buildFullHtml = (bodyContent: string): string => `
  <!DOCTYPE html>
  <html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <title>SHΞN™coder Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Arimo', sans-serif;
        background-color: #1a202c; /* bg-gray-800 */
        color: #e2e8f0; /* text-gray-200 */
      }
    </style>
  </head>
  <body>
    ${bodyContent}
  </body>
  </html>
`;

// --- SUB-COMPONENTS ---

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center p-8 text-center z-30 backdrop-blur-sm">
    <h2 className="text-2xl font-bold text-red-200 mb-4">An Error Occurred</h2>
    <p className="text-red-300 font-mono bg-red-900/70 p-4 rounded-md mb-6 max-w-xl break-words">{message}</p>
    <button
      onClick={onRetry}
      className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors"
    >
      Retry Last Command
    </button>
  </div>
);

const CodeEditor: React.FC<{ code: string }> = ({ code }) => (
  <textarea
    readOnly
    value={code}
    className="w-full h-full bg-gray-900 text-green-400 font-mono p-4 resize-none focus:outline-none scrollbar-thin"
    aria-label="Code Sandbox"
  />
);

const RenderPreview: React.FC<{ code: string }> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setLoaded] = useState(false);

  // Memoize the shell to prevent re-renders from recreating it.
  const htmlShell = useMemo(() => buildFullHtml(''), []);

  useEffect(() => {
    // Update the iframe body when code changes, but only if the iframe is fully loaded.
    if (isLoaded && iframeRef.current?.contentDocument?.body) {
      try {
        iframeRef.current.contentDocument.body.innerHTML = code;
      } catch (e) {
        console.error("Failed to update preview:", e);
      }
    }
  }, [code, isLoaded]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={htmlShell}
      title="Render Preview"
      className="w-full h-full bg-white border-none"
      sandbox="allow-scripts allow-same-origin"
      onLoad={() => setLoaded(true)}
    />
  );
};


const ViewSwitcher: React.FC<{ mode: ViewMode; setMode: (mode: ViewMode) => void }> = ({ mode, setMode }) => (
  <div className="absolute top-4 right-6 z-20 bg-gray-700 p-1 rounded-lg flex gap-1 shadow-lg">
    <button
      onClick={() => setMode('sandbox')}
      aria-pressed={mode === 'sandbox'}
      className={`p-2 rounded-md transition-colors duration-200 ${mode === 'sandbox' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
    >
      <CodeIcon />
    </button>
    <button
      onClick={() => setMode('preview')}
      aria-pressed={mode === 'preview'}
      className={`p-2 rounded-md transition-colors duration-200 ${mode === 'preview' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-600'}`}
    >
      <EyeIcon />
    </button>
  </div>
);

const CommandInput: React.FC<{ onSendCommand: (command: string) => void; isLoading: boolean }> = ({ onSendCommand, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    if (input.trim() && !isLoading) {
      onSendCommand(input.trim());
      setInput('');
    }
  }, [input, isLoading, onSendCommand]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="p-4 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700">
      <div className="relative max-w-6xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the web page you want to build or modify..."
          rows={1}
          className="w-full bg-gray-700/80 text-gray-100 rounded-lg p-3 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 max-h-40 overflow-y-auto scrollbar-thin"
          disabled={isLoading}
          aria-label="Command input"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Send command"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:bg-purple-600 hover:text-white disabled:hover:bg-transparent disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? <LoadingSpinner /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>('preview');
  const [generatedCode, setGeneratedCode] = useState<string>(`<div class="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-200 p-8 text-center">
  <div class="max-w-3xl w-full">
    <h1 class="text-5xl md:text-6xl font-bold mb-4">
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">SHΞN™</span>coder
    </h1>
    <p class="text-xl md:text-2xl text-gray-400 mb-12">Your personal AI, crafting web pages from your imagination.</p>

    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 text-left">
      <h2 class="text-2xl font-semibold mb-4 text-gray-100">How to begin?</h2>
      <p class="text-gray-400 mb-6">Simply describe what you want to build or change in the command bar below. Be descriptive!</p>
      <div class="space-y-4">
        <div class="bg-gray-700/60 p-4 rounded-md">
          <p class="font-mono text-sm text-purple-300">"Create a sleek portfolio section with 3 project cards. Each card should have an image placeholder, a title, a short description, and a 'View Project' button."</p>
        </div>
        <div class="bg-gray-700/60 p-4 rounded-md">
          <p class="font-mono text-sm text-purple-300">"Change the entire color scheme to a light theme with blue as the primary accent color."</p>
        </div>
        <div class="bg-gray-700/60 p-4 rounded-md">
          <p class="font-mono text-sm text-purple-300">"Add a footer with social media icons for Twitter, GitHub, and LinkedIn."</p>
        </div>
      </div>
    </div>
  </div>
</div>`);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastCommandRef = useRef<string | null>(null);

  const handleSendCommand = useCallback(async (command: string) => {
    setIsLoading(true);
    setError(null);
    lastCommandRef.current = command;

    const finalPrompt = `You are SHΞN™coder, an expert web developer AI that builds single-page HTML applications using TailwindCSS for styling.
Your task is to modify the given HTML code based on the user's command.

Previous HTML code:
\`\`\`html
${generatedCode}
\`\`\`

User command: "${command}"

Generate the complete and updated HTML body content that incorporates the user's command.
IMPORTANT: Only output the raw code for the content inside the <body> tag. Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags in your response. The output must be pure HTML.`;
    
    try {
      let fullResponse = '';
      const stream = generateCodeStream(finalPrompt);

      for await (const chunk of stream) {
        fullResponse += chunk;
        // Strip the opening markdown fence during stream for cleaner preview.
        // The browser is lenient with a trailing fence until the final cleanup.
        setGeneratedCode(fullResponse.replace(/^```html\n?/, ''));
      }
      
      if (fullResponse) {
          const codeBlockRegex = /^\s*```html\n(.*?)\n```\s*$/s;
          const match = fullResponse.match(codeBlockRegex);
          // If regex matches, use the captured group, otherwise fallback to a simpler replace.
          const extractedCode = match ? match[1] : fullResponse.replace(/^```html\n?/, '').replace(/```\s*$/, '');
          setGeneratedCode(extractedCode.trim());
      }

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [generatedCode]);

  const handleRetry = useCallback(() => {
    if (lastCommandRef.current) {
      setError(null);
      handleSendCommand(lastCommandRef.current);
    }
  }, [handleSendCommand]);


  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-[Arimo]">
       <style>{`
        @keyframes chaotic-glitch {
          0% { transform: translate(0, 0) skew(0, 0); clip-path: inset(0% 0% 0% 0%); }
          2% { transform: translate(2px, -3px) skew(0.5deg, -0.2deg); clip-path: inset(80% 20% 5% 10%); }
          5% { transform: translate(-5px, 1px) skew(-0.8deg, 0.1deg); clip-path: inset(10% 5% 70% 30%); }
          8% { transform: translate(0, 0) skew(0, 0); clip-path: inset(0% 0% 0% 0%); }
          10% { clip-path: inset(50% 50% 10% 10%); }
          13% { clip-path: inset(20% 10% 65% 5%); }
          15% { transform: translate(4px, 4px) skew(0, 0.5deg); clip-path: inset(40% 5% 40% 50%); }
          20% { transform: translate(0, 0) skew(0, 0); clip-path: inset(0% 0% 0% 0%); }
          25% { transform: translate(0, 0) skew(0, 0); clip-path: inset(0% 0% 0% 0%); }
          28% { transform: translate(10px, -5px) skew(1deg, 0); clip-path: inset(0 90% 95% 0); }
          33% { transform: translate(-15px, 2px) skew(0, -1.2deg); clip-path: inset(95% 0 0 80%); }
          38% { transform: translate(0, 0) skew(0, 0); clip-path: inset(0% 0% 0% 0%); }
          40% { filter: invert(1) hue-rotate(180deg); opacity: 0.7; }
          41% { filter: none; opacity: 1; }
          50% { transform: translate(0, 10px) scale(1.05, 1); clip-path: inset(90% 0 0 0); }
          55% { transform: translate(0, 0) scale(1, 1); clip-path: inset(0% 0% 0% 0%); }
          60% { clip-path: inset(10% 80% 80% 5%); }
          63% { clip-path: inset(50% 5% 10% 50%); }
          66% { clip-path: inset(85% 10% 5% 15%); }
          70% { clip-path: inset(0% 0% 0% 0%); }
          75% { transform: translate(2px, 2px) scale(0.98, 1); filter: contrast(2.5); }
          80% { transform: translate(0,0) scale(1,1); filter: none; }
          85% { transform: translate(-5px, -10px) skew(-1.5deg, -0.5deg); clip-path: inset(25% 25% 25% 25%); }
          90% { transform: translate(0,0) skew(0,0); clip-path: inset(0% 0% 0% 0%); }
          95% { clip-path: inset(90% 5% 2% 90%); }
          100% { clip-path: inset(0% 0% 0% 0%); }
        }
        @keyframes static-flicker-2 {
          0% { opacity: 0.05; } 3% { opacity: 0.1; } 6% { opacity: 0.02; }
          10% { opacity: 0.08; } 15% { opacity: 0; } 25% { opacity: 0.12; }
          30% { opacity: 0.01; } 40% { opacity: 0.07; } 50% { opacity: 0.1; }
          60% { opacity: 0; } 70% { opacity: 0.04; } 80% { opacity: 0.11; }
          90% { opacity: 0.03; } 100% { opacity: 0; }
        }
        .content-glitching > * {
          animation: chaotic-glitch 1.2s steps(1) infinite;
        }
        .content-glitching::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 25;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          background-size: 250px;
          animation: static-flicker-2 0.3s linear infinite;
        }
      `}</style>

      <header className="flex-shrink-0 flex items-center justify-center p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg">
        <h1 className="text-2xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">SHΞN™</span>coder
        </h1>
      </header>
      
      <main className="flex-1 flex flex-col min-h-0 relative bg-gray-800/30">
        <ViewSwitcher mode={mode} setMode={setMode} />
        {error && <ErrorDisplay message={error} onRetry={handleRetry} />}
        
        <div className={`flex-1 relative ${isLoading ? 'content-glitching' : ''}`}>
          {mode === 'sandbox' ? (
            <CodeEditor code={generatedCode} />
          ) : (
            <RenderPreview code={generatedCode} />
          )}
        </div>
      </main>
      
      <CommandInput onSendCommand={handleSendCommand} isLoading={isLoading} />
      
      <Footer />
    </div>
  );
};

export default App;
