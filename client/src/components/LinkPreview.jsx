export default function LinkPreview({ title, image }) {
  if (!title && !image) return null;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-500 mb-2">Link Preview</p>
      <div className="flex items-start gap-4">
        {image && (
          <img
            src={image}
            alt={title || "Preview"}
            className="w-24 h-24 object-cover rounded"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}
        <div className="flex-1">
          {title && <p className="font-medium text-gray-800">{title}</p>}
        </div>
      </div>
    </div>
  );
}
