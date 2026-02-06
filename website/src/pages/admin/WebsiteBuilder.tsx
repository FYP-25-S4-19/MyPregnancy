import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { websiteAPI } from "../../lib/api";
import { Save, Eye, ArrowLeft, Plus, Trash2, Copy, Settings, GripVertical, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TestimonialsWidget from "../../components/TestimonialsWidget";

interface Section {
  id: string;
  type: "navbar" | "hero" | "features" | "about" | "cta" | "faq" | "testimonials";
  title: string;
  content: any;
}

export default function WebsiteBuilder() {
  const editorRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [selectedPage, _] = useState<string>("home");
  const [editor, setEditor] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([
    {
      id: "1",
      type: "hero",
      title: "Hero Section",
      content: {
        heading: "Welcome to MyPregnancy",
        subheading: "Your pregnancy companion",
        buttonText: "Get Started",
        bgColor: "#FFE8E0",
      },
    },
  ]);
  const [selectedSection, setSelectedSection] = useState<string | null>("1");
  const [showPreview, setShowPreview] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: currentPageData } = useQuery({
    queryKey: ["page", selectedPage],
    queryFn: () => websiteAPI.getPage(selectedPage).then((res) => res.data),
    enabled: !!selectedPage,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to refetch when navigating back
  });

  const currentPage = currentPageData?.page;

  const saveMutation = useMutation({
    mutationFn: (data: any) => websiteAPI.updatePage(selectedPage, data),
    onSuccess: async () => {
      alert("Website saved successfully!");
      // Invalidate and refetch the page data
      await queryClient.invalidateQueries({ queryKey: ["page", selectedPage] });
      // Reload background image to ensure it's in sync
      try {
        const response = await websiteAPI.getBackgroundImageUrl(selectedPage);
        const imgUrl = response.data.s3_key;
        if (imgUrl) {
          setBackgroundImage(imgUrl);
        }
      } catch (error) {
        console.error("Failed to reload background image after save:", error);
      }
    },
    onError: () => {
      alert("Failed to save website");
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined" && editorRef.current && !editor) {
      import("grapesjs").then((grapesjs) => {
        import("grapesjs-preset-webpage").then(() => {
          const editorInstance = grapesjs.default.init({
            container: editorRef.current!,
            plugins: ["gjs-preset-webpage"],
            pluginsOpts: {
              "gjs-preset-webpage": {},
            },
            storageManager: false,
            height: "100%",
            width: "100%",
            canvas: {
              styles: ["https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"],
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
        const components = JSON.parse(currentPage.grapesjs_components || "[]");
        const styles = JSON.parse(currentPage.grapesjs_styles || "[]");
        editor.setComponents(components);
        editor.setStyle(styles);
      } catch (e) {
        console.error("Failed to load page content", e);
      }
    }
  }, [editor, currentPage]);

  // Load background image from S3 when page changes
  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (selectedPage) {
        try {
          const response = await websiteAPI.getBackgroundImageUrl(selectedPage);
          // Use s3_key which contains the full public URL
          const imgUrl = response.data.s3_key;
          if (imgUrl) {
            setBackgroundImage(imgUrl);
          } else {
            setBackgroundImage("");
          }
        } catch (error) {
          console.error("Failed to load background image:", error);
          setBackgroundImage("");
        }
      }
    };

    loadBackgroundImage();
  }, [selectedPage]);

  // Load sections from backend when page data is available
  useEffect(() => {
    if (currentPage?.sections) {
      try {
        const loadedSections = JSON.parse(currentPage.sections);
        if (Array.isArray(loadedSections) && loadedSections.length > 0) {
          setSections(loadedSections);
          // Set first section as selected if none selected (only on initial load)
          setSelectedSection((current) => {
            if (!current && loadedSections[0]) {
              return loadedSections[0].id;
            }
            return current;
          });
        }
      } catch (error) {
        console.error("Failed to parse sections:", error);
      }
    }
  }, [currentPage]);

  const sectionTemplates = [
    { type: "navbar", label: "Navbar" },
    { type: "hero", label: "Hero Section" },
    { type: "features", label: "Features" },
    { type: "about", label: "About" },
    { type: "cta", label: "Call to Action" },
    { type: "faq", label: "FAQ" },
    { type: "testimonials", label: "Testimonials" },
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
        logo: "MyBrand",
        bgColor: "#FFFFFF",
        textColor: "#000000",
        links: [
          { label: "Home", url: "#" },
          { label: "About", url: "#" },
          { label: "Features", url: "#" },
          { label: "Contact", url: "#" },
        ],
        buttonText: "Get Started",
        buttonColor: "#3B82F6",
      },
      hero: {
        heading: "Your Headline Here",
        subheading: "Add your subtitle",
        buttonText: "Learn More",
        bgColor: "#FFE8E0",
      },
      features: {
        title: "Our Features",
        items: [
          { icon: "", label: "Feature 1" },
          { icon: "", label: "Feature 2" },
          { icon: "", label: "Feature 3" },
        ],
      },
      about: {
        title: "About Us",
        description: "Tell your story here...",
        image: "/placeholder.jpg",
      },
      cta: {
        heading: "Ready to Get Started?",
        buttonText: "Sign Up Now",
        bgColor: "#F0A3A3",
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          { question: "Question 1?", answer: "Answer here" },
          { question: "Question 2?", answer: "Answer here" },
        ],
      },
      testimonials: {
        title: "What Users Say",
        useBackend: true,
        minRating: 4,
        maxRating: 5,
        sortBy: "highest",
        limit: 10,
        showStats: true,
        autoRotate: true,
        rotateInterval: 5000,
        // Fallback/manual items when not using backend
        items: [
          { name: "User 1", text: "Great product!", rating: 5 },
          { name: "User 2", text: "Highly recommend!", rating: 5 },
        ],
      },
    };
    return defaults[type];
  };

  const currentSection = sections.find((s) => s.id === selectedSection);

  const updateSection = (updates: any) => {
    setSections(sections.map((s) => (s.id === selectedSection ? { ...s, content: { ...s.content, ...updates } } : s)));
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

  if (showPreview) {
    return (
      <div
        className="min-h-screen bg-white"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
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
        <button onClick={() => navigate("/admin/dashboard")} className="mb-6 text-sm text-gray-600 hover:text-gray-900">
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
                  [newSections[draggedIndex], newSections[targetIndex]] = [
                    newSections[targetIndex],
                    newSections[draggedIndex],
                  ];
                  setSections(newSections);
                  setDraggedSectionId(null);
                }
              }}
              onDragEnd={() => setDraggedSectionId(null)}
              className={`p-3 rounded-lg border-2 cursor-move transition ${
                draggedSectionId === section.id
                  ? "border-yellow-400 bg-yellow-50 opacity-50"
                  : selectedSection === section.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
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
            <label
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                uploadingBackground
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-900 cursor-pointer"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadingBackground(true);
                    try {
                      // Upload to S3
                      await websiteAPI.uploadBackgroundImage(selectedPage, file);

                      // Fetch the presigned URL to display
                      const response = await websiteAPI.getBackgroundImageUrl(selectedPage);
                      // Use s3_key which contains the full public URL
                      const imgUrl = response.data.s3_key;
                      setBackgroundImage(imgUrl);

                      // Invalidate query cache to ensure data consistency
                      await queryClient.invalidateQueries({ queryKey: ["page", selectedPage] });

                      alert("Background image uploaded successfully!");
                    } catch (error) {
                      console.error("Failed to upload background image:", error);
                      alert("Failed to upload background image. Please try again.");
                    } finally {
                      setUploadingBackground(false);
                    }
                  }
                }}
                disabled={uploadingBackground}
                className="hidden"
              />
              <span className="text-sm font-medium">{uploadingBackground ? "Uploading..." : "Background Image"}</span>
            </label>
            {backgroundImage && !uploadingBackground && (
              <button
                onClick={async () => {
                  if (confirm("Remove background image?")) {
                    try {
                      await websiteAPI.updatePage(selectedPage, {
                        sections: sections,
                        background_image: null,
                      });
                      setBackgroundImage("");
                      // Invalidate query cache to ensure data consistency
                      await queryClient.invalidateQueries({ queryKey: ["page", selectedPage] });
                      alert("Background image removed successfully!");
                    } catch (error) {
                      console.error("Failed to remove background:", error);
                      alert("Failed to remove background image");
                    }
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2"
                title="Remove background image"
              >
                <Trash2 size={16} />
                <span className="text-sm font-medium">Remove BG</span>
              </button>
            )}
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
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex overflow-hidden min-h-screen">
          {/* Canvas */}
          <div
            className="flex-1 overflow-y-auto p-6 bg-gray-100"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          >
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

              {currentSection.type === "navbar" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo/Brand Name</label>
                    <input
                      type="text"
                      value={currentSection.content.logo}
                      onChange={(e) => updateSection({ logo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <input
                      type="color"
                      value={currentSection.content.bgColor}
                      onChange={(e) => updateSection({ bgColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <input
                      type="color"
                      value={currentSection.content.textColor}
                      onChange={(e) => updateSection({ textColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={currentSection.content.buttonText}
                      onChange={(e) => updateSection({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
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
                          const newLinks = [...currentSection.content.links, { label: "New Link", url: "#" }];
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

              {currentSection.type === "hero" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
                    <input
                      type="text"
                      value={currentSection.content.heading}
                      onChange={(e) => updateSection({ heading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subheading</label>
                    <input
                      type="text"
                      value={currentSection.content.subheading}
                      onChange={(e) => updateSection({ subheading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={currentSection.content.buttonText}
                      onChange={(e) => updateSection({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <input
                      type="color"
                      value={currentSection.content.bgColor}
                      onChange={(e) => updateSection({ bgColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {currentSection.type === "features" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
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
                          const newItems = [...currentSection.content.items, { icon: "", label: "New Feature" }];
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
                            <label className="block text-xs font-medium text-gray-700 mb-2">Icon/Image</label>
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

              {currentSection.type === "about" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={currentSection.content.title}
                      onChange={(e) => updateSection({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={currentSection.content.description}
                      onChange={(e) => updateSection({ description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
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

              {currentSection.type === "cta" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heading</label>
                    <input
                      type="text"
                      value={currentSection.content.heading}
                      onChange={(e) => updateSection({ heading: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={currentSection.content.buttonText}
                      onChange={(e) => updateSection({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <input
                      type="color"
                      value={currentSection.content.bgColor}
                      onChange={(e) => updateSection({ bgColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {currentSection.type === "faq" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
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
                          const newItems = [
                            ...currentSection.content.items,
                            { question: "New Question?", answer: "Answer here" },
                          ];
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
                            <label className="block text-xs font-medium text-gray-700 mb-2">Question</label>
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
                            <label className="block text-xs font-medium text-gray-700 mb-2">Answer</label>
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

              {currentSection.type === "testimonials" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                    <input
                      type="text"
                      value={currentSection.content.title}
                      onChange={(e) => updateSection({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Toggle Backend Source */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Use backend feedback</label>
                    <input
                      type="checkbox"
                      checked={!!currentSection.content.useBackend}
                      onChange={(e) => updateSection({ useBackend: e.target.checked })}
                    />
                  </div>

                  {currentSection.content.useBackend ? (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <h4 className="font-medium text-gray-900">Backend Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={currentSection.content.minRating}
                            onChange={(e) => updateSection({ minRating: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max Rating</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={currentSection.content.maxRating}
                            onChange={(e) => updateSection({ maxRating: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Limit</label>
                          <input
                            type="number"
                            min={1}
                            value={currentSection.content.limit}
                            onChange={(e) => updateSection({ limit: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                          <select
                            value={currentSection.content.sortBy}
                            onChange={(e) => updateSection({ sortBy: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="highest">Highest</option>
                            <option value="lowest">Lowest</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!currentSection.content.showStats}
                            onChange={(e) => updateSection({ showStats: e.target.checked })}
                          />
                          <label className="text-sm text-gray-700">Show statistics</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!currentSection.content.autoRotate}
                            onChange={(e) => updateSection({ autoRotate: e.target.checked })}
                          />
                          <label className="text-sm text-gray-700">Auto-rotate carousel</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rotate Interval (ms)</label>
                          <input
                            type="number"
                            min={1000}
                            step={500}
                            value={currentSection.content.rotateInterval}
                            onChange={(e) => updateSection({ rotateInterval: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Testimonials</h4>
                        <button
                          onClick={() => {
                            const newItems = [
                              ...currentSection.content.items,
                              { name: "New User", text: "User testimonial", rating: 5 },
                            ];
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
                                <span key={i} className="text-yellow-400">
                                  ★
                                </span>
                              ))}
                            </div>
                            <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                            <p className="font-semibold text-gray-900">— {item.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
  const baseClasses =
    section.type === "navbar"
      ? `rounded-none cursor-pointer transition border-0 ${
          isSelected ? "ring-2 ring-blue-200" : ""
        } sticky top-0 z-40 w-full`
      : `p-8 rounded-lg cursor-pointer transition border-2 ${
          isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300 hover:border-gray-400"
        }`;

  const renderContent = () => {
    switch (section.type) {
      case "navbar": {
        const [menuOpen, setMenuOpen] = useState(false);
        return (
          <div
            style={{ backgroundColor: section.content.bgColor, color: section.content.textColor }}
            className="w-full border-b border-gray-200/70 bg-white/90 backdrop-blur"
          >
            <nav className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
              <div className="font-bold text-lg">{section.content.logo}</div>
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex flex-col gap-1 md:hidden">
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
              <button
                style={{ backgroundColor: section.content.buttonColor }}
                className="hidden md:block text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                {section.content.buttonText}
              </button>
            </nav>
            {menuOpen && (
              <div
                className="max-w-6xl mx-auto px-8 pb-4 md:hidden flex flex-col gap-4"
                style={{ backgroundColor: section.content.bgColor }}
              >
                {section.content.links.map((link: any, idx: number) => (
                  <a key={idx} href={link.url} className="text-sm hover:opacity-75 transition block">
                    {link.label}
                  </a>
                ))}
                <button
                  style={{ backgroundColor: section.content.buttonColor }}
                  className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition w-full"
                >
                  {section.content.buttonText}
                </button>
              </div>
            )}
          </div>
        );
      }
      case "hero":
        return (
          <div style={{ backgroundColor: section.content.bgColor }} className="p-12 rounded-lg text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{section.content.heading}</h1>
            <p className="text-xl text-gray-600 mb-8">{section.content.subheading}</p>
            <button className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
              {section.content.buttonText}
            </button>
          </div>
        );
      case "features":
        return (
          <div className="bg-white p-12 rounded-lg">
            <br />
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">{section.content.title}</h2>
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
      case "about":
        return (
          <div className="bg-white p-12 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{section.content.title}</h2>
            <p className="text-gray-700 leading-relaxed">{section.content.description}</p>
            {section.content.image && (
              <img src={section.content.image} alt="About" className="mt-6 w-full rounded-lg max-h-96 object-cover" />
            )}
          </div>
        );
      case "cta":
        return (
          <div style={{ backgroundColor: section.content.bgColor }} className="p-12 rounded-lg text-center text-white">
            <h2 className="text-3xl font-bold mb-6">{section.content.heading}</h2>
            <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium">
              {section.content.buttonText}
            </button>
          </div>
        );
      case "faq":
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
      case "testimonials":
        return (
          <div className="bg-gray-50 p-12 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.content.title}</h2>
            {section.content.useBackend ? (
              <div className="max-w-5xl mx-auto">
                <TestimonialsWidget
                  minRating={section.content.minRating}
                  maxRating={section.content.maxRating}
                  sortBy={section.content.sortBy}
                  limit={section.content.limit}
                  showStats={section.content.showStats}
                  autoRotate={section.content.autoRotate}
                  rotateInterval={section.content.rotateInterval}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {section.content.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex gap-1 mb-2">
                      {[...Array(item.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{item.text}"</p>
                    <p className="font-semibold text-gray-900">— {item.name}</p>
                  </div>
                ))}
              </div>
            )}
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
