'use client';

/**
 * LP Builder AIウィザードモード
 * 質問に答えるだけでAIがLPを自動生成
 */

import { useLPBuilder } from '../../context/lp-builder-context';
import { WizardChat } from './wizard-chat';
import { WizardPreview } from './wizard-preview';

export function AIWizardMode() {
  const { state, actions } = useLPBuilder();

  return (
    <div className="flex h-full">
      {/* チャットエリア */}
      <div className="w-1/2 border-r border-gray-200">
        <WizardChat
          wizardState={state.wizardState}
          onSetAnswer={actions.setWizardAnswer}
          onNext={actions.nextWizardStep}
          onPrev={actions.prevWizardStep}
          onGenerate={actions.generateLPFromWizard}
          onReset={actions.resetWizard}
        />
      </div>

      {/* プレビューエリア */}
      <div className="w-1/2">
        <WizardPreview
          wizardState={state.wizardState}
          components={state.components}
          previewConfig={state.previewConfig}
          onOpenAdvanced={actions.openAdvancedMode}
        />
      </div>
    </div>
  );
}
