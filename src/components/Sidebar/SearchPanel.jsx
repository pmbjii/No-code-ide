import React, { useState } from 'react';
import { Search, Replace, ChevronDown, ChevronRight, FileText } from 'lucide-react';

const SearchPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simulate search - in a real app, this would call the backend
    setTimeout(() => {
      const mockResults = [
        {
          file: 'src/App.jsx',
          matches: [
            { line: 15, text: 'import React from \'react\';', match: 'React' },
            { line: 23, text: 'const App = () => {', match: 'App' }
          ]
        },
        {
          file: 'src/components/Header.jsx',
          matches: [
            { line: 8, text: 'export default Header;', match: 'Header' }
          ]
        }
      ];
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleReplace = () => {
    // Implement replace functionality
    console.log('Replace:', searchQuery, 'with:', replaceQuery);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary mb-3">Search</h3>
        
        {/* Search Input */}
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full input-field pr-8"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Replace Toggle */}
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="flex items-center text-sm text-text-secondary hover:text-text-primary mb-2"
        >
          {showReplace ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
          Replace
        </button>

        {/* Replace Input */}
        {showReplace && (
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Replace"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="w-full input-field pr-8"
            />
            <button
              onClick={handleReplace}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <Replace className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Options */}
        <div className="flex flex-wrap gap-2 text-xs">
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" />
            <span className="text-text-secondary">Match Case</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" />
            <span className="text-text-secondary">Whole Word</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-1" />
            <span className="text-text-secondary">Regex</span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isSearching ? (
          <div className="p-4 text-center text-text-secondary">
            <Search className="w-6 h-6 animate-spin mx-auto mb-2" />
            Searching...
          </div>
        ) : searchResults.length > 0 ? (
          <div className="p-2">
            <div className="text-sm text-text-secondary mb-2">
              {searchResults.reduce((total, file) => total + file.matches.length, 0)} results in {searchResults.length} files
            </div>
            
            {searchResults.map((file, fileIndex) => (
              <div key={fileIndex} className="mb-4">
                <div className="flex items-center text-sm font-medium text-text-primary mb-1">
                  <FileText className="w-4 h-4 mr-2" />
                  {file.file}
                  <span className="ml-2 text-text-secondary">({file.matches.length})</span>
                </div>
                
                {file.matches.map((match, matchIndex) => (
                  <div
                    key={matchIndex}
                    className="ml-6 p-2 hover:bg-panel-bg cursor-pointer text-sm border-l-2 border-transparent hover:border-accent"
                  >
                    <div className="text-text-secondary text-xs mb-1">Line {match.line}</div>
                    <div className="text-text-primary font-mono">
                      {match.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                          <span key={i} className="bg-yellow-500 text-black px-1 rounded">
                            {part}
                          </span>
                        ) : (
                          part
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="p-4 text-center text-text-secondary">
            No results found for "{searchQuery}"
          </div>
        ) : (
          <div className="p-4 text-center text-text-secondary">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Enter search terms to find text across files
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;