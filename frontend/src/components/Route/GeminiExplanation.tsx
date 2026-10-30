import React from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface GeminiExplanationProps {
  explanation: string | null;
  isExplaining: boolean;
  onExplain: () => void;
  hasResult: boolean;
}

export function GeminiExplanation({
  explanation,
  isExplaining,
  onExplain,
  hasResult,
}: GeminiExplanationProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (!hasResult) return null;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">AI Route Explanation</h4>
            <p className="text-xs text-gray-500">Powered by Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!explanation && (
            <button
              onClick={onExplain}
              disabled={isExplaining}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              {isExplaining ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Explain Route
                </>
              )}
            </button>
          )}
          {explanation && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isExplaining && (
        <div className="p-4 flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Gemini is analyzing your route optimization...</span>
        </div>
      )}

      {explanation && isExpanded && (
        <div className="p-4">
          <div className="prose prose-sm max-w-none">
            {explanation.split('\n').map((line, index) => (
              <p key={index} className="text-sm text-gray-700 leading-relaxed mb-2 last:mb-0">
                {line}
              </p>
            ))}
          </div>
          <button
            onClick={onExplain}
            disabled={isExplaining}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Regenerate explanation
          </button>
        </div>
      )}
    </div>
  );
}
