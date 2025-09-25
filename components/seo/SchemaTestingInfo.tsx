'use client'

export function SchemaTestingInfo() {
  const handleTestSchema = () => {
    const currentUrl = window.location.href;
    const testUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(currentUrl)}`;
    window.open(testUrl, '_blank');
  }

  const handleViewSchema = () => {
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    let allSchemas = '';

    schemaScripts.forEach((script, index) => {
      try {
        const schema = JSON.parse(script.textContent || '');
        allSchemas += `\n\n=== Schema ${index + 1} ===\n${JSON.stringify(schema, null, 2)}`;
      } catch (e) {
        allSchemas += `\n\n=== Schema ${index + 1} (Error) ===\nFailed to parse schema`;
      }
    });

    if (allSchemas) {
      const blob = new Blob([allSchemas], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schema-${window.location.pathname.replace(/\//g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('No schema markup found on this page');
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="text-sm font-medium text-gray-900 mb-3">
        Schema Testing Tools
      </div>
      <div className="space-y-2">
        <button
          onClick={handleTestSchema}
          className="block w-full text-left px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          🔍 Test Rich Results
        </button>
        <button
          onClick={handleViewSchema}
          className="block w-full text-left px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          📥 Download Schema
        </button>
        <div className="text-xs text-gray-600 mt-2">
          Page includes:
          <ul className="mt-1 space-y-1">
            <li>• Local Business Schema</li>
            <li>• Review/Rating Schema</li>
            <li>• Service Schema</li>
            <li>• Breadcrumb Schema</li>
          </ul>
        </div>
      </div>
    </div>
  )
}