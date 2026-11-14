import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';

type ContentObject = Record<string, unknown>;

function isContentObject(value: unknown): value is ContentObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objectAt(value: unknown, key: string): ContentObject {
  const section = isContentObject(value) ? value[key] : undefined;
  return isContentObject(section) ? section : {};
}

function stringAt(value: unknown, key: string): string {
  return isContentObject(value) && typeof value[key] === 'string' ? value[key] as string : '';
}

interface PageContentEditorProps {
  page: 'about' | 'ministries';
  onToast: (type: 'success' | 'error', message: string) => void;
}

export default function PageContentEditor({ page, onToast }: PageContentEditorProps) {
  const [content, setContent] = useState<ContentObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new window.AbortController();
    let active = true;
    setLoading(true);
    setError('');
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    window.fetch(`/api/page-content?page=${page}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const result: unknown = await response.json();
        if (!response.ok) {
          const message = isContentObject(result) && typeof result.error === 'string' ? result.error : 'Unable to load page content.';
          throw new Error(message);
        }
        if (!isContentObject(result) || !isContentObject(result.content)) {
          throw new Error('The server returned invalid page content.');
        }
        if (active) setContent(result.content);
      })
      .catch((loadError: unknown) => {
        if (active) setError(controller.signal.aborted
          ? 'The server took too long to load page content. Retry the tab.'
          : loadError instanceof Error ? loadError.message : 'Unable to load page content.');
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page]);

  const updateSection = (sectionName: string, field: string, value: string) => {
    setContent(previous => {
      if (!previous) return previous;
      return {
        ...previous,
        [sectionName]: { ...objectAt(previous, sectionName), [field]: value },
      };
    });
  };

  const updateRoot = (field: string, value: string) => {
    setContent(previous => previous ? { ...previous, [field]: value } : previous);
  };

  const stats = content && Array.isArray(content.stats)
    ? content.stats.filter(isContentObject)
    : [];
  const values = content && Array.isArray(content.values)
    ? content.values.filter(isContentObject)
    : [];
  const storyBody = objectAt(content, 'story').body;
  const storyParagraphs = Array.isArray(storyBody) ? storyBody.filter(isContentObject) : [];
  const updateValue = (index: number, field: string, value: string) => {
    setContent(previous => {
      if (!previous || !Array.isArray(previous.values)) return previous;
      const next = [...previous.values];
      next[index] = { ...objectAt({ value: next[index] }, 'value'), [field]: value };
      return { ...previous, values: next };
    });
  };
  const updateStat = (index: number, field: string, value: string) => {
    setContent(previous => {
      if (!previous || !Array.isArray(previous.stats)) return previous;
      const next = [...previous.stats];
      next[index] = { ...objectAt({ stat: next[index] }, 'stat'), [field]: value };
      return { ...previous, stats: next };
    });
  };

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setError('');
    const controller = new window.AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await window.fetch(`/api/admin/page-content/${page}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = isContentObject(result) && typeof result.error === 'string' ? result.error : 'Unable to save page content.';
        throw new Error(message);
      }
      onToast('success', `${page === 'about' ? 'About' : 'Ministry'} page saved`);
    } catch (saveError: unknown) {
      const message = controller.signal.aborted
        ? 'The server took too long to save page content. Please retry.'
        : saveError instanceof Error ? saveError.message : 'Unable to save page content.';
      setError(message);
      onToast('error', message);
    } finally {
      window.clearTimeout(timeout);
      setSaving(false);
    }
  };

  const input = (sectionName: string, fieldName: string, label: string, multiline = false) => {
    const value = stringAt(objectAt(content, sectionName), fieldName);
    const id = `${page}-${sectionName}-${fieldName}`;
    return (
      <div className="admin-field admin-field--full" key={id}>
        <label htmlFor={id}>{label}</label>
        {multiline
          ? <textarea id={id} name={id} rows={4} value={value} onChange={event => updateSection(sectionName, fieldName, event.target.value)} />
          : <input id={id} name={id} value={value} onChange={event => updateSection(sectionName, fieldName, event.target.value)} />}
      </div>
    );
  };

  const rootInput = (fieldName: string, label: string, multiline = false) => {
    const value = stringAt(content, fieldName);
    const id = `${page}-${fieldName}`;
    return (
      <div className="admin-field admin-field--full" key={id}>
        <label htmlFor={id}>{label}</label>
        {multiline
          ? <textarea id={id} name={id} rows={4} value={value} onChange={event => updateRoot(fieldName, event.target.value)} />
          : <input id={id} name={id} value={value} onChange={event => updateRoot(fieldName, event.target.value)} />}
      </div>
    );
  };

  if (loading) {
    return <div className="admin-loading-banner" role="status"><Loader2 size={16} className="admin-spin" /> Loading page content…</div>;
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section__title">{page === 'about' ? 'About Page Content' : 'Ministry Page Content'}</h2>
      {error && <div className="admin-error-banner" role="alert">{error}</div>}
      {!content ? (
        <button className="admin-btn admin-btn--primary" onClick={() => window.location.reload()}>Reload content</button>
      ) : page === 'about' ? (
        <>
          <div className="admin-card admin-form-card">
            <h3>Page introduction</h3>
            <div className="admin-form-grid">
              {input('hero', 'eyebrow', 'Eyebrow')}
              {input('hero', 'heading', 'Heading')}
              {input('hero', 'subheading', 'Introduction', true)}
              {input('story', 'heading', 'Our story heading')}
              {input('mission', 'heading', 'Mission heading')}
              {input('mission', 'statement', 'Mission statement', true)}
              {input('mission', 'description', 'Mission detail', true)}
              {input('mission', 'evangelism', 'Evangelism objective', true)}
              {input('mission', 'evangelismReference', 'Evangelism scripture')}
              {input('mission', 'worship', 'Worship objective', true)}
              {input('mission', 'worshipReference', 'Worship scripture')}
              {input('mission', 'discipleship', 'Discipleship objective', true)}
              {input('mission', 'discipleshipReference', 'Discipleship scripture')}
              {input('mission', 'missions', 'Missions objective', true)}
              {input('mission', 'missionsReference', 'Missions scripture')}
              {input('vision', 'heading', 'Vision heading')}
              {input('vision', 'statement', 'Vision statement', true)}
              {input('vision', 'description', 'Vision detail', true)}
              {input('scripture', 'text', 'Scripture text', true)}
              {input('scripture', 'reference', 'Scripture reference')}
              {input('cta', 'heading', 'Closing heading')}
              {input('cta', 'body', 'Closing text', true)}
            </div>
            <div className="admin-field admin-field--full mt-5">
              <label htmlFor="about-story-body">Church history and story</label>
              <textarea
                id="about-story-body"
                name="about-story-body"
                rows={8}
                value={storyParagraphs.map(paragraph => stringAt(paragraph, 'text')).join('\n\n')}
                onChange={event => {
                  const body = event.target.value.split(/\n\s*\n/).map((text, index) => ({
                    id: stringAt(storyParagraphs[index], 'id') || `p${index + 1}`,
                    text,
                  }));
                  setContent(previous => previous ? {
                    ...previous,
                    story: { ...objectAt(previous, 'story'), body },
                  } : previous);
                }}
              />
            </div>
          </div>
          <div className="admin-card admin-form-card">
            <h3>Homepage and About impact statistics</h3>
            <p className="admin-form__hint">These exact values are shared by the homepage and About page.</p>
            <div className="admin-form-grid">
              {stats.map((stat, index) => (
                <div className="admin-field" key={stringAt(stat, 'id') || index}>
                  <label htmlFor={`about-stat-${index}`}>Statistic {index + 1}</label>
                  <input id={`about-stat-${index}`} name={`about-stat-${index}`} value={stringAt(stat, 'value')} onChange={event => updateStat(index, 'value', event.target.value)} />
                </div>
              ))}
              {stats.map((stat, index) => (
                <div className="admin-field" key={`label-${stringAt(stat, 'id') || index}`}>
                  <label htmlFor={`about-stat-label-${index}`}>Statistic {index + 1} label</label>
                  <input id={`about-stat-label-${index}`} name={`about-stat-label-${index}`} value={stringAt(stat, 'label')} onChange={event => updateStat(index, 'label', event.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div className="admin-card admin-form-card">
            <h3>Core values</h3>
            <div className="admin-form-grid">
              {values.map((item, index) => (
                <div className="admin-field admin-field--full" key={stringAt(item, 'id') || index}>
                  <label htmlFor={`about-value-title-${index}`}>Value {index + 1}</label>
                  <input id={`about-value-title-${index}`} name={`about-value-title-${index}`} value={stringAt(item, 'title')} onChange={event => updateValue(index, 'title', event.target.value)} />
                  <label htmlFor={`about-value-description-${index}`}>Description</label>
                  <textarea id={`about-value-description-${index}`} name={`about-value-description-${index}`} rows={2} value={stringAt(item, 'description')} onChange={event => updateValue(index, 'description', event.target.value)} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="admin-card admin-form-card">
          <h3>Featured ministry page details</h3>
          <p className="admin-form__hint">Edit the page introduction and closing call to action here. Edit individual featured ministry cards in the Ministries tab.</p>
          <div className="admin-form-grid">
            {rootInput('intro', 'Page introduction', true)}
            {input('scripture', 'text', 'Scripture text', true)}
            {input('scripture', 'reference', 'Scripture reference')}
            {input('volunteerCta', 'heading', 'Closing heading')}
            {input('volunteerCta', 'body', 'Closing text', true)}
            {input('volunteerCta', 'buttonLabel', 'Button label')}
            {input('volunteerCta', 'buttonHref', 'Button link')}
          </div>
        </div>
      )}
      {content && <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save page content
        </button>
      </div>}
    </div>
  );
}
