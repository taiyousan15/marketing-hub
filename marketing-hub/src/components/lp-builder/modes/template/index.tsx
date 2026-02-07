'use client';

/**
 * LP Builder テンプレートモード
 * プロのテンプレートから選んでインライン編集
 */

import { useState } from 'react';
import { useLPBuilder } from '../../context/lp-builder-context';
import { TemplateGallery } from './template-gallery';
import { InlineEditor } from './inline-editor';

export function TemplateMode() {
  const { state, actions } = useLPBuilder();
  const [view, setView] = useState<'gallery' | 'editor'>(
    state.templateState.selectedTemplate ? 'editor' : 'gallery'
  );

  const handleSelectTemplate = (template: any) => {
    actions.selectTemplate(template);
    setView('editor');
  };

  const handleBackToGallery = () => {
    setView('gallery');
  };

  if (view === 'gallery' || !state.templateState.selectedTemplate) {
    return <TemplateGallery onSelectTemplate={handleSelectTemplate} />;
  }

  return (
    <InlineEditor
      template={state.templateState.selectedTemplate}
      components={state.templateState.editedComponents}
      onBackToGallery={handleBackToGallery}
      onOpenAdvanced={actions.openAdvancedMode}
    />
  );
}
