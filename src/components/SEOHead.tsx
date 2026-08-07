/**
 * SEOHead Component
 * Provides dynamic meta tags for SEO optimization
 */

import { useEffect, memo } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
  canonical?: string;
  jsonLd?: Record<string, unknown>;
}

const DEFAULT_TITLE = 'Task Gifts - Gamificação Corporativa';
const DEFAULT_DESCRIPTION = 'Plataforma de gamificação e treinamento corporativo. Engaje sua equipe com quests, conquistas, ligas e recompensas.';
const DEFAULT_KEYWORDS = [
  'gamificação',
  'gamification',
  'treinamento corporativo',
  'engajamento',
  'RH',
  'recursos humanos',
  'employee engagement',
  'corporate training',
  'quests',
  'conquistas',
  'achievements',
  'ligas',
  'leaderboard',
  'ranking',
];
const BASE_URL = 'https://taskgifts.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Updates document head meta tags dynamically
 */
export const SEOHead = memo(function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  canonical,
  jsonLd,
}: SEOHeadProps) {
  const location = useLocation();
  
  const fullTitle = title 
    ? `${title} | Task Gifts` 
    : DEFAULT_TITLE;
  
  const currentUrl = canonical || `${BASE_URL}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property 
        ? `meta[property="${name}"]` 
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords.join(', '));
    updateMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', image, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', 'Task Gifts', true);
    updateMeta('og:locale', 'pt_BR', true);

    // Twitter Card tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Add JSON-LD structured data
    if (jsonLd) {
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        ...jsonLd,
      });
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      const seoScript = document.querySelector('script[data-seo-jsonld]');
      if (seoScript) {
        seoScript.remove();
      }
    };
  }, [fullTitle, description, keywords, image, currentUrl, type, noindex, jsonLd]);

  return null;
});

/**
 * Pre-built JSON-LD schemas for common page types
 */
export const createOrganizationSchema = () => ({
  '@type': 'Organization',
  name: 'Task Gifts',
  description: DEFAULT_DESCRIPTION,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: [
    'https://linkedin.com/company/taskgifts',
    'https://twitter.com/taskgifts',
  ],
});

export const createBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${BASE_URL}${item.url}`,
  })),
});

export const createArticleSchema = (article: {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  modifiedDate?: string;
  image?: string;
}) => ({
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  author: {
    '@type': 'Person',
    name: article.author,
  },
  datePublished: article.publishDate,
  dateModified: article.modifiedDate || article.publishDate,
  image: article.image || DEFAULT_IMAGE,
  publisher: createOrganizationSchema(),
});

export const createFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const createProductSchema = (product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}) => ({
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image,
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency || 'BRL',
    availability: `https://schema.org/${product.availability || 'InStock'}`,
  },
});
