import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { websiteAPI } from '../../lib/api';
import { Save, Eye, ArrowLeft, Plus, Trash2, Copy, Settings, GripVertical, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Section {
  id: string;
  type: 'navbar' | 'hero' | 'features' | 'about' | 'cta' | 'faq' | 'testimonials';
  title: string;
  content: any;
}

export default function WebsiteBuilder() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [editor, setEditor] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([
    {
      id: '1',
      type: 'hero',
      title: 'Hero Section',
      content: {
        heading: 'Welcome to MyPregnancy',
        subheading: 'Your pregnancy companion',
        buttonText: 'Get Started',
        bgColor: '#FFE8E0',
      },
    },
  ]);
  const [selectedSection, setSelectedSection] = useState<string | null>('1');
  const [showPreview, setShowPreview] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: pagesData } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: () => websiteAPI.getAllPages().then(res => res.data),
  });

  const pages = pagesData?.pages || [];

  const { data: currentPageData } = useQuery({
    queryKey: ['page', selectedPage],
    queryFn: () => websiteAPI.getPage(selectedPage).then(res => res.data),
    enabled: !!selectedPage,
  });

  const currentPage = currentPageData?.page;

  const saveMutation = useMutation({
    mutationFn: (data: any) => websiteAPI.updatePage(selectedPage, data),
    onSuccess: () => {
      alert('Website saved successfully!');
    },
    onError: () => {
      alert('Failed to save website');
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && editorRef.current && !editor) {
      import('grapesjs').then((grapesjs) => {
        import('grapesjs-preset-webpage').then(() => {
          const editorInstance = grapesjs.default.init({
            container: editorRef.current!,
            plugins: ['gjs-preset-webpage'],
            pluginsOpts: {
              'gjs-preset-webpage': {},
            },
            storageManager: false,
            height: '100%',
            width: '100%',
            canvas: {
              styles: [
                'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
              ],
            },
          });

          setEditor(editorInstance);
        });
      });
    }

    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (editor && currentPage) {
      try {
        const components = JSON.parse(currentPage.grapesjs_components || '[]');
        const styles = JSON.parse(currentPage.grapesjs_styles || '[]');
        editor.setComponents(components);
        editor.setStyle(styles);
      } catch (e) {
        console.error('Failed to load page content', e);
      }
    }
  }, [editor, currentPage]);

  const handleSave = () => {
    if (!editor) return;

    const html = editor.getHtml();
    const css = editor.getCss();
    const components = JSON.stringify(editor.getComponents());
    const styles = JSON.stringify(editor.getStyle());

    saveMutation.mutate({
      grapesjs_html: html,
      grapesjs_css: css,
      grapesjs_components: components,
      grapesjs_styles: styles,
    });
  };

  const handlePreview = () => {
    window.open(`/${selectedPage}`, '_blank');
  };

  const sectionTemplates = [
    { type: 'navbar', label: 'Navbar' },
    { type: 'hero', label: 'Hero Section' },
    { type: 'features', label: 'Features' },
    { type: 'about', label: 'About' },
    { type: 'cta', label: 'Call to Action' },
    { type: 'faq', label: 'FAQ' },
    { type: 'testimonials', label: 'Testimonials' },
  ];

  const addSection = (type: any) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: `New ${type} Section`,
      content: getDefaultContent(type),
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection.id);
  };

  const getDefaultContent = (type: string) => {
    const defaults: any = {
      navbar: {
        logo: 'MyBrand',
        bgColor: '#FFFFFF',
        textColor: '#000000',
        links: [
          { label: 'Home', url: '#' },
          { label: 'About', url: '#' },
          { label: 'Features', url: '#' },
          { label: 'Contact', url: '#' },
        ],
        buttonText: 'Get Started',
        buttonColor: '#3B82F6',
      },
      hero: {
        heading: 'Your Headline Here',
        subheading: 'Add your subtitle',
        buttonText: 'Learn More',
        bgColor: '#FFE8E0',
      },
      features: {
        title: 'Our Features',
        items: [
          { icon: '', label: 'Feature 1' },
          { icon: '', label: 'Feature 2' },
          { icon: '', label: 'Feature 3' },
        ],
      },
      about: {
        title: 'About Us',
        description: 'Tell your story here...',
        image: '/placeholder.jpg',
      },
      cta: {
        heading: 'Ready to Get Started?',
        buttonText: 'Sign Up Now',
        bgColor: '#F0A3A3',
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          { question: 'Question 1?', answer: 'Answer here' },
          { question: 'Question 2?', answer: 'Answer here' },
        ],
      },
      testimonials: {
        title: 'What Users Say',
        items: [
          { name: 'User 1', text: 'Great product!', rating: 5 },
          { name: 'User 2', text: 'Highly recommend!', rating: 5 },
        ],
      },
    };
    return defaults[type];
  };

  const currentSection = sections.find((s) => s.id === selectedSection);

  const updateSection = (updates: any) => {
    setSections(
      sections.map((s) =>
        s.id === selectedSection ? { ...s, content: { ...s.content, ...updates } } : s
      )
    );
  };

  const deleteSection = (id: string) => {
    const newSections = sections.filter((s) => s.id !== id);
    setSections(newSections);
    setSelectedSection(newSections[0]?.id || null);
  };

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      const newSection = {
        ...section,
        id: Date.now().toString(),
      };
      setSections([...sections, newSection]);
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id);
    if (direction === 'up' && index > 0) {
      const newSections = [...sections];
      [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      setSections(newSections);
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setSections(newSections);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedSectionId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedSectionId || draggedSectionId === targetId) {
      setDraggedSectionId(null);
      return;
    }

    const draggedIndex = sections.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = sections.findIndex((s) => s.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newSections = [...sections];
      const [draggedSection] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, draggedSection);
      setSections(newSections);
    }

    setDraggedSectionId(null);
  };

  const handleDragEnd = () => {
    setDraggedSectionId(null);
  };

  if (showPreview) {
    return (
      <div
        className="min-h-screen bg-white"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <button
          onClick={() => setShowPreview(false)}
          className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <X size={20} />
          Edit
        </button>
        <PreviewMode sections={sections} />
      </div>
    );
  }

  const handleSaveWebsite = () => {
    saveMutation.mutate({
      sections: sections,
      background_image: backgroundImage,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Add Sections */}
      <div className="w-98 bg-white border-r border-gray-200 ">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mb-6 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-4">Add Sections</h2>
        <div className="space-y-2">
          {sectionTemplates.map((template: any) => (
            <button
              key={template.type}
              onClick={() => addSection(template.type)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition text-sm font-medium"
            >
              <Plus size={16} />
              {template.label}
            </button>
          ))}
        </div>

        <hr className="my-6" />

        <h2 className="text-lg font-bold text-gray-900 mb-4">Sections</h2>
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDraggedSectionId(section.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedSectionId && draggedSectionId !== section.id) {
                  const draggedIndex = sections.findIndex((s) => s.id === draggedSectionId);
                  const targetIndex = sections.findIndex((s) => s.id === section.id);
                  const newSections = [...sections];
                  [newSections[draggedIndex], newSections[targetIndex]] = [newSections[targetIndex], newSections[draggedIndex]];
                  setSections(newSections);
                  setDraggedSectionId(null);
                }
              }}
              onDragEnd={() => setDraggedSectionId(null)}
              className={`p-3 rounded-lg border-2 cursor-move transition ${
                draggedSectionId === section.id ? 'border-yellow-400 bg-yellow-50 opacity-50' : selectedSection === section.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedSection(section.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <GripVertical size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{section.title}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateSection(section.id);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  <Copy size={12} className="mx-auto" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSection(section.id);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded transition"
                >
                  <Trash2 size={12} className="mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-bold text-gray-900">Build Your Website </h1>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setBackgroundImage(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              <span className="text-sm font-medium">Background Image</span>
            </label>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition"
            >
              <Eye size={20} />
              Preview
            </button>
            <button
              onClick={handleSaveWebsite}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              <Save size={20} />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex overflow-hidden min-h-screen">
          {/* Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
            <div className="w-full space-y-6 min-h-full pr-4">
              {sections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  isSelected={selectedSection === section.id}
                  onSelect={() => setSelectedSection(section.id)}
                />
              ))}
            </div>
          </div>

          {/* Right Panel - Edit Properties */}
          {currentSection && (
            <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <Settings size={20} />
                <h3 className="text-lg font-bold">Edit Section</h3>
              </div>

              {currentSection.type === 'navbar' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo/Brand Name
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.logo}
                      onChange={(e) => updateSection({ logo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={currentSection.content.bgColor}
                      onChange={(e) => updateSection({ bgColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={currentSection.content.textColor}
                      onChange={(e) => updateSection({ textColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.buttonText}
                      onChange={(e) => updateSection({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Color
                    </label>
                    <input
                      type="color"
                      value={currentSection.content.buttonColor}
                      onChange={(e) => updateSection({ buttonColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Navigation Links</h4>
                      <button
                        onClick={() => {
                          const newLinks = [...currentSection.content.links, { label: 'New Link', url: '#' }];
                          updateSection({ links: newLinks });
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        + Add Link
                      </button>
                    </div>
                    <div className="space-y-2">
                      {currentSection.content.links.map((link: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const newLinks = [...currentSection.content.links];
                                newLinks[idx].label = e.target.value;
                                updateSection({ links: newLinks });
                              }}
                              placeholder="Link label"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                              onClick={() => {
                                const newLinks = currentSection.content.links.filter((_: any, i: number) => i !== idx);
                                updateSection({ links: newLinks });
                              }}
                              className="px-2 py-1 pl-3 ml-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentSection.type === 'hero' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.heading}
                      onChange={(e) => updateSection({ heading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subheading
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.subheading}
                      onChange={(e) => updateSection({ subheading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.buttonText}
                      onChange={(e) => updateSection({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={currentSection.content.bgColor}
                      onChange={(e) => updateSection({ bgColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {currentSection.type === 'features' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.title}
                      onChange={(e) => updateSection({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Feature Cards</h4>
                      <button
                        onClick={() => {
                          const newItems = [...currentSection.content.items, { icon: '', label: 'New Feature' }];
                          updateSection({ items: newItems });
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        + Add Card
                      </button>
                    </div>
                    <div className="space-y-4">
                      {currentSection.content.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Icon/Image
                            </label>
                            <div className="flex items-center gap-2">
                              {item.icon && (
                                <img src={item.icon} alt="icon" className="w-12 h-12 object-cover rounded" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const newItems = [...currentSection.content.items];
                                      newItems[idx].icon = event.target?.result as string;
                                      updateSection({ items: newItems });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="flex-1 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => {
                                const newItems = [...currentSection.content.items];
                                newItems[idx].label = e.target.value;
                                updateSection({ items: newItems });
                              }}
                              placeholder="Feature name"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                              onClick={() => {
                                const newItems = currentSection.content.items.filter((_: any, i: number) => i !== idx);
                                updateSection({ items: newItems });
                              }}
                              className="px-2 py-1 ml-2 hover:bg-red-100 text-red-600 rounded text-sm transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentSection.type === 'about' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.title}
                      onChange={(e) => updateSection({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={currentSection.content.description}
                      onChange={(e) => updateSection({ description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            updateSection({ image: event.target?.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              )}

              {currentSection.type === 'cta' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.heading}
                      onChange={(e) => updateSection({ heading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.buttonText}
                      onChange={(e) => updateSection({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <input
                      type="color"
                      value={currentSection.content.bgColor}
                      onChange={(e) => updateSection({ bgColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {currentSection.type === 'faq' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.title}
                      onChange={(e) => updateSection({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">FAQ Items</h4>
                      <button
                        onClick={() => {
                          const newItems = [...currentSection.content.items, { question: 'New Question?', answer: 'Answer here' }];
                          updateSection({ items: newItems });
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        + Add Item
                      </button>
                    </div>
                    <div className="space-y-4">
                      {currentSection.content.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Question
                            </label>
                            <input
                              type="text"
                              value={item.question}
                              onChange={(e) => {
                                const newItems = [...currentSection.content.items];
                                newItems[idx].question = e.target.value;
                                updateSection({ items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Answer
                            </label>
                            <textarea
                              value={item.answer}
                              onChange={(e) => {
                                const newItems = [...currentSection.content.items];
                                newItems[idx].answer = e.target.value;
                                updateSection({ items: newItems });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const newItems = currentSection.content.items.filter((_: any, i: number) => i !== idx);
                                updateSection({ items: newItems });
                              }}
                              className="px-2 py-1 ml-2 hover:bg-red-100 text-red-600 rounded text-sm transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentSection.type === 'testimonials' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={currentSection.content.title}
                      onChange={(e) => updateSection({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Testimonials</h4>
                      <button
                        onClick={() => {
                          const newItems = [...currentSection.content.items, { name: 'New User', text: 'User testimonial', rating: 5 }];
                          updateSection({ items: newItems });
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        + Add Testimonial
                      </button>
                    </div>
                    <div className="space-y-4">
                      {currentSection.content.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionRenderer({ section, isSelected, onSelect }: any) {
  const baseClasses = `p-8 rounded-lg cursor-pointer transition border-2 ${
    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
  }`;

  const renderContent = () => {
    switch (section.type) {
      case 'navbar': {
        const [menuOpen, setMenuOpen] = useState(false);
        return (
          <nav style={{ backgroundColor: section.content.bgColor, color: section.content.textColor }} className="px-8 py-4 flex items-center justify-between rounded-lg">
            <div className="font-bold text-lg">{section.content.logo}</div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col gap-1 md:hidden"
            >
              <span className="block w-6 h-0.5" style={{ backgroundColor: section.content.textColor }}></span>
              <span className="block w-6 h-0.5" style={{ backgroundColor: section.content.textColor }}></span>
              <span className="block w-6 h-0.5" style={{ backgroundColor: section.content.textColor }}></span>
            </button>
            <div className={`hidden md:flex gap-6`}>
              {section.content.links.map((link: any, idx: number) => (
                <a key={idx} href={link.url} className="text-sm hover:opacity-75 transition">
                  {link.label}
                </a>
              ))}
            </div>
            <button style={{ backgroundColor: section.content.buttonColor }} className="hidden md:block text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
              {section.content.buttonText}
            </button>
            {menuOpen && (
              <div className="absolute top-16 left-0 right-0 md:hidden p-4 flex flex-col gap-4" style={{ backgroundColor: section.content.bgColor }}>
                {section.content.links.map((link: any, idx: number) => (
                  <a key={idx} href={link.url} className="text-sm hover:opacity-75 transition block">
                    {link.label}
                  </a>
                ))}
                <button style={{ backgroundColor: section.content.buttonColor }} className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition w-full">
                  {section.content.buttonText}
                </button>
              </div>
            )}
          </nav>
        );
      }
      case 'hero':
        return (
          <div
            style={{ backgroundColor: section.content.bgColor }}
            className="p-12 rounded-lg text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{section.content.heading}</h1>
            <p className="text-xl text-gray-600 mb-8">{section.content.subheading}</p>
            <button className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
              {section.content.buttonText}
            </button>
          </div>
        );
      case 'features':
        return (
          <div className="bg-white p-12 rounded-lg">
            <br />
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              {section.content.title}
            </h2>
            <div className="grid grid-cols-3 gap-8">
              {section.content.items.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  {item.icon ? (
                    <img src={item.icon} alt={item.label} className="w-32 h-32 object-cover rounded-lg mb-4" />
                  ) : (
                    <div className="text-6xl mb-4">📷</div>
                  )}
                  <p className="font-medium text-gray-900 text-base">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="bg-white p-12 rounded-lg">
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
            className="p-12 rounded-lg text-center text-white"
          >
            <h2 className="text-3xl font-bold mb-6">{section.content.heading}</h2>
            <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium">
              {section.content.buttonText}
            </button>
          </div>
        );
      case 'faq':
        return (
          <div className="bg-white p-12 rounded-lg">
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
          <div className="bg-gray-50 p-12 rounded-lg">
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
        return <div className="bg-gray-100 p-8 rounded-lg text-gray-600">Preview</div>;
    }
  };

  return (
    <div className={baseClasses} onClick={onSelect}>
      {renderContent()}
    </div>
  );
}

function PreviewMode({ sections }: any) {
  return (
    <div className="w-full">
      {sections.map((section: any) => (
        <SectionRenderer key={section.id} section={section} isSelected={false} onSelect={() => {}} />
      ))}
    </div>
  );
}