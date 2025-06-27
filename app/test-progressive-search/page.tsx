import { ProgressiveGlobalSearch } from '@/components/search/ProgressiveGlobalSearch';
import { SearchWithHighlight } from '@/components/search/SearchWithHighlight';

export default function TestProgressiveSearchPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-serif mb-8">Progressive Search Test Page</h1>
      
      <section>
        <h2 className="text-xl font-serif mb-4">Progressive Enhanced Search</h2>
        <p className="text-sm text-gray-600 mb-4">
          This search works without JavaScript and enhances when JS is available.
        </p>
        <ProgressiveGlobalSearch className="max-w-md" />
      </section>

      <section>
        <h2 className="text-xl font-serif mb-4">Original Search (JS Required)</h2>
        <p className="text-sm text-gray-600 mb-4">
          This is the original search that requires JavaScript to function.
        </p>
        <SearchWithHighlight className="max-w-md" />
      </section>

      <section className="bg-gray-100 p-6 rounded-lg">
        <h3 className="font-serif text-lg mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Try the progressive search - it should show live results when typing</li>
          <li>Disable JavaScript in your browser</li>
          <li>Reload the page</li>
          <li>The progressive search should still work by submitting to /search</li>
          <li>The original search won&apos;t work without JavaScript</li>
        </ol>
      </section>

      <noscript>
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
          <p className="font-bold">JavaScript is disabled!</p>
          <p>The progressive search above will submit to the search results page.</p>
          <p>The original search below will not function.</p>
        </div>
      </noscript>
    </div>
  );
}