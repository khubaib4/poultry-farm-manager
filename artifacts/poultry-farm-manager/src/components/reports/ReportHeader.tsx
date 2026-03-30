interface Props {
  farmName: string;
  farmLocation?: string | null;
  title: string;
  subtitle?: string;
  generatedDate: string;
}

export default function ReportHeader({ farmName, farmLocation, title, subtitle, generatedDate }: Props) {
  return (
    <div className="mb-6 print:mb-4">
      <div className="flex items-start justify-between border-b-2 border-gray-800 pb-3 mb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 print:text-black">{farmName}</h1>
          {farmLocation && <p className="text-sm text-gray-500">{farmLocation}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Generated: {generatedDate}</p>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
