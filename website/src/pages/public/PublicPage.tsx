import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { websiteAPI } from '../../lib/api';

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => websiteAPI.getPage(slug!).then(res => res.data),
    enabled: !!slug,
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Page not found</div>;

  const page = pageData?.page;
  const sections = page?.sections || [];
  const backgroundImage = page?.background_image;

  return (
    <div
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {sections.map((section: any) => (
        <SectionDisplay key={section.id} section={section} />
      ))}
    </div>
  );
}

function SectionDisplay({ section }: any) {
  switch (section.type) {
    case 'navbar':
      return (
        <nav style={{ backgroundColor: section.content.bgColor, color: section.content.textColor }} className="px-8 py-4 flex items-center justify-between">
          <div className="font-bold text-lg">{section.content.logo}</div>
          <div className="flex gap-6">
            {section.content.links.map((link: any, idx: number) => (
              <a key={idx} href={link.url} className="text-sm hover:opacity-75">
                {link.label}
              </a>
            ))}
          </div>
          <button style={{ backgroundColor: section.content.buttonColor }} className="text-white px-4 py-2 rounded-lg">
            {section.content.buttonText}
          </button>
        </nav>
      );
    case 'hero':
      return (
        <div style={{ backgroundColor: section.content.bgColor }} className="p-12 text-center min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{section.content.heading}</h1>
          <p className="text-xl text-gray-600 mb-8">{section.content.subheading}</p>
          <button className="px-8 py-3 bg-gray-900 text-white rounded-lg">
            {section.content.buttonText}
          </button>
        </div>
      );
    case 'features':
      return (
        <div className="bg-white p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{section.content.title}</h2>
          <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
            {section.content.items.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center text-center">
                {item.icon ? (
                  <img src={item.icon} alt={item.label} className="w-32 h-32 object-cover rounded-lg mb-4" />
                ) : (
                  <div className="text-6xl mb-4">📷</div>
                )}
                <p className="font-medium text-gray-900">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'about':
      return (
        <div className="bg-white p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{section.content.title}</h2>
          <p className="text-gray-700 leading-relaxed">{section.content.description}</p>
          {section.content.image && (
            <img src={section.content.image} alt="About" className="mt-6 w-full rounded-lg max-h-96 object-cover" />
          )}
        </div>
      );
    case 'cta':
      return (
        <div
          style={{ backgroundColor: section.content.bgColor }}
          className="p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-6">{section.content.heading}</h2>
          <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium">
            {section.content.buttonText}
          </button>
        </div>
      );
    case 'faq':
      return (
        <div className="bg-white p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.content.title}</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {section.content.items.map((item: any, idx: number) => (
              <div key={idx} className="border border-gray-300 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">{item.question}</p>
                <p className="text-gray-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="bg-gray-50 p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.content.title}</h2>
          <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
            {section.content.items.map((item: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex gap-1 mb-2">
                  {[...Array(item.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                <p className="font-semibold text-gray-900">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}