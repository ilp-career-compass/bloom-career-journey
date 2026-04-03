export default function IlpFooter() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 py-4">
      <p className="text-center text-base text-gray-500 flex items-center justify-center gap-2">
        <img src="/logo/ILP-new-logo.jpeg" alt="ILP" className="h-6 w-6 rounded-sm object-contain inline-block" />
        <span className="font-semibold">India Literacy Project</span> |{' '}
        <a href="https://www.ilpnet.org" target="_blank" rel="noopener noreferrer" className="underline text-gray-600 hover:text-gray-800">ilpnet.org</a>
        {' | '}
        <a href="mailto:ilp@ilpnet.org" className="underline text-gray-600 hover:text-gray-800">ilp@ilpnet.org</a>
      </p>
    </footer>
  );
}
