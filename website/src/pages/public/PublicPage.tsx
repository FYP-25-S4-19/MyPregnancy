import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { websiteAPI } from '../../lib/api';

export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-page', slug],
    queryFn: () => websiteAPI.getPublicPage(slug!).then(res => res.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Inject CSS */}
      <style dangerouslySetInnerHTML={{ __html: data.css }} />
      
      {/* Inject HTML */}
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
    </div>
  );
}