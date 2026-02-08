import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ExternalLink, Loader2, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface WikipediaExplorerProps {
  initialQuery?: string;
}

interface SearchResult {
  title: string;
  snippet: string;
  pageid: number;
  thumbnail?: string;
}

const WikipediaExplorer: React.FC<WikipediaExplorerProps> = ({ initialQuery }) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedPage, setSelectedPage] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setSelectedPage(null);
    try {
      // Using generator=search to get thumbnails and extracts in one go
      const response = await fetch(
        `https://${language}.wikipedia.org/w/api.php?origin=*&action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=10&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=200&exintro&explaintext&exsentences=2&format=json`
      );
      const data = await response.json();
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages) as any[];
        // Sort by index if available
        const sortedPages = pages.sort((a, b) => (a.index || 0) - (b.index || 0)).map(p => ({
          title: p.title,
          snippet: p.extract || '',
          pageid: p.pageid,
          thumbnail: p.thumbnail?.source
        }));
        setResults(sortedPages);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(t.wiki.error_fetch);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPage = async (title: string) => {
    setLoading(true);
    setError('');
    try {
      // Use parse to get HTML content
      const response = await fetch(
        `https://${language}.wikipedia.org/w/api.php?origin=*&action=parse&page=${encodeURIComponent(title)}&format=json&prop=text`
      );
      const data = await response.json();
      if (data.parse && data.parse.text) {
        setSelectedPage({ title: data.parse.title, content: data.parse.text['*'] });
      } else {
        setError('Failed to load page content.');
      }
    } catch (err) {
      setError('Failed to fetch page content.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Helper to strip some inline styles or fix links in rendered HTML (rudimentary)
  const createMarkup = (html: string) => {
    return { __html: html };
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 transition-colors duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-2">
        {selectedPage ? (
          <button
            onClick={() => setSelectedPage(null)}
            className="p-2 mr-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <Globe size={20} className="text-gray-400 dark:text-gray-500 mr-2" />
        )}

        <form onSubmit={handleSubmit} className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.wiki.search_placeholder}
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-4 pr-10 py-2 text-sm text-gray-900 dark:text-gray-200 focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" className="absolute right-2 top-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 z-20">
            <Loader2 size={32} className="text-indigo-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        )}

        {!selectedPage && !loading && results.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <Globe size={48} className="mb-4 opacity-20" />
            <p className="text-sm">{t.wiki.no_results}</p>
          </div>
        )}

        {/* Search Results */}
        {!selectedPage && results.length > 0 && (
          <div className="p-4 space-y-4">
            {results.map((result) => (
              <div
                key={result.pageid}
                onClick={() => handleFetchPage(result.title)}
                className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-800/50 cursor-pointer transition-all group overflow-hidden"
              >
                <div className="flex gap-4">
                  {result.thumbnail && (
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 mb-1 truncate">{result.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                      {result.snippet}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Viewer */}
        {selectedPage && (
          <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedPage.title}</h1>
              <a
                href={`https://${language}.wikipedia.org/wiki/${encodeURIComponent(selectedPage.title)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full"
              >
                {t.wiki.open_in_wiki} <ExternalLink size={12} />
              </a>
            </div>
            <div
              className="wiki-content text-gray-800 dark:text-gray-300 space-y-4 leading-relaxed font-sans"
              dangerouslySetInnerHTML={createMarkup(selectedPage.content)}
            />

            {/* Styles for wiki content injection */}
            <style>{`
               .wiki-content p { margin-bottom: 1rem; line-height: 1.7; }
               .wiki-content h2 { font-size: 1.5rem; font-weight: 700; color: inherit; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #374151; padding-bottom: 0.5rem; }
               .dark .wiki-content h2 { border-color: #374151; }
               .wiki-content h2 { border-color: #e5e7eb; }
               
               .wiki-content h3 { font-size: 1.25rem; font-weight: 600; color: inherit; margin-top: 1.5rem; margin-bottom: 0.75rem; }
               .wiki-content ul, .wiki-content ol { padding-left: 1.5rem; margin-bottom: 1rem; }
               .wiki-content li { margin-bottom: 0.5rem; }
               .wiki-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; display: block; overflow-x: auto; }
               
               .wiki-content th, .wiki-content td { padding: 0.75rem; border: 1px solid #e5e7eb; text-align: left; }
               .dark .wiki-content th, .dark .wiki-content td { border-color: #374151; }
               
               .wiki-content th { background: #f9fafb; font-weight: 600; }
               .dark .wiki-content th { background: #111827; }
               
               .wiki-content a { color: #2563eb; text-decoration: none; }
               .dark .wiki-content a { color: #60a5fa; }
               .wiki-content a:hover { text-decoration: underline; }
               
               .wiki-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; }
               
               .wiki-content .infobox { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 1rem; margin-left: 1rem; float: right; width: 300px; font-size: 0.9em; }
               .dark .wiki-content .infobox { background: #111827; border-color: #374151; }
               
               .wiki-content .thumb { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 0.5rem; margin: 1rem; }
               .dark .wiki-content .thumb { background: #111827; border-color: #374151; }
               
               .wiki-content .reflist, .wiki-content .mw-editsection, .wiki-content .hatnote { display: none; }
             `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default WikipediaExplorer;